<template>
  <div>
    <div>
      <q-btn flat round dense ripple size="xs" color="button"
        :icon="visible ? 'remove' : 'add'"
        @click="show_task()"/>
      {{path}}
    </div>
    <div class="text-error" v-if="error">
      Batch file not found at '{{path}}' location
      <div class="text-fg">
        {{error}}
      </div>
    </div>
    <div v-else-if="visible" style="float:right">
      <span v-if="diskname && diskpath">
        Backup:
        <q-badge class="q-ml-xs" color="badger" text-color="black">
          {{diskname}}{{diskpath}}
        </q-badge>
      </span>
      <span v-else class="text-weight-light">
        Drive is not present
        <q-badge class="q-ml-xs shadow-3" color="badger-1" text-color="black" v-if="diskuuid">
          uuid: {{diskuuid}}
        </q-badge>
        <q-badge class="q-ml-xs shadow-3" color="badger-2" text-color="black" v-if="diskpath">
          path: {{diskpath}}
        </q-badge>
      </span>
    </div>
  </div>
</template>

<script>

import { readfile } from 'src/helpers/readfs'
import { getDiskName } from 'src/helpers/bkit'

export default {
  name: 'Job2run',
  data () {
    return {
      visible: false,
      error: null,
      diskname: undefined,
      diskuuid: undefined,
      diskpath: undefined
    }
  },
  props: {
    path: {
      type: String,
      require: true
    }
  },
  methods: {
    async show_task () {
      this.visible = !this.visible
      if (this.diskname && this.diskpath) return
      const result = await readfile(this.path).catch(e => (this.error = e))
      if (!result) return
      const content = result.toString()
      const match = content.match(/REM path='(?<path>.+?)'[\s\n\r]+/im)
      if (match) {
        this.diskpath = match.groups.path
      }
      const match2 = content.match(/REM uuid='(?<uuid>.+?)'[\s\n\r]+/im)
      if (match2) {
        this.diskuuid = match2.groups.uuid
        this.diskname = [...await getDiskName(this.diskuuid)][0]
      }
    }
  },
  mounted () {
    // this.show_task()
  }
}
</script>
