<template>
  <ul class="directories">
    <li v-if="loading">
        <i class="fa fa-refresh fa-spin fa-fw"></i> Loading...
    </li>
    <li v-for="(folder,index) in folders" @click.stop="select(folder)">
      <header class="line" :class="{selected:currentPath === folder.location.path}">
        <div class="props">
          <span class="icon is-small">
            <i class="fa fa-minus-square-o close" 
              v-if="folder.open" 
              @click.stop="folder.open=false">
            </i>
            <i class="fa fa-plus-square-o open" 
              v-else  
              @click.stop="folder.open=true">
            </i>
          </span>
          <span class="icon is-small">
            <i class="fa fa-folder-open-o" v-if="folder.open"></i>
            <i class="fa fa-folder-o" v-else></i>
          </span>
          <span class="name">{{folder.name}}</span>
        </div>
        <a :href="getUrl('bkit',folder.name)" title="Recovery" @click.stop="" class="links">
          <span class="icon is-small">
            <i class="fa fa-history"></i>
          </span>
        </a>
      </header>
      <directory v-if="folder.open" :location="folder.location">
      </directory>
    </li>
  </ul>
</template>
<script>

import { warn } from 'src/helpers/notify'
import * as bkit from 'src/helpers/bkit'
const path = require('path')
import fs from 'fs-extra'

// <f+++++++++|2020/02/22-16:05:08|99|/home/jvv/projectos/bkit/apps/webapp.oldversion/.eslintignore
const regexpNewFile = /^<f[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpNewDir = /^cd[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
// <f.st......|2020/02/23-18:24:04|1652|/home/jvv/projectos/bkit/apps/client/package.json
const regexpChgFile = /^<f.s.{7}[|]([^|]*)[|]([^|]*)[|]([^|]*)/

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

function recursiveChecked (node, level = 0) {
  if (level > 100) {
    throw new Error('Recursion too deep (> 100)')
  }
  (node.children || []).map(child => {
    child.checked = node.checked
    recursiveChecked(child, level + 1)
  })
}

const isChecked = node => node.checked === true
const isNotChecked = node => node.checked === false

function upsideInform (parent) {
  if (parent === null) {
    return
  } else if (parent.children.every(isChecked)) {
    parent.checked = true
  } else if (parent.children.every(isNotChecked)) {
    parent.checked = false
  } else {
    parent.checked = null
  }
  return upsideInform(parent.parent)
}

export default {
  name: 'tree',
  data () {
    return {
      loading: false,
      splitterModel: 80,
      selected: '',
      root: [],
      children: [],
      currentfiles: []
    }
  },
  computed: {
    folders () {
      return this.childrens.filter(e => e.isdir)
    }
  },
  props: {
    path: {
      type: String,
      required: true
    }
  },
  methods: {
    selectdir (key) {
      if (!key) return
      this.selected = key
      const node = this.tree.getNodeByKey(key)
      if (node.children) this.currentfiles = [...node.children]
      this.tree.setExpanded(key, true)
    },
    checkdir (node) {
      console.log('Check dir:', node.path)
      const entries = []
      bkit.bash('./dkit.sh', [
        '--no-recursive',
        '--dirs',
        `${node.path}/`
      ], {
        onclose: () => {
          this.$nextTick(() => {
            console.log('dkit done')
            entries.sort(compare)
            // this.currentnodeentries = node.entries = entries
            if (this.selected === node.path) this.currentfiles = [...node.children]
          })
        },
        onreadline: (line) => {
          console.log('dkit:', line)
          const newfileMatch = line.match(regexpNewFile)
          if (newfileMatch) { // if this file is will be new on backup
            // const stepaths = (newfileMatch[3] || '').split('/')
            // const [name] = stepaths.slice(-1)
            // console.log(`File ${name} doesn't exits in backup yet`)
            // entries.push({ name, isfile: true, type: 'new' })
            const node = this.tree.getNodeByKey(newfileMatch[3])
            node.missing = true
          } else {
            const chgFileMatch = line.match(regexpChgFile)
            if (chgFileMatch) {
              // const stepaths = (chgFileMatch[3] || '').split('/')
              // const [name] = stepaths.slice(-1)
              // console.log(`File ${name} need update on backup yet`)
              // entries.push({ name, isfile: true, type: 'modified' })
              const node = this.tree.getNodeByKey(chgFileMatch[3])
              node.missing = false
              node.needupdate = true
            } else {
              const newdirMatch = line.match(regexpNewDir)
              if (newdirMatch) {
                // const stepaths = (newdirMatch[3] || '').split('/')
                // const [name] = stepaths.slice(-1)
                // console.log(`Dir ${name} doesn't exits in backup yet`)
                // entries.push({ name, isdir: true, type: 'new' })
                const node = this.tree.getNodeByKey(newdirMatch[3])
                node.missing = true
              }
            }
          }
        }
      })
    },
    node_checked (node) {
      if (node.checked !== null) {
        recursiveChecked(node)
        upsideInform(node.parent)
      }
    },
    async load (dir) {
      try {
        const entries = await fs.readdir(dir)
        const childrens = []
        for (const entry of entries) {
          try {
            const fullpath = path.join(dir, entry)
            const stat = await fs.stat(fullpath)
            const isDirectory = stat.isDirectory()
            childrens.push({
              parent: node,
              isdir: isDirectory,
              path: fullpath,
              name: entry,
              icon: isDirectory ? 'folder' : 'description',
              lazy: isDirectory,
              expandable: isDirectory,
              checked: !!node.checked,
              stat: stat
            })
          } catch (err) {
            warn(err)
          }
        }
        childrens.sort(compare)
        this.childrens = childrens
        this.checkdir()
      } catch (err) {
        warn(err)
        fail(err)
      }
    }
  },
  mounted () {
    this.load(this.name)
  }
}
</script>

<style scoped lang="scss">
  @import "../../../config.scss";
  ul.directories{
    list-style: none;
    position:relative;
    li {
      display: flex;
      flex-direction: column;
      padding-left: $li-ident;            /* indentation = .5em */
      line-height:$line-height;
      box-sizing: border-box;
      position: relative;
      &::before, &::after {
        border-width: 0;
        border-style: dotted;
        border-color: #777777;
        position:absolute;
        display:block;
        content:"";
        left:$li-ident / 4;
      }
      &::before{
        width: .5 * $li-ident;          /* 50% of indentation */
        height: 0;
        border-top-width:1px;
        margin-top:-1px;
        margin-left: 3px;
        top:$line-height / 2;
      }
      &::after{
        width: 0;
        top: 0;
        bottom: 1px;
        border-left-width:1px;
      }
      li:first-child::after{ // first line must start a little bit closer to the parent, except the top one
        top: - $line-height / 4;
      }
      &:last-child::after{ // last line should stop at middle
        bottom: auto; //disable bottom
        height: $line-height / 2;
      }
      li:last-child:first-child::after{ //just to correct shift to top on first line
        height: $line-height / 2 + $line-height / 4;
      }
      header.line{
        display: flex;
        width: 100%;
        border-radius:4px;
        cursor: pointer;
        .links{
          flex-shrink: 0;
          margin-right: 3px;
          margin-left: 1px;
        }
        .props{
          flex-grow: 1;
          display: flex;
          overflow: hidden;
          .icon{
            padding-right:1px;
            padding-left:1px;
            flex-shrink: 0;
          }
          .file{
            flex-grow: 1;
            display: flex;
            * {
              display: inline-block;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .name{
              flex-shrink: 0;
              flex-grow: 1;
              padding-right:3px;
              padding-left:3px;
            }
          }
          .open{
            cursor:zoom-in
          }
          .close{
            cursor: zoom-out
          }
        }
      }
      header.line.selected{
        background-color: $li-selected;
      }
      header.line:hover{
        background-color: $li-hover;
      }
    }
  }
</style>
