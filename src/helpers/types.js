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
