/**
 * Enhanced Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures when external services experience issues
 * by automatically detecting failures and temporarily disabling requests.
 */

export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation, requests flow through
  OPEN = "OPEN", // Circuit is open, requests are blocked
  HALF_OPEN = "HALF_OPEN", // Testing if service has recovered
}

interface CircuitBreakerOptions {
  failureThreshold: number // Number of failures before opening circuit
  resetTimeout: number // Time in ms before attempting reset (half-open)
  maxRetries: number // Maximum number of retries for a single request
  retryDelay: number // Base delay between retries in ms
  timeout: number // Request timeout in ms
  onStateChange?: (from: CircuitState, to: CircuitState, serviceName: string) => void // State change callback
  onSuccess?: (serviceName: string) => void // Success callback
  onFailure?: (error: Error, serviceName: string) => void // Failure callback
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 10000, // 10 seconds
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failures = 0
  private resetTimer: NodeJS.Timeout | null = null
  private options: CircuitBreakerOptions
  private lastError: Error | null = null
  private successCounter = 0
  private readonly name: string
  private lastAttempt: number = Date.now()
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rejectedRequests: 0,
    lastResponseTime: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
  }

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, context = "default"): Promise<T> {
    this.metrics.totalRequests++

    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (Date.now() - this.lastAttempt >= this.options.resetTimeout) {
        this.changeState(CircuitState.HALF_OPEN)
      } else {
        this.metrics.rejectedRequests++
        throw new Error(`Circuit ${this.name} is OPEN (${context}). Request rejected.`)
      }
    }

    this.lastAttempt = Date.now()

    try {
      // If in half-open state, we're testing the service
      if (this.state === CircuitState.HALF_OPEN) {
        console.log(`Circuit ${this.name} is HALF_OPEN. Testing service... (${context})`)
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${this.options.timeout}ms`)), this.options.timeout)
      })

      // Execute the function with timeout
      const startTime = Date.now()
      const result = await Promise.race([this.executeWithRetry(fn, context), timeoutPromise])
      const responseTime = Date.now() - startTime

      // Update metrics
      this.metrics.lastResponseTime = responseTime
      this.metrics.totalResponseTime += responseTime
      this.metrics.successfulRequests++
      this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.successfulRequests

      // On success, reset failure count and close circuit if in half-open state
      this.recordSuccess(context)
      return result
    } catch (error) {
      // Record the failure and possibly open the circuit
      this.metrics.failedRequests++
      this.recordFailure(error as Error, context)
      throw error
    }
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, context: string, retryCount = 0): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retryCount >= this.options.maxRetries) {
        throw error
      }

      // Calculate exponential backoff delay
      const delay = this.options.retryDelay * Math.pow(2, retryCount)

      console.log(
        `Retry ${retryCount + 1}/${this.options.maxRetries} for circuit ${this.name} (${context}) after ${delay}ms`,
      )

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry the operation
      return this.executeWithRetry(fn, context, retryCount + 1)
    }
  }

  /**
   * Record a successful execution
   */
  private recordSuccess(context: string): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCounter++

      // If we've had enough successes in half-open state, close the circuit
      if (this.successCounter >= 2) {
        // Require 2 successful requests to close circuit
        this.changeState(CircuitState.CLOSED)
        this.failures = 0
        this.successCounter = 0
      }
    } else {
      // In closed state, just reset failures
      this.failures = 0
    }

    if (this.options.onSuccess) {
      this.options.onSuccess(this.name)
    }
  }

  /**
   * Record a failed execution
   */
  private recordFailure(error: Error, context: string): void {
    this.lastError = error
    this.failures++

    if (this.options.onFailure) {
      this.options.onFailure(error, this.name)
    }

    if (
      this.state === CircuitState.HALF_OPEN ||
      (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold)
    ) {
      this.changeState(CircuitState.OPEN)

      // Set timer to attempt reset
      if (this.resetTimer) {
        clearTimeout(this.resetTimer)
      }

      this.resetTimer = setTimeout(() => {
        this.changeState(CircuitState.HALF_OPEN)
        this.successCounter = 0
      }, this.options.resetTimeout)
    }
  }

  /**
   * Change the state of the circuit breaker
   */
  private changeState(newState: CircuitState): void {
    const previousState = this.state
    this.state = newState

    console.log(`Circuit ${this.name} state changed from ${previousState} to ${newState}`)

    if (this.options.onStateChange) {
      this.options.onStateChange(previousState, newState, this.name)
    }
  }

  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get the last error that occurred
   */
  getLastError(): Error | null {
    return this.lastError
  }

  /**
   * Get circuit metrics
   */
  getMetrics(): any {
    return {
      ...this.metrics,
      state: this.state,
      failures: this.failures,
      name: this.name,
    }
  }

  /**
   * Force reset the circuit to closed state
   */
  reset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer)
      this.resetTimer = null
    }

    this.changeState(CircuitState.CLOSED)
    this.failures = 0
    this.successCounter = 0
    this.lastError = null
  }
}

// Circuit breaker registry to manage multiple circuit breakers
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map()

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options))
    }
    return this.breakers.get(name)!
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return this.breakers
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset())
  }

  /**
   * Get metrics for all circuit breakers
   */
  getAllMetrics(): any[] {
    return Array.from(this.breakers.values()).map((breaker) => breaker.getMetrics())
  }
}

// Export singleton instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry()

// Helper function to wrap API calls with circuit breaker
export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  breakerName = "default",
  context = "default",
  options?: Partial<CircuitBreakerOptions>,
): Promise<T> {
  const breaker = circuitBreakerRegistry.getBreaker(breakerName, options)
  return breaker.execute(fn, context)
}
