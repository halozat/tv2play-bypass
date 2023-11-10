import { createHash } from "crypto";
export default class TVCache {
    cache;
    hash;
    constructor() {
        this.hash = function (input) {
            const hash = createHash("sha256");
            hash.update(input.trim());
            return hash.digest("hex");
        };
        this.cache = {};
    }
    set(key, value) {
        this.cache[this.hash(key)] = value;
    }
    get(key) {
        const retrieved = this.cache[this.hash(key)] ?? null;
        if (retrieved !== null) {
            if (Date.now() > new Date(retrieved?.expiry).getTime()) {
                this.delete(key);
                return null;
            }
        }
        if (key)
            return this.cache[this.hash(key)] ?? null;
    }
    delete(key) {
        delete this.cache[this.hash(key)];
    }
}
