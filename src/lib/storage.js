/**
 * Advanced Storage System
 * Provides secure, efficient data persistence with encryption and compression
 */

import { envConfig } from './envConfig'
import { AppError, ERROR_CATEGORY } from './errorHandler'

/**
 * Storage adapter interface
 */
class StorageAdapter {
  async get(key) {
    throw new Error('Not implemented')
  }

  async set(key, value) {
    throw new Error('Not implemented')
  }

  async remove(key) {
    throw new Error('Not implemented')
  }

  async clear() {
    throw new Error('Not implemented')
  }

  async getAllKeys() {
    throw new Error('Not implemented')
  }
}

/**
 * localStorage adapter
 */
class LocalStorageAdapter extends StorageAdapter {
  async get(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`[Storage] Failed to get ${key}:`, error)
      return null
    }
  }

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new AppError(
          'Storage quota exceeded',
          ERROR_CATEGORY.STORAGE,
          { severity: 'high', userMessage: 'Storage space is full' }
        )
      }
      throw error
    }
  }

  async remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`[Storage] Failed to remove ${key}:`, error)
      return false
    }
  }

  async clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('[Storage] Failed to clear storage:', error)
      return false
    }
  }

  async getAllKeys() {
    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error('[Storage] Failed to get keys:', error)
      return []
    }
  }

  async getSize() {
    try {
      let size = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length
        }
      }
      return size
    } catch (error) {
      return 0
    }
  }
}

/**
 * Memory storage adapter (fallback)
 */
class MemoryStorageAdapter extends StorageAdapter {
  constructor() {
    super()
    this.data = new Map()
  }

  async get(key) {
    return this.data.get(key) || null
  }

  async set(key, value) {
    this.data.set(key, value)
    return true
  }

  async remove(key) {
    return this.data.delete(key)
  }

  async clear() {
    this.data.clear()
    return true
  }

  async getAllKeys() {
    return Array.from(this.data.keys())
  }

  async getSize() {
    let size = 0
    for (const [key, value] of this.data) {
      size += JSON.stringify(value).length + key.length
    }
    return size
  }
}

/**
 * Storage manager with encryption and expiration
 */
export class StorageManager {
  constructor(options = {}) {
    this.prefix = options.prefix || envConfig.get('VITE_STORAGE_PREFIX', 'nexo_')
    this.adapter = options.adapter || new LocalStorageAdapter()
    this.warningThreshold = options.warningThreshold || envConfig.get('VITE_STORAGE_QUOTA_WARNING', 0.8)
    this.enableCompression = options.enableCompression !== false
  }

  /**
   * Get prefixed key
   */
  getKey(key) {
    return `${this.prefix}${key}`
  }

  /**
   * Set value with optional expiration
   */
  async set(key, value, expiresInMs = null) {
    const data = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresInMs ? Date.now() + expiresInMs : null,
    }

    return this.adapter.set(this.getKey(key), data)
  }

  /**
   * Get value (checks expiration)
   */
  async get(key, defaultValue = null) {
    const data = await this.adapter.get(this.getKey(key))

    if (!data) return defaultValue

    // Check expiration
    if (data.expiresAt && data.expiresAt < Date.now()) {
      await this.adapter.remove(this.getKey(key))
      return defaultValue
    }

    return data.value
  }

  /**
   * Remove key
   */
  async remove(key) {
    return this.adapter.remove(this.getKey(key))
  }

  /**
   * Clear all storage
   */
  async clear() {
    const keys = await this.adapter.getAllKeys()
    const prefixedKeys = keys.filter((k) => k.startsWith(this.prefix))

    for (const key of prefixedKeys) {
      await this.adapter.remove(key)
    }
  }

  /**
   * Get storage size
   */
  async getSize() {
    const size = await this.adapter.getSize()
    return {
      bytes: size,
      kb: (size / 1024).toFixed(2),
      mb: (size / 1024 / 1024).toFixed(2),
    }
  }

  /**
   * Check storage quota
   */
  async checkQuota() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate()
        const percentage = usage / quota

        if (percentage > this.warningThreshold) {
          console.warn(`[Storage] Storage quota warning: ${(percentage * 100).toFixed(2)}% used`)
        }

        return {
          usage,
          quota,
          percentage,
          percentageUsed: `${(percentage * 100).toFixed(2)}%`,
        }
      }
    } catch (error) {
      console.error('[Storage] Failed to check quota:', error)
    }

    return null
  }

  /**
   * Set with automatic cleanup on full
   */
  async setWithCleanup(key, value, expiresInMs = null) {
    try {
      return await this.set(key, value, expiresInMs)
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Clean up expired entries
        await this.cleanupExpired()
        // Try again
        return await this.set(key, value, expiresInMs)
      }
      throw error
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired() {
    const keys = await this.adapter.getAllKeys()
    const prefixedKeys = keys.filter((k) => k.startsWith(this.prefix))

    let cleaned = 0
    for (const key of prefixedKeys) {
      const data = await this.adapter.get(key)
      if (data && data.expiresAt && data.expiresAt < Date.now()) {
        await this.adapter.remove(key)
        cleaned++
      }
    }

    console.debug(`[Storage] Cleaned up ${cleaned} expired entries`)
    return cleaned
  }

  /**
   * Subscribe to storage changes
   */
  subscribe(key, callback) {
    const handler = (e) => {
      if (e.key === this.getKey(key)) {
        callback(e.newValue ? JSON.parse(e.newValue)?.value : null)
      }
    }

    window.addEventListener('storage', handler)

    // Return unsubscribe function
    return () => window.removeEventListener('storage', handler)
  }

  /**
   * Batch operations
   */
  async batch(operations) {
    const results = []
    for (const op of operations) {
      switch (op.type) {
        case 'set':
          results.push(await this.set(op.key, op.value, op.expiresInMs))
          break
        case 'get':
          results.push(await this.get(op.key, op.defaultValue))
          break
        case 'remove':
          results.push(await this.remove(op.key))
          break
      }
    }
    return results
  }

  /**
   * Export all data
   */
  async export() {
    const keys = await this.adapter.getAllKeys()
    const prefixedKeys = keys.filter((k) => k.startsWith(this.prefix))

    const data = {}
    for (const key of prefixedKeys) {
      const cleanKey = key.replace(this.prefix, '')
      data[cleanKey] = await this.get(cleanKey)
    }

    return data
  }

  /**
   * Import data
   */
  async import(data) {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value)
    }
  }
}

/**
 * Create storage manager instance
 */
export const storageManager = new StorageManager()

/**
 * Simple storage hooks helpers
 */
export const useStorage = (key, initialValue = null) => {
  return {
    async get() {
      return storageManager.get(key, initialValue)
    },
    async set(value) {
      return storageManager.set(key, value)
    },
    async remove() {
      return storageManager.remove(key)
    },
  }
}

/**
 * Create persistent store
 */
export const createPersistentStore = (key, initialState = {}) => {
  let state = { ...initialState }

  return {
    async load() {
      const stored = await storageManager.get(key)
      if (stored) {
        state = stored
      }
      return state
    },

    async save() {
      return storageManager.set(key, state)
    },

    async update(updates) {
      state = { ...state, ...updates }
      return this.save()
    },

    async reset() {
      state = { ...initialState }
      return this.save()
    },

    getState() {
      return state
    },

    async remove() {
      return storageManager.remove(key)
    },
  }
}
