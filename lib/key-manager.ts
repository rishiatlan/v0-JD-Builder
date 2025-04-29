// Key Manager for API key rotation and load balancing

interface KeyStatus {
  key: string
  usageCount: number
  lastUsed: number
  isAvailable: boolean
  errorCount: number
  cooldownUntil: number
}

export class KeyManager {
  private keys: KeyStatus[] = []
  private currentKeyIndex = 0
  private readonly maxErrorCount: number = 3
  private readonly cooldownPeriod: number = 60000 // 1 minute cooldown

  constructor(apiKeys: string[]) {
    // Initialize keys with their status
    this.keys = apiKeys.map((key) => ({
      key,
      usageCount: 0,
      lastUsed: 0,
      isAvailable: true,
      errorCount: 0,
      cooldownUntil: 0,
    }))
  }

  // Get the next available key using a round-robin approach with availability check
  public getNextKey(): string | null {
    const now = Date.now()

    // Reset cooldown for keys if their cooldown period has passed
    this.keys.forEach((keyStatus) => {
      if (!keyStatus.isAvailable && now > keyStatus.cooldownUntil) {
        keyStatus.isAvailable = true
        keyStatus.errorCount = 0
      }
    })

    // Find the next available key
    let attempts = 0
    while (attempts < this.keys.length) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length
      const keyStatus = this.keys[this.currentKeyIndex]

      if (keyStatus.isAvailable) {
        keyStatus.usageCount++
        keyStatus.lastUsed = now
        return keyStatus.key
      }

      attempts++
    }

    // If no keys are available, return null
    return null
  }

  // Report a successful API call with the given key
  public reportSuccess(key: string): void {
    const keyStatus = this.keys.find((k) => k.key === key)
    if (keyStatus) {
      keyStatus.errorCount = 0 // Reset error count on success
    }
  }

  // Report an error with the given key
  public reportError(key: string): void {
    const keyStatus = this.keys.find((k) => k.key === key)
    if (keyStatus) {
      keyStatus.errorCount++

      // If error count exceeds threshold, put the key in cooldown
      if (keyStatus.errorCount >= this.maxErrorCount) {
        keyStatus.isAvailable = false
        keyStatus.cooldownUntil = Date.now() + this.cooldownPeriod
        console.log(
          `Key ${key.substring(0, 8)}... put in cooldown until ${new Date(keyStatus.cooldownUntil).toISOString()}`,
        )
      }
    }
  }

  // Get status of all keys for monitoring
  public getKeysStatus(): Array<Omit<KeyStatus, "key"> & { keyPrefix: string }> {
    return this.keys.map(({ key, ...rest }) => ({
      ...rest,
      keyPrefix: key.substring(0, 8) + "...", // Only return a prefix of the key for security
    }))
  }
}

// Initialize the key manager with the available API keys
let keyManagerInstance: KeyManager | null = null

export function getKeyManager(): KeyManager {
  if (!keyManagerInstance) {
    // Get all available API keys from environment variables
    const apiKeys: string[] = []

    // Primary key
    if (process.env.GEMINI_API_KEY) {
      apiKeys.push(process.env.GEMINI_API_KEY)
    }

    // Additional keys
    if (process.env.GEMINI_API_KEY_2) {
      apiKeys.push(process.env.GEMINI_API_KEY_2)
    }

    if (process.env.GEMINI_API_KEY_3) {
      apiKeys.push(process.env.GEMINI_API_KEY_3)
    }

    if (apiKeys.length === 0) {
      throw new Error("No API keys available for Gemini")
    }

    keyManagerInstance = new KeyManager(apiKeys)
    console.log(`Key manager initialized with ${apiKeys.length} API keys`)
  }

  return keyManagerInstance
}
