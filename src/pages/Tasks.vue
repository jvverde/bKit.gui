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
      :grid="gridmode"
    >
      <template v-slot:body-cell-TaskToRun="props">
        <q-td>
          <job2run :path="sanitize(props.value)"/>
        </q-td>
      </template>

      <template v-slot:bottom-row>
        <q-tr v-if="selected.length">
          <q-td colspan="100%">
            <q-btn icon="clear" stack no-caps label="Remove Tasks" color="red" @click="remove"/>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:top>
        <div class="row full-width">
          <div>Windows Schedule Tasks</div>
          <q-btn icon="launch" round dense flat size="xs" color="blue" @click="edit"/>
          <q-btn icon="sync" round dense flat size="xs" color="cyan" style="margin-left:auto"
            :loading="loading"
            @click="load"/>
        </div>
      </template>

    </q-table>
  </q-page>
</template>

<script>

import job2run from 'src/components/Job2run'
const task = require('windows-scheduler')
import { bash } from 'src/helpers/bash'

export default {
  name: 'Servers',
  data () {
    return {
      loading: false,
      tasks: {},
      gridmode: false,
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
    }
  },
  methods: {
    sanitize (path) {
      return path.replace(/^["\s]+|["\s]+$/g, '')
    },
    edit () {
      bash('notepad.exe')
    },
    remove () {
      this.selected.forEach(async e => {
        try {
          await task.delete(e.TaskName)
        } catch (e) {
          console.warn('Delete task Error', e)
        } finally {
          this.load()
        }
      })
    },
    async load () {
      this.selected = []
      this.columns = [{ name: 'id', label: 'id', field: 'id' }]
      this.data = []
      let cnt = 0
      try {
        this.loading = true
        const list = await task.get(undefined, 'LIST')
        const matchArray = list.match(/(?<=TaskName:\s*.*?)BKIT.+?[\r\n]/igm)
        const uniqueNames = [...new Set(matchArray)]
        uniqueNames.forEach(async taskname => {
          const csv = await task.get(taskname, 'CSV', true)
          const lines = (csv.split(/[\n\r]+/) || []).filter(e => e)
          const headers = lines.shift().split(/","/)
          headers.forEach(h => {
            if (this.columns.find(e => e.field === h)) return // Filter out duplicated fieds
            const name = h.replace(/\s+/g, '') // remove spaces for use as a key
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
      } catch (err) {
        console.error('Error getting schedule tasks', err)
      } finally {
        this.loading = false
      }
    }
  },
  mounted () {
    this.load()
  }
}
</script>
