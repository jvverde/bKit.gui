<template>
  <main class="relative">
    <q-dialog
      v-model="selectcols" transition-show="rotate" transition-hide="rotate">
      <q-card>
        <q-bar>
          <div>Select Columns</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-actions>
          <div style=" max-height: 60vh;" class="no-wrap column scroll">
            <q-checkbox dense color="green" size="xs"
              v-model="visible"
              :val="col.name"
              :label="col.label"
              v-for="col in viewable" :key="col.name"/>
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
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
      :pagination.sync="pagination"
    >

      <template v-slot:top>
        <div class="row full-width">
          <div>Windows Schedule Tasks</div>
          <q-btn icon="launch" round dense flat size="xs" color="blue" @click="edit">
            <q-tooltip>Launch Windows Task Schedule Manager</q-tooltip>
          </q-btn>
          <q-btn icon="settings_ethernet" round dense flat size="xs" color="green"
            style="margin:0 auto"
            @click="toggle">
            <q-tooltip>Select columns to show</q-tooltip>
          </q-btn>
          <q-btn icon="widgets" round dense flat size="xs" color="amber"
            @click="gridmode = !gridmode">
            <q-tooltip>Toggle view mode</q-tooltip>
          </q-btn>
          <q-btn icon="sync" round dense flat size="xs" color="cyan"
            :loading="loading"
            @click="load">
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>
        </div>
      </template>

      <template v-slot:body-cell-TaskToRun="props">
        <q-td>
          <job2run :path="sanitize(props.value)"/>
        </q-td>
      </template>

      <template v-slot:bottom-row>
        <q-tr v-if="selected.length">
          <q-td colspan="100%">
            <div>
              <span>Tasks to remove:</span>
              <span> {{selectedList}} </span>
              <q-btn icon="delete" size="sm" dense rounded no-caps label="Remove" color="red"
                :loading="loading"
                @click="remove">
                <q-tooltip>Remove selected tasks</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </q-tr>
      </template>

    </q-table>
  </main>
</template>

<script>

import job2run from 'src/components/Job2run'
const task = require('windows-scheduler')
const { spawn } = require('child_process')

export default {
  name: 'Schtasks',
  data () {
    return {
      loading: false,
      tasknames: [],
      gridmode: false,
      selected: [],
      pagination: {
        sortBy: 'TaskName',
        descending: false,
        page: 1,
        rowsPerPage: 10
        // rowsNumber: xx if getting data from a server
      },
      columns: [{ name: 'id', label: 'id', field: 'id' }],
      data: [],
      visible: ['TaskName', 'ScheduleType', 'Days', 'Months', 'StartTime', 'Status', 'TaskToRun'],
      selectcols: false
    }
  },
  computed: {
    viewable () {
      return this.columns.filter(e => e.name !== 'id')
    },
    selectedTasks () {
      return this.selected.map(e => e.TaskName)
    },
    selectedList () {
      return this.selectedTasks.join(', ')
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
      spawn('cmd.exe', ['/C', 'taskschd.msc'])
    },
    toggle () {
      this.selectcols = !this.selectcols
    },
    async remove () {
      this.loading = true
      try {
        for (const e of this.selected) {
          await task.delete(e.TaskName)
        }
      } catch (e) {
        console.warn('Delete task Error', e)
      } finally {
        this.load()
        this.loading = false
      }
    },
    async load () {
      this.selected = []
      this.columns = [{ name: 'id', label: 'id', field: 'id' }]
      this.data = []
      let cnt = 0
      try {
        this.loading = true
        const list = await task.get(undefined, 'LIST') // get a list of all schedule tasks
        const matchArray = list.match(/(?<=TaskName:\s*.*?)BKIT.+?[\r\n]/igm) // Filter out only BKIT-*
        this.tasknames = [...new Set(matchArray)]
        this.tasknames.forEach(async taskname => {
          const csv = await task.get(taskname, 'CSV', true)
          const lines = (csv.split(/[\n\r]+/) || []).filter(e => e)
          const headers = lines.shift().replace(/^"|"$/g, '').split(/","/)
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
