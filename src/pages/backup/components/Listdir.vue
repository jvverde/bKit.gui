 <template>
  <div class="full-width">
    <div class="full-width">
      <directory v-for="folder in folders" :key="folder.path" :entry="folder"/>
    </div>
    <div class="full-width">
      <file v-for="file in files" :key="file.path" :entry="file"/>
    </div>
  </div>
</template>
<script>

const comparenames = (a, b) => {
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
  return 0
}
const compare = (a, b) => {
  if (a.isdir && b.isdir) return comparenames(a, b)
  else if (!a.isdir && !b.isdir) return comparenames(a, b)
  else if (a.isdir) return -1
  else if (b.isdir) return 1
  else return 0
}

import dir from 'src/mixins/directory'

export default {
  name: 'Entries',
  mixins: [dir],
  components: {
    directory: () => import('./Directory'), /* Directory also dynamically import this moddule */
    file: () => import('./File')
  },
  computed: {
    childrens () {
      return [...this.entries].sort(compare)
    },
    folders () {
      return this.childrens.filter(e => e.isdir)
    },
    files () {
      return this.childrens.filter(e => !e.isdir)
    }
  }
}
</script>

<style lang="scss">
</style>
