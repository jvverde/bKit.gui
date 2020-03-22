// From https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
export default class Queue {
  constructor (limit = 1) {
    this.queue = []
    this.pendingPromise = false
    this.limit = limit
  }

  enqueue (promise, key = undefined) {
    return new Promise((resolve, reject) => {
      this.queue.push({ promise, resolve, reject, key })
      this._run()
    })
  }

  _extractDuplicateItems (key) {
    if (!key) return []
    const result = []
    let i = this.queue.length
    while (i--) {
      if (this.queue[i].key === key) {
        result.push(this.queue[i])
        this.queue.splice(i, 1)
      }
    }
    return result
  }

  _run () {
    if (this.workingOnPromise) {
      return false
    }
    const item = this.queue.shift()
    if (!item) {
      return false
    }
    this.workingOnPromise = true
    item.promise()
      .then(value => {
        item.resolve(value)
        // also resolve duplicate requests
        this._extractDuplicateItems(item.key).forEach(e => e.resolve(value))
      })
      .catch(value => {
        console.error(`Queue catch error: (${value})`, value)
        item.reject(value)
        // also reject duplicate requests
        this._extractDuplicateItems(item.key).forEach(e => e.reject(value))
      })
      .finally(() => {
        this.workingOnPromise = false
        this._run()
      })
    return true
  }
}
