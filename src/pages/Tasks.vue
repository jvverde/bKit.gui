<template>
  <q-page padding class="relative">
    TASKS
  </q-page>
</template>

<script>
const task = require('windows-scheduler')

export default {
  name: 'Servers',
  data () {
    return {
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
          task.get(m, 'LIST', true)
            .then((result) => {
              const lines = (result.split(/[\n\r]+/) || []).filter(e => e).map(e => {
                const match = e.match(/(?<name>.+?):\s*(?<value>.+)$/)
                return match ? match.groups : {}
              })
              console.log('Lines:', lines)
            })
        })
      }
    }).catch(e => console.error(e))
      .finally(() => console.log('Finally'))
  }
}
</script>
