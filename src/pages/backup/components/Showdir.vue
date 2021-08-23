 <template>
  <div class="bkit-showdir full-width row wrap justify-left">
    <item v-for="children in childrens" :key="children.path" :entry="children"/>
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
  name: 'show-content',
  mixins: [dir],
  components: {
    item: () => import('./Item')
  },
  computed: {
    childrens () {
      return [...this.entries].sort(compare)
    }
  }
}
</script>

<style lang="scss">
</style>
