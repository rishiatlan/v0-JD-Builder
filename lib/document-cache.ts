// Document cache service for improved performance

interface CachedDocument {
  id: string
  filename: string
  fileType: string
  content: string
  timestamp: number
  size: number
}

class DocumentCacheService {
  private readonly CACHE_KEY = "atlan_document_cache"
  private readonly MAX_CACHE_SIZE = 10 // Maximum number of documents to cache
  private readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  public async cacheDocument(file: File, content: string): Promise<string> {
    try {
      const cache = this.getCache()

      // Generate a unique ID for this document
      const id = this.generateDocumentId(file)

      // Create cache entry
      const cacheEntry: CachedDocument = {
        id,
        filename: file.name,
        fileType: file.type,
        content,
        timestamp: Date.now(),
        size: file.size,
      }

      // Add to cache
      cache.unshift(cacheEntry)

      // Trim cache if needed
      if (cache.length > this.MAX_CACHE_SIZE) {
        cache.pop()
      }

      // Save updated cache
      this.saveCache(cache)

      return id
    } catch (error) {
      console.error("Error caching document:", error)
      return ""
    }
  }

  public getDocumentContent(id: string): string | null {
    try {
      const cache = this.getCache()
      const document = cache.find((doc) => doc.id === id)

      if (!document) return null

      // Check if document is expired
      if (Date.now() - document.timestamp > this.MAX_CACHE_AGE) {
        // Remove expired document
        this.removeDocument(id)
        return null
      }

      return document.content
    } catch (error) {
      console.error("Error retrieving document from cache:", error)
      return null
    }
  }

  public getDocumentByFilename(filename: string): CachedDocument | null {
    try {
      const cache = this.getCache()
      // Use a more robust comparison that ignores case sensitivity
      const document = cache.find((doc) => doc.filename.toLowerCase() === filename.toLowerCase())

      if (!document) return null

      // Check if document is expired
      if (Date.now() - document.timestamp > this.MAX_CACHE_AGE) {
        // Remove expired document
        this.removeDocument(document.id)
        return null
      }

      return document
    } catch (error) {
      console.error("Error retrieving document from cache by filename:", error)
      return null
    }
  }

  public removeDocument(id: string): boolean {
    try {
      let cache = this.getCache()
      const initialLength = cache.length

      cache = cache.filter((doc) => doc.id !== id)

      if (cache.length !== initialLength) {
        this.saveCache(cache)
        return true
      }

      return false
    } catch (error) {
      console.error("Error removing document from cache:", error)
      return false
    }
  }

  public clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY)
    } catch (error) {
      console.error("Error clearing document cache:", error)
    }
  }

  private getCache(): CachedDocument[] {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY)
      if (!cacheData) return []

      const cache = JSON.parse(cacheData) as CachedDocument[]

      // Filter out expired documents
      const validCache = cache.filter((doc) => Date.now() - doc.timestamp <= this.MAX_CACHE_AGE)

      // If we removed any expired documents, update the cache
      if (validCache.length !== cache.length) {
        this.saveCache(validCache)
      }

      return validCache
    } catch (error) {
      console.error("Error reading document cache:", error)
      return []
    }
  }

  private saveCache(cache: CachedDocument[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error("Error saving document cache:", error)

      // If we hit storage limits, clear the cache and try again
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        this.clearCache()
        if (cache.length > 0) {
          // Try saving just the most recent document
          this.saveCache([cache[0]])
        }
      }
    }
  }

  private generateDocumentId(file: File): string {
    // Create a unique ID based on filename, size, and last modified date
    const fileInfo = `${file.name}-${file.size}-${file.lastModified}`

    // Simple hash function
    let hash = 0
    for (let i = 0; i < fileInfo.length; i++) {
      const char = fileInfo.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    return hash.toString(36) + Date.now().toString(36)
  }
}

// Export singleton instance
export const documentCache = new DocumentCacheService()
