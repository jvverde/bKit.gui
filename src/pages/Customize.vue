<template>
  <q-page padding class="relative">
    Customize from: {{palletsdir}}
    <div v-for="p in palettes" :key="p.name">
      Palette: {{p.name}}
      <div class="row no-wrap justify-center full-witdh">
        <div v-for="(entry, index) in p.palette" :key="index"
          class="q-my-sm q-pa-md column justify-between"
          :style="{height: '20vh', background: entry.value}">
          <div>{{entry.color}}</div>
          <div>{{entry.value}}</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>

// import fs from 'fs'
import path from 'path'
import { readdir, readfile } from 'src/helpers/readfs'
// $color1: #5bc0ebff;
const RE = /\$(?<color>.+?)\s*:\s*(?<value>#[\da-f]{6,8});/i

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
        const result = await readfile(entry.path, 'utf8').catch(e => (this.error = e))
        const lines = result.split(/\r*\n+/)
        const rgb = lines.reduce((r, v) => {
          const ismatch = v.match(RE)
          console.log(ismatch)
          if (ismatch) {
            const { color, value } = ismatch.groups || {}
            r.push({ color, value })
          }
          return r
        }, [])
        console.log(lines)
        console.log(rgb)
        this.palettes.push({
          name: entry.name,
          palette: rgb
        })
      }
    }
  },
  async mounted () {
    this.readdir()
  }
}
</script>
