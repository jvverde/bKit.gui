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
    <template v-slot:body-cell-TaskToRun="props">
      <td>
        <job2run :path="sanitize(props.value)"/>
      </td>
    </template>
    </q-table>
  </q-page>
</template>

<script>

import job2run from 'src/components/Job2run'
const task = require('windows-scheduler')

export default {
  name: 'Servers',
  data () {
    return {
      tasks: {},
      grid: false,
      selected: [],
      columns: [{ name: 'id', label: 'id', field: 'id' }],
      data: [],
      visible: ['TaskName', 'ScheduleType', 'Days', 'Months', 'StartTime', 'Status', 'TaskToRun']
    }
  },
  components: {
    job2run
  },
  watch: {
    selected (val) {
      console.log(val)
    }
  },
  methods: {
    sanitize (path) {
      return path.replace(/^["\s]+|["\s]+$/g, '')
    }
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
        task.get(taskname, 'CSV', true)
          .then((result) => {
            const lines = (result.split(/[\n\r]+/) || []).filter(e => e)
            // .filter(e => e).map(e => {
            //  const match = e.match(/(?<name>.+?):\s*(?<value>.+)$/)
            //  return match ? match.groups : {}
            // })
            const headers = lines.shift().split(/","/)
            headers.forEach(h => {
              if (this.columns.find(e => e.field === h)) return
              const name = h.replace(/\s+/g, '')
              this.columns.push({ name, label: h, field: h })
            })
            lines.forEach(line => {
              const values = line.split(/","/)
              const data = { id: cnt++ }
              for (const i in values) {
                data[headers[i]] = data[headers[i]] ? [data[headers[i]], values[i]].join('|') : values[i]
              }
              this.data.push(data)
            })
          })
      })
    }).catch(e => console.error(e))
      .finally(() => { })
  }
}
</script>
