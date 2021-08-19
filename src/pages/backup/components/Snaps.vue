<template>
  <header class="top">
    <transition-group name="snaps" tag="div" class="accordion" v-show="!isEmpty">
      <section class="cell"
        v-for="(snap, index) in snaps"
        :key="snap.id"
        @click="select(index)"
        :class="{selected: snap.id === currentSnap}">
        <header class="spine" :title="snap.date.format('DD-MM-YYYY HH:mm')">
          {{snap.date.fromNow(true)}}
        </header>
        <article>
          <time class="day">{{snap.date.format('dddd')}}</time>
          <time class="time">{{snap.date.format('HH:mm')}}</time>
          <time class="date">{{snap.date.format('DD-MM-YYYY')}}</time>
        </article>
      </section>
    </transition-group>
    <q-btn round flat icon="sync" color="bkit" size="xs"
      v-if="currentSnap"
      style="margin:auto 0"
      @click.stop="reload()"
      :disable="loading"/>
    <span v-else-if="!loading">
      No snapshots yet
    </span>
    <q-inner-loading :showing="loading">
      <q-spinner-facebook color="loader" size="40px"/>
    </q-inner-loading>
  </header>
</template>

<script>
const moment = require('moment')
moment.locale('en')
moment.relativeTimeThreshold('m', 119)
moment.relativeTimeThreshold('h', 47)
moment.relativeTimeThreshold('d', 59)
moment.relativeTimeThreshold('M', 23)

import { listSnaps } from 'src/helpers/api'

export default {
  name: 'Snaps',
  data () {
    return {
      loading: false,
      snaps: []
    }
  },
  props: {
    rvid: {
      type: String,
      required: true
    },
    snap: {
      type: String,
      default: undefined
    }
  },
  computed: {
    currentSnap: {
      get () { return this.snap },
      set (val) { this.$emit('update:snap', val) }
    },
    isEmpty () {
      return this.snaps.length === 0
    }
  },
  watch: {
    rvid: function () {
      this.load_snaps()
    }
  },
  methods: {
    select (index) {
      if (index >= 0) {
        this.currentSnap = this.snaps[index].id
      } else {
        this.currentSnap = null
      }
    },
    async load_snaps () {
      this.snaps.splice(0, this.snaps.length) // empty snaps
      await this.reload()
    },
    async reload () {
      this.loading = true
      const names = await listSnaps(this.rvid)
      for (const id of names) {
        if (!this.snaps.find(e => e.id === id)) {
          this.snaps.push({
            date: moment.utc(id.substring(5), 'YYYY.MM.DD-HH.mm.ss').local(),
            id
          })
        }
      }
      this.select(this.snaps.length - 1)
      this.loading = false
    }
  },
  mounted () {
    this.load_snaps()
  }
}
</script>

<style type="text/scss">
  .snaps-enter-active, .snaps-leave-active {
    transition: all 1s;
  }
  .snaps-enter, .snaps-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }
</style>
<style scoped lang="scss">
  @import "src/css/app.scss";

  $width: 10em;
  $bgcolor:lightgray;
  $hvcolor: rgba(230, 230, 230, 0.9);
  $heigth: $width * .7;
  $sheigth: $heigth * .85;

  .top {
    max-width:100%;
    display:inline-flex;
    .accordion {
      /* height:$heigth; */
      /* min-width: 2em; */
      display: flex;
      justify-content: flex-start;
      align-items: center;
      overflow:hidden;
      overflow-x:auto;
      /* margin:5px 2px 5px 20px; */
      color:#474747;
      background:#eee;
      padding:1px 3px;
      border-radius: 5px;
      border:2px solid #ccc;
      section{
        overflow:hidden;
        cursor:pointer;
        background: $bgcolor;
        border-radius: 4px;
        margin: 2px;
        width: 3em;
        min-width: 1em;
        height:$heigth;
        padding: 1px;
        transition:min-width .2s ease-out;
        position: relative;
        font-size: 8pt;
        header{
          white-space: nowrap;
          text-overflow: ellipsis;
          width: $heigth;
          line-height: 1em;
          text-align: left;
          vertical-align: middle;
          padding:0;
          left:-$heigth/2;
          top: $heigth/2;
          margin-left: 50%;
          font-weight: normal;
          display:block;
          position:absolute;
          transform: rotate(90deg);
          transform-origin: 50% 50%;
        }
        article{
          //https://www.sitepoint.com/create-calendar-icon-html5-css3/
          margin:0;
          display: flex;
          justify-content: center;
          align-items:center;
          position: relative;
          background-color: #c8c8c8;
          border-radius: 5px;
          box-shadow: 1px 1px 0 #666, 2px 2px 0 #666, 3px 3px 0 #666, 3px 4px 0 #666, 3px 5px 0 #666, 0 0 0 2px #bbb;
          overflow: hidden;
          width: 0;
          height: 0;
          top: 110%;
          transition:top .5s linear;
          transition-delay: .2s;
          time{
            display: block;
            width: 100%;
            font-size: 1em;
            font-weight: bold;
            font-style: normal;
            text-align: center;
            &.day{
              position: absolute;
              top: 0;
              left:0;
              padding: 0.2em 0;
              color: #fff;
              background-color: $bkit;
              border-bottom: 1px dashed #f37302;
              box-shadow: 0 2px 0 #67a9fb;
            }
            &.time{
              letter-spacing: -0.05em;
              color: #2f2f2f;
              position: relative;
              padding: 0.5em 0;
              &:before,&:after{
                content: "";
                display: block;
                position: absolute;
                bottom: 0em;
                width:1.5em;
                height:1.5em;
                border-radius:500px;
                border:2px dashed #bbb;
                background-color: #eee;
              }
              &:after {
                right:0.5em;
              }
              &:before{
                left:0.5em;
              }
            }
            &.date{
              position: absolute;
              bottom: 0.3em;
              left:0;
              color: #2f2f2f;
            }
          }
        }
        &:hover {
          background:$hvcolor;
        }
        &.selected{
          background:#eee;
          padding:0.5em 1em;
          width: auto;
          min-width: $width + 2;
          header{
            width:0;
            height:0;
            opacity: 0;
          }
          article{
            width: $width;
            height: $sheigth;
            top:0;
          }
        }
        &:not(.selected) {
          border: solid $bkit 1px
          /* border: solid crimson 1px; */
        }
      }
    }
  }
</style>
