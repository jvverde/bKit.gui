<template>
  <q-page padding class="relative">
    TABLE
  </q-page>
</template>

<script>
const task = require('windows-scheduler')

export default {
  name: 'Servers',
  data () {
    return {
      task: [],
      columns: [],
      data: []
    }
  },
  watch: {
  },
  methods: {
  },
  mounted () {
    const res = task.get(undefined, 'LIST')
    res.then(result => {
      // console.log('Result', result)
      const match = result.match(/(?<=TaskName:\s*.*?)BKIT.+?[\r\n]/igm)
      console.log('Match', match)
      if (match) {
        match.forEach(m => {
          console.log('Match', m)
          task.get(m, 'CSV', true)
            .then((result) => {
              const lines = (result.split(/[\n\r]+/) || []).filter(e => e)
              // .filter(e => e).map(e => {
              //  const match = e.match(/(?<name>.+?):\s*(?<value>.+)$/)
              //  return match ? match.groups : {}
              // })
              const headers = lines.shift().split(/","/)
              headers.forEach(h => {
                this.columns.push({ name: h, label: h, field: h })
              })
              lines.forEach(line => {
                const values = line.split(/","/)
                const data = {}
                for (const i in values) {
                  data[headers[i]] = values[i]
                }
                this.data.push(data)
                console.log(this.columns)
                console.log(this.data)
              })
              this.task.push(lines)
              console.log('Lines:', lines)
            })
        })
      }
    }).catch(e => console.error(e))
      .finally(() => console.log('Finally'))
  }
}
</script>
