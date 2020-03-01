<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      @before-show="showChildrens"
      class="b-tree"
      ref="rootTree"
      :expand-icon="leaf ? 'description' : 'folder'"
      :expanded-icon="leaf ? 'description': 'folder_open'"
      expand-icon-class="b-kit-tree-icon">
      <template v-slot:header> <!-- this is the header line template -->

        <q-item-section side>
          <q-checkbox
            :indeterminate-value="null"
            toggle-indeterminate
            v-model="checked"
            keep-color
            size="xs"
            color="positive"
          />
        </q-item-section>

        <q-item-section no-wrap :class="{ showNode: showNode }">
         <q-item-label>{{name}}</q-item-label>
        </q-item-section>

        <q-item-section side no-wrap>
           <q-btn-group flat rounded>
            <q-btn round color="positive" flat size="sm" icon="visibility"
              @click.stop="see"/>
            <q-btn round color="positive" flat size="sm" icon="restore"/>
          </q-btn-group>
        </q-item-section>

      </template>
      <div v-if="open" style="margin-left:1em">
        <!-- dirs -->
        <tree
          :path="folder.path"
          :name="folder.name"
          :currentNode.sync="setNode"
          :selected.sync="folder.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="folder in folders"
          :key="folder.path"/>
        <!-- files-->
        <tree
          :leaf="true"
          :path="file.path"
          :name="file.name"
          :currentNode.sync="setNode"
          :selected.sync="file.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="file in files"
          :key="file.path"/>
      </div>

  </q-expansion-item>
</template>
<script>

import { readdir } from 'src/helpers/readfs'

function comparenames (a, b) {
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
  return 0
}
function compare (a, b) {
  if (a.isdir && b.isdir) return comparenames(a, b)
  else if (!a.isdir && !b.isdir) return comparenames(a, b)
  else if (a.isdir) return -1
  else if (b.isdir) return 1
  else return 0
}

const isChecked = node => node.selected === true
const isNotChecked = node => node.selected === false

export default {
  name: 'tree',
  data () {
    return {
      open: false,
      // checked: false,
      stat: null,
      childrens: []
    }
  },
  components: {
  },
  computed: {
    folders () {
      return this.childrens.filter(e => e.isdir)
    },
    files () {
      return this.childrens.filter(e => !e.isdir)
    },
    checked: {
      get () {
        return this.selected
      },
      set (val) {
        this.$emit('update:selected', val)
      }
    },
    showNode () {
      return this.path === this.currentNode
    },
    setNode: {
      get () {
        return this.currentNode
      },
      set (val) {
        this.$emit('update:currentNode', val)
      }
    }
  },
  props: {
    path: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    leaf: {
      type: Boolean,
      default: false
    },
    selected: {
      type: Boolean,
      default: false
    },
    currentNode: {
      type: String,
      required: true
    }
  },
  watch: {
    selected: function (val) {
      // console.log(`Watch selectet change to ${val} on ${this.path}`)
      if (val !== null) this.childrens.forEach(c => { c.selected = val })
    }
  },
  methods: {
    childSelect () {
      if (this.childrens.every(isChecked)) {
        this.checked = true
      } else if (this.childrens.every(isNotChecked)) {
        this.checked = false
      } else {
        this.checked = null
      }
    },
    showChildrens () {
      this.open = true
    },
    see () {
      console.log('see')
      this.setNode = this.path
      this.$emit('show', this.path)
    },
    async load (dir) {
      const childrens = []
      for await (const entry of readdir(dir)) {
        entry.selected = this.selected
        childrens.push(entry)
      }
      childrens.sort(compare)
      this.$nextTick(() => {
        this.childrens = childrens
      })
    }
  },
  mounted () {
    this.load(this.path)
    // check is name == path => means is a root and on those cases show the tree
    if (this.name === this.path) this.$refs.rootTree.show()
  }
}
</script>

<style scoped lang="scss">

</style>

<style lang="scss">
  .b-tree .q-item__section--avatar {
    min-width:0px;
  }
  .b-kit-tree-icon {
    color: $amber;
  }
  .showNode {
    color:$positive;
  }
</style>
