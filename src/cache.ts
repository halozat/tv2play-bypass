import { createHash } from "crypto"

export default class TVCache {
  private cache
  private hash

  constructor() {
    this.hash = function (input: string) {
      const hash = createHash("sha256")
      hash.update(input.trim())
      return hash.digest("hex")
    }

    this.cache = {}
  }

  set(key: string, value) {
    this.cache[this.hash(key)] = value
  }

  get(key: string) {
    const retrieved = this.cache[this.hash(key)] ?? null
    if (retrieved !== null) {
      if (Date.now() > new Date(retrieved?.expiry).getTime()) {
        this.delete(key)
        return null
      }
    }

    if (key) return this.cache[this.hash(key)] ?? null
  }

  delete(key) {
    delete this.cache[this.hash(key)]
  }
}
