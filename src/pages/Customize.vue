<template>
  <q-page padding class="relative">
    Customize from: {{palletsdir}}
    <div v-for="p in palettes" :key="p.path">
      {{p.path}}
    </div>
  </q-page>
</template>

<script>

// import fs from 'fs'
import path from 'path'
import { readdir, readfile } from 'src/helpers/readfs'

export default {
  name: 'Customize',
  data () {
    return {
      palettes: [],
      palletsdir: path.join(__statics, '/palettes/')
    }
  },
  methods: {
    async readdir () {
      for await (const entry of readdir(this.palletsdir)) {
        this.palettes.push(entry)
        const result = await readfile(entry.path, 'utf8').catch(e => (this.error = e))
        const lines = result.split(/\n+/)
        console.log(lines)
        console.log(result)
      }
    }
  },
  async mounted () {
    this.readdir()
  }
}
</script>
