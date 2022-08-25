// FRom https://medium.com/dsinjs/implementing-lru-cache-in-javascript-94ba6755cda9
class Node {
  constructor (key, value, next = null, prev = null) {
    this.key = key
    this.value = value
    this.next = next
    this.prev = prev
  }
}

export default class LRU {
  // set default limit of 30
  constructor (limit = 30) {
    this.size = 0
    this.limit = limit
    this.head = null
    this.tail = null
    this.cache = {}
  }

  // Write Node to head of LinkedList
  // update cache with Node key and Node reference
  _insert (key, value) {
    this._ensureLimit()

    if (!this.head) {
      this.head = this.tail = new Node(key, value)
    } else {
      const node = new Node(key, value, this.head)
      this.head.prev = node
      this.head = node
    }

    // Update the cache map
    this.cache[key] = this.head
    this.size++
  }

  write (key, value) {
    if (this.cache[key]) { // if already in cache
      this._remove(key) // remove it first
    }
    this._insert(key, value) // always insert at head
  }

  // Read from cache map and make that node as new Head of LinkedList
  read (key) {
    if (this.cache[key]) {
      const value = this.cache[key].value

      // node removed from it's position and cache
      this._remove(key)
      // write node again to the head of LinkedList to make it most recently used
      this._insert(key, value)

      return value
    } else {
      return undefined // MISS
    }
  }

  _ensureLimit () {
    if (this.size >= this.limit) {
      this._remove(this.tail.key)
      console.log('Removed from cache', this.tail.key)
    }
  }

  _remove (key) {
    const node = this.cache[key]
    if (!node) return false

    if (node.prev !== null) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next !== null) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }

    delete this.cache[key]
    this.size--
  }

  remove (key) {
    console.log('Try to Invalidade key', key)
    this._remove(key)
  }

  clear () {
    this.head = null
    this.tail = null
    this.size = 0
    this.cache = {}
  }

  // Invokes the callback function with every node of the chain with the index of the node.
  forEach (fn) {
    let node = this.head
    let counter = 0
    while (node) {
      fn(node, counter)
      node = node.next
      counter++
    }
  }

  // To iterate over LRU with a 'for...of' loop
  *[Symbol.iterator] () {
    let node = this.head
    while (node) {
      yield node
      node = node.next
    }
  }
}
