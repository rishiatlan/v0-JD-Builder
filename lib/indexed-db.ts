/**
 * Enhanced IndexedDB Storage Service
 *
 * Provides a persistent storage solution using IndexedDB with fallback to
 * session storage. Supports storing large documents and JD data with
 * automatic compression for efficiency.
 */

import { compressString, decompressString } from "./memory-optimization"
import { withCircuitBreaker } from "./circuit-breaker"

// Define database structure
interface DBSchema {
  documents: {
    key: string
    value: {
      id: string
      content: string
      metadata: any
      timestamp: number
      compressed?: boolean
    }
  }
  jobDescriptions: {
    key: string
    value: {
      id: string
      data: any
      timestamp: number
    }
  }
  cache: {
    key: string
    value: {
      key: string
      data: any
      timestamp: number
      expiry?: number
    }
  }
  settings: {
    key: string
    value: any
  }
}

// Storage options
interface StorageOptions {
  compress?: boolean
  expiry?: number // Time in ms until the item expires
  priority?: "high" | "normal" | "low" // Priority for circuit breaker
}

// Storage metrics
interface StorageMetrics {
  reads: number
  writes: number
  deletes: number
  errors: number
  cacheHits: number
  cacheMisses: number
  compressionRatio: number
  averageReadTime: number
  averageWriteTime: number
  totalStorageSize: number
}

class IndexedDBStorage {
  private readonly DB_NAME = "atlan-jd-builder"
  private readonly DB_VERSION = 1
  private db: IDBDatabase | null = null
  private isInitialized = false
  private initPromise: Promise<boolean> | null = null
  private readonly STORES = ["documents", "jobDescriptions", "cache", "settings"]
  private fallbackMode = false
  private metrics: StorageMetrics = {
    reads: 0,
    writes: 0,
    deletes: 0,
    errors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    compressionRatio: 1,
    averageReadTime: 0,
    averageWriteTime: 0,
    totalStorageSize: 0,
  }
  private memoryCache = new Map<string, { data: any; timestamp: number; expiry?: number }>()

  constructor() {
    // Check if IndexedDB is supported
    this.fallbackMode = !this.isIndexedDBSupported()
  }

  /**
   * Check if IndexedDB is supported in this browser
   */
  private isIndexedDBSupported(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window
  }

  /**
   * Initialize the database
   */
  async init(): Promise<boolean> {
    // If already initialized or initializing, return the promise
    if (this.isInitialized) return true
    if (this.initPromise) return this.initPromise

    // If IndexedDB is not supported, use fallback mode
    if (this.fallbackMode) {
      console.warn("IndexedDB not supported, using session storage fallback")
      this.isInitialized = true
      return true
    }

    this.initPromise = new Promise<boolean>((resolve, reject) => {
      try {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains("documents")) {
            db.createObjectStore("documents", { keyPath: "id" })
          }

          if (!db.objectStoreNames.contains("jobDescriptions")) {
            db.createObjectStore("jobDescriptions", { keyPath: "id" })
          }

          if (!db.objectStoreNames.contains("cache")) {
            const cacheStore = db.createObjectStore("cache", { keyPath: "key" })
            cacheStore.createIndex("expiry", "expiry")
          }

          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "key" })
          }
        }

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result
          this.isInitialized = true
          console.log("IndexedDB initialized successfully")

          // Set up periodic cleanup of expired items
          this.setupExpiryCleanup()

          // Calculate storage size
          this.calculateStorageSize()

          resolve(true)
        }

        request.onerror = (event) => {
          console.error("IndexedDB initialization error:", (event.target as IDBOpenDBRequest).error)
          this.fallbackMode = true
          this.metrics.errors++
          resolve(false)
        }
      } catch (error) {
        console.error("Error initializing IndexedDB:", error)
        this.fallbackMode = true
        this.metrics.errors++
        resolve(false)
      }
    })

    return this.initPromise
  }

  /**
   * Calculate total storage size
   */
  private async calculateStorageSize(): Promise<void> {
    if (this.fallbackMode || !this.db) return

    try {
      let totalSize = 0

      for (const storeName of this.STORES) {
        const transaction = this.db.transaction([storeName], "readonly")
        const store = transaction.objectStore(storeName)
        const request = store.getAll()

        await new Promise<void>((resolve) => {
          request.onsuccess = () => {
            const items = request.result
            for (const item of items) {
              totalSize += this.estimateObjectSize(item)
            }
            resolve()
          }
          request.onerror = () => resolve()
        })
      }

      this.metrics.totalStorageSize = totalSize
    } catch (error) {
      console.error("Error calculating storage size:", error)
    }
  }

  /**
   * Estimate the size of an object in bytes
   */
  private estimateObjectSize(obj: any): number {
    const json = JSON.stringify(obj)
    return json.length * 2 // Rough estimate: 2 bytes per character
  }

  /**
   * Set up periodic cleanup of expired items
   */
  private setupExpiryCleanup(): void {
    // Clean up expired items every 5 minutes
    setInterval(() => this.cleanupExpiredItems(), 5 * 60 * 1000)

    // Clean up memory cache every minute
    setInterval(() => this.cleanupMemoryCache(), 60 * 1000)
  }

  /**
   * Clean up expired items from the cache
   */
  async cleanupExpiredItems(): Promise<void> {
    if (this.fallbackMode || !this.db) return

    try {
      const now = Date.now()
      const transaction = this.db.transaction(["cache"], "readwrite")
      const store = transaction.objectStore("cache")
      const index = store.index("expiry")

      // Get all items that have expired
      const request = index.openCursor(IDBKeyRange.upperBound(now))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          // Delete the expired item
          store.delete(cursor.primaryKey)
          this.metrics.deletes++
          cursor.continue()
        }
      }
    } catch (error) {
      console.error("Error cleaning up expired items:", error)
      this.metrics.errors++
    }
  }

  /**
   * Clean up expired items from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now()

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry && value.expiry < now) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * Store a document
   */
  async storeDocument(id: string, content: string, metadata: any = {}, options: StorageOptions = {}): Promise<boolean> {
    const startTime = Date.now()
    await this.init()

    const timestamp = Date.now()
    let processedContent = content
    let compressed = false
    const originalSize = content.length
    let compressedSize = originalSize

    // Compress content if option is enabled and content is large
    if (options.compress !== false && content.length > 10000) {
      processedContent = compressString(content)
      compressedSize = processedContent.length
      compressed = true

      // Update compression ratio metric
      if (compressedSize < originalSize) {
        const ratio = originalSize / compressedSize
        this.metrics.compressionRatio = (this.metrics.compressionRatio + ratio) / 2 // Running average
      }
    }

    try {
      if (this.fallbackMode) {
        // Use session storage as fallback
        sessionStorage.setItem(
          `document_${id}`,
          JSON.stringify({
            id,
            content: processedContent,
            metadata,
            timestamp,
            compressed,
          }),
        )
        this.metrics.writes++

        // Update write time metric
        const writeTime = Date.now() - startTime
        this.metrics.averageWriteTime =
          (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

        return true
      }

      if (!this.db) return false

      return await withCircuitBreaker(
        async () => {
          return new Promise<boolean>((resolve) => {
            try {
              const transaction = this.db!.transaction(["documents"], "readwrite")
              const store = transaction.objectStore("documents")

              const request = store.put({
                id,
                content: processedContent,
                metadata,
                timestamp,
                compressed,
              })

              request.onsuccess = () => {
                this.metrics.writes++

                // Update write time metric
                const writeTime = Date.now() - startTime
                this.metrics.averageWriteTime =
                  (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

                // Update storage size metric
                this.metrics.totalStorageSize += this.estimateObjectSize({
                  id,
                  content: processedContent,
                  metadata,
                  timestamp,
                  compressed,
                })

                resolve(true)
              }
              request.onerror = (event) => {
                console.error("Error storing document:", (event.target as IDBRequest).error)
                this.metrics.errors++
                resolve(false)
              }
            } catch (error) {
              console.error("Error in storeDocument transaction:", error)
              this.metrics.errors++
              resolve(false)
            }
          })
        },
        "indexedDB",
        `storeDocument:${id}`,
        { priority: options.priority || "normal" },
      )
    } catch (error) {
      console.error("Error storing document:", error)
      this.metrics.errors++
      return false
    }
  }

  /**
   * Retrieve a document
   */
  async getDocument(id: string): Promise<{ content: string; metadata: any } | null> {
    const startTime = Date.now()
    await this.init()
    this.metrics.reads++

    try {
      // Check memory cache first
      const cacheKey = `document_${id}`
      const cachedItem = this.memoryCache.get(cacheKey)

      if (cachedItem) {
        this.metrics.cacheHits++

        // Update read time metric
        const readTime = Date.now() - startTime
        this.metrics.averageReadTime =
          (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

        return cachedItem.data
      }

      if (this.fallbackMode) {
        try {
          const item = sessionStorage.getItem(`document_${id}`)
          if (!item) {
            this.metrics.cacheMisses++
            return null
          }

          const data = JSON.parse(item)
          let content = data.content

          // Decompress if needed
          if (data.compressed) {
            content = decompressString(content)
          }

          const result = { content, metadata: data.metadata }

          // Store in memory cache
          this.memoryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          })

          // Update read time metric
          const readTime = Date.now() - startTime
          this.metrics.averageReadTime =
            (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

          return result
        } catch (error) {
          console.error("Error retrieving document from session storage:", error)
          this.metrics.errors++
          this.metrics.cacheMisses++
          return null
        }
      }

      if (!this.db) {
        this.metrics.cacheMisses++
        return null
      }

      return await withCircuitBreaker(
        async () => {
          return new Promise<{ content: string; metadata: any } | null>((resolve) => {
            try {
              const transaction = this.db!.transaction(["documents"], "readonly")
              const store = transaction.objectStore("documents")
              const request = store.get(id)

              request.onsuccess = (event) => {
                const result = (event.target as IDBRequest).result
                if (!result) {
                  this.metrics.cacheMisses++
                  resolve(null)
                  return
                }

                let content = result.content

                // Decompress if needed
                if (result.compressed) {
                  content = decompressString(content)
                }

                const documentData = { content, metadata: result.metadata }

                // Store in memory cache
                this.memoryCache.set(cacheKey, {
                  data: documentData,
                  timestamp: Date.now(),
                })

                // Update read time metric
                const readTime = Date.now() - startTime
                this.metrics.averageReadTime =
                  (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

                resolve(documentData)
              }

              request.onerror = (event) => {
                console.error("Error retrieving document:", (event.target as IDBRequest).error)
                this.metrics.errors++
                this.metrics.cacheMisses++
                resolve(null)
              }
            } catch (error) {
              console.error("Error in getDocument transaction:", error)
              this.metrics.errors++
              this.metrics.cacheMisses++
              resolve(null)
            }
          })
        },
        "indexedDB",
        `getDocument:${id}`,
      )
    } catch (error) {
      console.error("Error retrieving document:", error)
      this.metrics.errors++
      this.metrics.cacheMisses++
      return null
    }
  }

  /**
   * Store a job description
   */
  async storeJobDescription(id: string, data: any, options: StorageOptions = {}): Promise<boolean> {
    const startTime = Date.now()
    await this.init()

    const timestamp = Date.now()

    try {
      // Also store in memory cache for faster access
      this.memoryCache.set(`jd_${id}`, {
        data,
        timestamp,
        expiry: options.expiry ? timestamp + options.expiry : undefined,
      })

      if (this.fallbackMode) {
        try {
          // Use session storage as fallback
          sessionStorage.setItem(
            `jd_${id}`,
            JSON.stringify({
              id,
              data,
              timestamp,
            }),
          )
          this.metrics.writes++

          // Update write time metric
          const writeTime = Date.now() - startTime
          this.metrics.averageWriteTime =
            (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

          return true
        } catch (error) {
          console.error("Error storing job description in session storage:", error)
          this.metrics.errors++
          return false
        }
      }

      if (!this.db) return false

      return await withCircuitBreaker(
        async () => {
          return new Promise<boolean>((resolve) => {
            try {
              const transaction = this.db!.transaction(["jobDescriptions"], "readwrite")
              const store = transaction.objectStore("jobDescriptions")

              const request = store.put({
                id,
                data,
                timestamp,
              })

              request.onsuccess = () => {
                this.metrics.writes++

                // Update write time metric
                const writeTime = Date.now() - startTime
                this.metrics.averageWriteTime =
                  (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

                // Update storage size metric
                this.metrics.totalStorageSize += this.estimateObjectSize({
                  id,
                  data,
                  timestamp,
                })

                resolve(true)
              }
              request.onerror = (event) => {
                console.error("Error storing job description:", (event.target as IDBRequest).error)
                this.metrics.errors++
                resolve(false)
              }
            } catch (error) {
              console.error("Error in storeJobDescription transaction:", error)
              this.metrics.errors++
              resolve(false)
            }
          })
        },
        "indexedDB",
        `storeJobDescription:${id}`,
        { priority: options.priority || "normal" },
      )
    } catch (error) {
      console.error("Error storing job description:", error)
      this.metrics.errors++
      return false
    }
  }

  /**
   * Retrieve a job description
   */
  async getJobDescription(id: string): Promise<any | null> {
    const startTime = Date.now()
    await this.init()
    this.metrics.reads++

    try {
      // Check memory cache first
      const cacheKey = `jd_${id}`
      const cachedItem = this.memoryCache.get(cacheKey)

      if (cachedItem) {
        this.metrics.cacheHits++

        // Update read time metric
        const readTime = Date.now() - startTime
        this.metrics.averageReadTime =
          (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

        return cachedItem.data
      }

      if (this.fallbackMode) {
        try {
          const item = sessionStorage.getItem(`jd_${id}`)
          if (!item) {
            this.metrics.cacheMisses++
            return null
          }

          const data = JSON.parse(item)

          // Store in memory cache
          this.memoryCache.set(cacheKey, {
            data: data.data,
            timestamp: Date.now(),
          })

          // Update read time metric
          const readTime = Date.now() - startTime
          this.metrics.averageReadTime =
            (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

          return data.data
        } catch (error) {
          console.error("Error retrieving job description from session storage:", error)
          this.metrics.errors++
          this.metrics.cacheMisses++
          return null
        }
      }

      if (!this.db) {
        this.metrics.cacheMisses++
        return null
      }

      return await withCircuitBreaker(
        async () => {
          return new Promise<any | null>((resolve) => {
            try {
              const transaction = this.db!.transaction(["jobDescriptions"], "readonly")
              const store = transaction.objectStore("jobDescriptions")
              const request = store.get(id)

              request.onsuccess = (event) => {
                const result = (event.target as IDBRequest).result

                if (!result) {
                  this.metrics.cacheMisses++
                  resolve(null)
                  return
                }

                // Store in memory cache
                this.memoryCache.set(cacheKey, {
                  data: result.data,
                  timestamp: Date.now(),
                })

                // Update read time metric
                const readTime = Date.now() - startTime
                this.metrics.averageReadTime =
                  (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

                resolve(result.data)
              }

              request.onerror = (event) => {
                console.error("Error retrieving job description:", (event.target as IDBRequest).error)
                this.metrics.errors++
                this.metrics.cacheMisses++
                resolve(null)
              }
            } catch (error) {
              console.error("Error in getJobDescription transaction:", error)
              this.metrics.errors++
              this.metrics.cacheMisses++
              resolve(null)
            }
          })
        },
        "indexedDB",
        `getJobDescription:${id}`,
      )
    } catch (error) {
      console.error("Error retrieving job description:", error)
      this.metrics.errors++
      this.metrics.cacheMisses++
      return null
    }
  }

  /**
   * Store an item in the cache
   */
  async setCache(key: string, data: any, options: StorageOptions = {}): Promise<boolean> {
    const startTime = Date.now()
    await this.init()

    const timestamp = Date.now()
    const expiry = options.expiry ? timestamp + options.expiry : undefined

    try {
      // Store in memory cache
      this.memoryCache.set(key, { data, timestamp, expiry })

      if (this.fallbackMode) {
        try {
          // Use session storage as fallback
          sessionStorage.setItem(
            `cache_${key}`,
            JSON.stringify({
              key,
              data,
              timestamp,
              expiry,
            }),
          )
          this.metrics.writes++

          // Update write time metric
          const writeTime = Date.now() - startTime
          this.metrics.averageWriteTime =
            (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

          return true
        } catch (error) {
          console.error("Error storing cache item in session storage:", error)
          this.metrics.errors++
          return false
        }
      }

      if (!this.db) return false

      return await withCircuitBreaker(
        async () => {
          return new Promise<boolean>((resolve) => {
            try {
              const transaction = this.db!.transaction(["cache"], "readwrite")
              const store = transaction.objectStore("cache")

              const request = store.put({
                key,
                data,
                timestamp,
                expiry,
              })

              request.onsuccess = () => {
                this.metrics.writes++

                // Update write time metric
                const writeTime = Date.now() - startTime
                this.metrics.averageWriteTime =
                  (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

                // Update storage size metric
                this.metrics.totalStorageSize += this.estimateObjectSize({
                  key,
                  data,
                  timestamp,
                  expiry,
                })

                resolve(true)
              }
              request.onerror = (event) => {
                console.error("Error storing cache item:", (event.target as IDBRequest).error)
                this.metrics.errors++
                resolve(false)
              }
            } catch (error) {
              console.error("Error in setCache transaction:", error)
              this.metrics.errors++
              resolve(false)
            }
          })
        },
        "indexedDB",
        `setCache:${key}`,
        { priority: options.priority || "low" },
      )
    } catch (error) {
      console.error("Error storing cache item:", error)
      this.metrics.errors++
      return false
    }
  }

  /**
   * Retrieve an item from the cache
   */
  async getCache(key: string): Promise<any | null> {
    const startTime = Date.now()
    await this.init()
    this.metrics.reads++

    try {
      // Check memory cache first
      const cachedItem = this.memoryCache.get(key)

      if (cachedItem) {
        // Check if item has expired
        if (cachedItem.expiry && cachedItem.expiry < Date.now()) {
          this.memoryCache.delete(key)
          this.metrics.cacheMisses++
          return null
        }

        this.metrics.cacheHits++

        // Update read time metric
        const readTime = Date.now() - startTime
        this.metrics.averageReadTime =
          (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

        return cachedItem.data
      }

      if (this.fallbackMode) {
        try {
          const item = sessionStorage.getItem(`cache_${key}`)
          if (!item) {
            this.metrics.cacheMisses++
            return null
          }

          const data = JSON.parse(item)

          // Check if item has expired
          if (data.expiry && data.expiry < Date.now()) {
            sessionStorage.removeItem(`cache_${key}`)
            this.metrics.cacheMisses++
            return null
          }

          // Store in memory cache
          this.memoryCache.set(key, {
            data: data.data,
            timestamp: Date.now(),
            expiry: data.expiry,
          })

          // Update read time metric
          const readTime = Date.now() - startTime
          this.metrics.averageReadTime =
            (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

          return data.data
        } catch (error) {
          console.error("Error retrieving cache item from session storage:", error)
          this.metrics.errors++
          this.metrics.cacheMisses++
          return null
        }
      }

      if (!this.db) {
        this.metrics.cacheMisses++
        return null
      }

      return await withCircuitBreaker(
        async () => {
          return new Promise<any | null>((resolve) => {
            try {
              const transaction = this.db!.transaction(["cache"], "readonly")
              const store = transaction.objectStore("cache")
              const request = store.get(key)

              request.onsuccess = (event) => {
                const result = (event.target as IDBRequest).result
                if (!result) {
                  this.metrics.cacheMisses++
                  resolve(null)
                  return
                }

                // Check if item has expired
                if (result.expiry && result.expiry < Date.now()) {
                  // Delete expired item
                  const deleteTransaction = this.db!.transaction(["cache"], "readwrite")
                  const deleteStore = deleteTransaction.objectStore("cache")
                  deleteStore.delete(key)
                  this.metrics.deletes++
                  this.metrics.cacheMisses++
                  resolve(null)
                  return
                }

                // Store in memory cache
                this.memoryCache.set(key, {
                  data: result.data,
                  timestamp: Date.now(),
                  expiry: result.expiry,
                })

                // Update read time metric
                const readTime = Date.now() - startTime
                this.metrics.averageReadTime =
                  (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

                resolve(result.data)
              }

              request.onerror = (event) => {
                console.error("Error retrieving cache item:", (event.target as IDBRequest).error)
                this.metrics.errors++
                this.metrics.cacheMisses++
                resolve(null)
              }
            } catch (error) {
              console.error("Error in getCache transaction:", error)
              this.metrics.errors++
              this.metrics.cacheMisses++
              resolve(null)
            }
          })
        },
        "indexedDB",
        `getCache:${key}`,
      )
    } catch (error) {
      console.error("Error retrieving cache item:", error)
      this.metrics.errors++
      this.metrics.cacheMisses++
      return null
    }
  }

  /**
   * Store a setting
   */
  async setSetting(key: string, value: any): Promise<boolean> {
    const startTime = Date.now()
    await this.init()

    try {
      // Store in memory cache
      this.memoryCache.set(`setting_${key}`, {
        data: value,
        timestamp: Date.now(),
      })

      if (this.fallbackMode) {
        try {
          // Use session storage as fallback
          sessionStorage.setItem(`setting_${key}`, JSON.stringify(value))
          this.metrics.writes++

          // Update write time metric
          const writeTime = Date.now() - startTime
          this.metrics.averageWriteTime =
            (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

          return true
        } catch (error) {
          console.error("Error storing setting in session storage:", error)
          this.metrics.errors++
          return false
        }
      }

      if (!this.db) return false

      return await withCircuitBreaker(
        async () => {
          return new Promise<boolean>((resolve) => {
            try {
              const transaction = this.db!.transaction(["settings"], "readwrite")
              const store = transaction.objectStore("settings")

              const request = store.put({
                key,
                value,
                timestamp: Date.now(),
              })

              request.onsuccess = () => {
                this.metrics.writes++

                // Update write time metric
                const writeTime = Date.now() - startTime
                this.metrics.averageWriteTime =
                  (this.metrics.averageWriteTime * (this.metrics.writes - 1) + writeTime) / this.metrics.writes

                resolve(true)
              }
              request.onerror = (event) => {
                console.error("Error storing setting:", (event.target as IDBRequest).error)
                this.metrics.errors++
                resolve(false)
              }
            } catch (error) {
              console.error("Error in setSetting transaction:", error)
              this.metrics.errors++
              resolve(false)
            }
          })
        },
        "indexedDB",
        `setSetting:${key}`,
      )
    } catch (error) {
      console.error("Error storing setting:", error)
      this.metrics.errors++
      return false
    }
  }

  /**
   * Retrieve a setting
   */
  async getSetting(key: string, defaultValue: any = null): Promise<any> {
    const startTime = Date.now()
    await this.init()
    this.metrics.reads++

    try {
      // Check memory cache first
      const cacheKey = `setting_${key}`
      const cachedItem = this.memoryCache.get(cacheKey)

      if (cachedItem) {
        this.metrics.cacheHits++

        // Update read time metric
        const readTime = Date.now() - startTime
        this.metrics.averageReadTime =
          (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

        return cachedItem.data
      }

      if (this.fallbackMode) {
        try {
          const item = sessionStorage.getItem(`setting_${key}`)
          if (!item) {
            this.metrics.cacheMisses++
            return defaultValue
          }

          const value = JSON.parse(item)

          // Store in memory cache
          this.memoryCache.set(cacheKey, {
            data: value,
            timestamp: Date.now(),
          })

          // Update read time metric
          const readTime = Date.now() - startTime
          this.metrics.averageReadTime =
            (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

          return value
        } catch (error) {
          console.error("Error retrieving setting from session storage:", error)
          this.metrics.errors++
          this.metrics.cacheMisses++
          return defaultValue
        }
      }

      if (!this.db) {
        this.metrics.cacheMisses++
        return defaultValue
      }

      return await withCircuitBreaker(
        async () => {
          return new Promise<any>((resolve) => {
            try {
              const transaction = this.db!.transaction(["settings"], "readonly")
              const store = transaction.objectStore("settings")
              const request = store.get(key)

              request.onsuccess = (event) => {
                const result = (event.target as IDBRequest).result
                if (!result) {
                  this.metrics.cacheMisses++
                  resolve(defaultValue)
                  return
                }

                // Store in memory cache
                this.memoryCache.set(cacheKey, {
                  data: result.value,
                  timestamp: Date.now(),
                })

                // Update read time metric
                const readTime = Date.now() - startTime
                this.metrics.averageReadTime =
                  (this.metrics.averageReadTime * (this.metrics.reads - 1) + readTime) / this.metrics.reads

                resolve(result.value)
              }

              request.onerror = (event) => {
                console.error("Error retrieving setting:", (event.target as IDBRequest).error)
                this.metrics.errors++
                this.metrics.cacheMisses++
                resolve(defaultValue)
              }
            } catch (error) {
              console.error("Error in getSetting transaction:", error)
              this.metrics.errors++
              this.metrics.cacheMisses++
              resolve(defaultValue)
            }
          })
        },
        "indexedDB",
        `getSetting:${key}`,
      )
    } catch (error) {
      console.error("Error retrieving setting:", error)
      this.metrics.errors++
      this.metrics.cacheMisses++
      return defaultValue
    }
  }

  /**
   * Delete an item from storage
   */
  async deleteItem(storeName: keyof DBSchema, key: string): Promise<boolean> {
    const startTime = Date.now()
    await this.init()

    try {
      // Remove from memory cache
      this.memoryCache.delete(`${storeName}_${key}`)

      if (this.fallbackMode) {
        try {
          sessionStorage.removeItem(`${storeName}_${key}`)
          this.metrics.deletes++
          return true
        } catch (error) {
          console.error(`Error deleting item from session storage:`, error)
          this.metrics.errors++
          return false
        }
      }

      if (!this.db) return false

      return await withCircuitBreaker(
        async () => {
          return new Promise<boolean>((resolve) => {
            try {
              const transaction = this.db!.transaction([storeName], "readwrite")
              const store = transaction.objectStore(storeName)
              const request = store.delete(key)

              request.onsuccess = () => {
                this.metrics.deletes++
                resolve(true)
              }
              request.onerror = (event) => {
                console.error(`Error deleting item from ${storeName}:`, (event.target as IDBRequest).error)
                this.metrics.errors++
                resolve(false)
              }
            } catch (error) {
              console.error(`Error in deleteItem transaction for ${storeName}:`, error)
              this.metrics.errors++
              resolve(false)
            }
          })
        },
        "indexedDB",
        `deleteItem:${storeName}:${key}`,
      )
    } catch (error) {
      console.error(`Error deleting item:`, error)
      this.metrics.errors++
      return false
    }
  }

  /**
   * List all items in a store
   */
  async listItems(storeName: keyof DBSchema): Promise<any[]> {
    await this.init()
    this.metrics.reads++

    try {
      if (this.fallbackMode) {
        try {
          const items: any[] = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key && key.startsWith(`${storeName}_`)) {
              const item = sessionStorage.getItem(key)
              if (item) {
                items.push(JSON.parse(item))
              }
            }
          }
          return items
        } catch (error) {
          console.error(`Error listing items from session storage:`, error)
          this.metrics.errors++
          return []
        }
      }

      if (!this.db) return []

      return await withCircuitBreaker(
        async () => {
          return new Promise<any[]>((resolve) => {
            try {
              const transaction = this.db!.transaction([storeName], "readonly")
              const store = transaction.objectStore(storeName)
              const request = store.getAll()

              request.onsuccess = (event) => {
                const result = (event.target as IDBRequest).result
                resolve(result || [])
              }

              request.onerror = (event) => {
                console.error(`Error listing items from ${storeName}:`, (event.target as IDBRequest).error)
                this.metrics.errors++
                resolve([])
              }
            } catch (error) {
              console.error(`Error in listItems transaction for ${storeName}:`, error)
              this.metrics.errors++
              resolve([])
            }
          })
        },
        "indexedDB",
        `listItems:${storeName}`,
      )
    } catch (error) {
      console.error(`Error listing items:`, error)
      this.metrics.errors++
      return []
    }
  }

  /**
   * Clear all data from a store
   */
  async clearStore(storeName: keyof DBSchema): Promise<boolean> {
    await this.init()

    try {
      // Clear relevant items from memory cache
      for (const [key, _] of this.memoryCache.entries()) {
        if (key.startsWith(`${storeName}_`)) {
          this.memoryCache.delete(key)
        }
      }

      if (this.fallbackMode) {
        try {
          const keysToRemove: string[] = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key && key.startsWith(`${storeName}_`)) {
              keysToRemove.push(key)
            }
          }

          keysToRemove.forEach((key) => sessionStorage.removeItem(key))
          this.metrics.deletes += keysToRemove.length
          return true
        } catch (error) {
          console.error(`Error clearing items from session storage:`, error)
          this.metrics.errors++
          return false
        }
      }

      if (!this.db) return false

      return await withCircuitBreaker(
        async () => {
          return new Promise<boolean>((resolve) => {
            try {
              const transaction = this.db!.transaction([storeName], "readwrite")
              const store = transaction.objectStore(storeName)
              const request = store.clear()

              request.onsuccess = () => {
                this.metrics.deletes++
                resolve(true)
              }
              request.onerror = (event) => {
                console.error(`Error clearing store ${storeName}:`, (event.target as IDBRequest).error)
                this.metrics.errors++
                resolve(false)
              }
            } catch (error) {
              console.error(`Error in clearStore transaction for ${storeName}:`, error)
              this.metrics.errors++
              resolve(false)
            }
          })
        },
        "indexedDB",
        `clearStore:${storeName}`,
      )
    } catch (error) {
      console.error(`Error clearing store:`, error)
      this.metrics.errors++
      return false
    }
  }

  /**
   * Get storage metrics
   */
  getMetrics(): StorageMetrics {
    return { ...this.metrics }
  }
}

// Export singleton instance
export const storageService = new IndexedDBStorage()
