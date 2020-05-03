// FRom https://medium.com/dsinjs/implementing-lru-cache-in-javascript-94ba6755cda9
const periods = [
  {
    value: '-d',
    label: 'Day(s)'
  },
  {
    value: '-m',
    label: 'Minute(s)'
  },
  {
    value: '-w',
    label: 'week(s)'
  },
  {
    value: '-h',
    label: 'Hour(s)'
  }
]

export default class Scheduler {
  constructor (values = {}) {
    const { freq = 1, period = '-d', start } = values
    this.freq = freq
    this.period = period
    this.start = start
  }
  isComplete () {
    return this.freq > 0 && !!this.period && !!this.start
  }
  label () {
    return (periods.find(e => e.value === this.period) || {}).label
  }
  value () {
    return (periods.find(e => e.value === this.period) || {}).value
  }
  options () {
    return periods
  }
}
