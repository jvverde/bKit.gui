 <template>
  <div>
    <div>
      <directory v-for="folder in folders" :key="folder.path" :entry="folder"/>
    </div>
    <div>
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

import dirminxin from 'src/mixins/directory'

export default {
  name: 'Entries',
  data () {
    return {
      open: false
    }
  },
  mixins: [dirminxin],
  components: {
    directory: () => import('./Directory'),
    file: () => import('./File')
  },
  props: {
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
    },
    isSelected () {
      return this.path === this.displayNode
    },
    isloading () {
      return this.loading
    },
    isdir () {
      return this.entry.isdir
    },
    isroot () {
      return this.entry.isroot
    },
    path () {
      return this.entry.path
    },
    leaf () {
      return !this.isdir
    },
    isOpen () {
      return this.open && this.isdir
    },
    onbackup () { // We should be very carefully with this one
      return !!this.entry.onbackup // && !!this.entry.markAsUnverified
    },
    onlocal () {
      return !!this.entry.onlocal
    },
    wasdeleted () { return this.onbackup && !this.onlocal },
    isfiltered () { return !!this.entry.isfiltered },
    isnew () { return !this.onbackup && this.onlocal && !!this.entry.isnew },
    wasmodified () { return this.onbackup && this.onlocal && !!this.entry.wasmodified },
    isUpdate () { return this.onbackup && this.onlocal && !this.isnew && !this.wasmodified },
    token () {
      return [this.path, this.snap, this.rvid, this.eventdate].join('|')
    }
  },
  watch: {
  },
  methods: {
  },
  mounted () {
  }
}
</script>

<style lang="scss">
  @import 'src/css/app.scss';
  .isSelected {
    color:$bkit;
    .wasDeleted {
      color: $bkit;
    }
  }
  .wasDeleted {
    color: $deleted;
  }
  .noBackup {
    color: $nobackup;
    color: var(--q-color-nobackup);
  }
  .expandicon, .noexpandicon {
    margin: 0px;
    padding: 0px;
    padding-right: 5px;
    color: $openclose;
  }
  .noexpandicon {
    visibility: hidden;
  }

</style>
