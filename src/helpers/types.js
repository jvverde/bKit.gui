export class Resource {
  constructor ({ path, snap, rvid, options = [], rsyncoptions = [], args = [] }) {
    this.path = path
    this.snap = snap
    this.rvid = rvid
    this.options = options
    this.rsyncoptions = rsyncoptions
    this.args = args
  }
}

export class Entry {
  constructor ({ path, schedule = {} }) {
    this.path = path
    this.schedule = schedule
  }
  get immediately () { return this.schedule.immediately === true }
  get onboot () { return this.schedule.onboot === true }
  get onchange () { return this.schedule.onchange === true }
  get periodically () { return this.schedule.periodically !== undefined }
}
