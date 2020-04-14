<template>
  <q-page padding class="relative">
    <q-table
      title="Windows Schedule Tasks"
      dense
      :data="data"
      :columns="columns"
      row-key="id"
      :visible-columns="visible"
      selection="multiple"
      :selected.sync="selected"
      :grid="grid"
    >
    </q-table>
  </q-page>
</template>

<script>

import { readfile } from 'src/helpers/readfs'
const task = require('windows-scheduler')

export default {
  name: 'Servers',
  data () {
    return {
      grid: false,
      selected: [],
      columns: [{ name: 'id', label: 'id', field: 'id' }],
      data: [],
      visible: ['TaskName', 'Schedule Type', 'Days', 'Months', 'Start Time', 'Status', 'Task To Run']
    }
  },
  watch: {
    selected (val) {
      console.log(val)
    }
  },
  methods: {
  },
  mounted () {
    this.selected = []
    this.columns = [{ name: 'id', label: 'id', field: 'id' }]
    this.data = []
    let cnt = 0
    const res = task.get(undefined, 'LIST')
    res.then(result => {
      // console.log('Result', result)
      const matchArray = result.match(/(?<=TaskName:\s*.*?)BKIT.+?[\r\n]/igm)
      const uniqueNames = [...new Set(matchArray)]
      uniqueNames.forEach(taskname => {
        console.log('Task', taskname)
        task.get(taskname, 'CSV', true)
          .then((result) => {
            const lines = (result.split(/[\n\r]+/) || []).filter(e => e)
            // .filter(e => e).map(e => {
            //  const match = e.match(/(?<name>.+?):\s*(?<value>.+)$/)
            //  return match ? match.groups : {}
            // })
            const headers = lines.shift().split(/","/)
            headers.forEach(h => {
              if (this.columns.find(e => e.name === h)) return
              this.columns.push({ name: h, label: h, field: h })
            })
            lines.forEach(line => {
              const values = line.split(/","/)
              const data = { id: cnt++ }
              for (const i in values) {
                data[headers[i]] = data[headers[i]] ? [data[headers[i]], values[i]].join('|') : values[i]
              }
              this.data.push(data)
            })
            console.log('COLS', this.columns.map(c => c.name))
            console.log('DATA', this.data)
            console.log('LINES:', lines)
          })
      })
    }).catch(e => console.error(e))
      .finally(() => {
        this.data.forEach(line => {
          const path = line['Task To Run'].replace(/^["\s]+|["\s]+$/g, '')
          console.log(`path=${path}`)
          const task = {}
          readfile(path)
            .then(result => {
              const batch = result.toString()
              const match = batch.match(/REM path='(?<path>.+?)'[\s\n\r]+/im)
              if (match) {
                task.path = match.groups.path
              }
              const match2 = batch.match(/REM uuid='(?<uuid>.+?)'[\s\n\r]+/im)
              if (match2) {
                task.uuid = match2.groups.uuid
              }
              console.log('task:', task)
            })
        })
      })
  }
}
</script>
