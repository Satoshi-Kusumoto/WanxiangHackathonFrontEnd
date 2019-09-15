<template>
  <q-page class="flex">
    <div class="map-container">
      <el-amap
        v-if="loaded"
        vid="maps"
        :center="center"
        :zoom="zoom"
        :amap-manager="mapManager"
        :plugin="plugins"
        :events="events"
        class="amap"
      >

        <el-amap-circle-marker
          :center="center"
          :radius="9"
          fill-color="#027be3"
          :fill-opacity="0.6"
        ></el-amap-circle-marker>

        <!-- <el-amap-ground-image v-for="groundimage in groundimages" :url="groundimage.url" :bounds="groundimage.bounds" :events="groundimage.events"></el-amap-ground-image> -->

        <el-amap-marker
          v-for="(park ,idx) in markArr"
          :key="idx+'marker'"
          :vid="idx+'marker'"
          :events="park.events"
          :position="park.position"
          :label="{content: `${park.current_price * 3600}P / 时`, offset: [-20, 35]}"
        >
          <!-- <div class="panel">
           <span class="">{{park.price}}/时</span>
           <span class="">{{park.dis}} m</span>
          </div> -->
        </el-amap-marker>

        <el-amap-info-window
          v-for="(park ,idx) in markArr"
          :key="idx"
          :vid="idx"
          :position="park.position"
          :visible="park.visible"
          :isCustom="true"
        >
          <div :style="slotStyle">
            <div class="close">
              <q-btn
                flat
                dense
                round
                size="6px"
                @click="()=>closeWindow(park)"
                icon="close"
              />
            </div>
            <div class="title">{{ park.name }} </div>
            <div class="price ">价格 {{park.current_price | hour }}P / 时</div>
            <div class="distance">距离 {{park.dis}} m</div>
            <div>
              <q-btn-group outline>
                <q-btn
                  flat
                  dense
                  label="导航"
                  icon="near_me"
                  size="6px"
                  @click="()=>searchRoute(park)"
                />
                <q-btn
                  dense
                  flat
                  label="详情"
                  icon="line_style"
                  size="6px"
                  @click="()=>showDetailModal(park, idx)"
                />
              </q-btn-group>
            </div>
          </div>
        </el-amap-info-window>

      </el-amap>
    </div>
    <q-dialog
      v-model="showDetail"
      position="bottom"
      :full-width="true"
    >
      <q-card v-if="currentPark">
        <q-card-section class="row items-center no-wrap">
          <div>
            <div class="text-weight-bold"> {{currentPark.name}}</div>
            <div class="text-grey"> {{currentPark.current_price | hour}}P / 小时</div>
            <div class="text-grey">总车位 {{currentPark.capacity}} </div>
            <div class="text-grey">剩余 {{currentPark.remain }} </div>
          </div>

        </q-card-section>
        <q-card-section>
          <div>
            <div class="text-grey3"> 最高价：{{currentPark.max_price || 0 | hour}} P</div>
            <div class="text-grey3"> 最低价：{{currentPark.min_price || 0 | hour}} P</div>
            <div class="text-grey3"> 当前价：{{currentPark.current_price || 0 | hour}} P</div>
          </div>
        </q-card-section>

        <q-card-section>
          历史平均价格
          <v-chart
            :width={width}
            class="echarts"
            :options="getChartsData(currentPark)"
          />
        </q-card-section>

        <q-card-section class="row">
          <q-btn
            v-if="!parkInfo"
            class="col"
            label="入库"
            :loading="loading"
            @click="entering"
          />

          <q-btn
            v-else
            class="col"
            label="查看"
            @click="viewDetail"
          />
          <!-- <q-btn
            class="col"
            outline
            label="出库"
            @click="leave"
          /> -->
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/polar'
import loadMap from '../utils/loadMap'
import { dom } from 'quasar'
import Keyring from '@polkadot/keyring'

const { height, width } = dom

import _ from 'lodash'
import Decimal from 'decimal.js'

export default {
  name: 'PageIndex',
  components: {
    'v-chart': ECharts
  },
  data () {
    return {
      zoom: 15,
      center: [121.4863590, 31.2482380],
      source: 'click',
      mapManager: null,
      markArr: [],
      driving: null,
      map: null,
      showDetail: false,
      events: {
        init (o) {
          this.map = o
        }
      },
      currentPark: null,
      width,
      height,
      loading: false
    }
  },
  async created () {
    loadMap()
      .then(AMap => {
        // console.log(AMap, '...............')
        // console.log(AMap.DrivingPolicy.LEAST_TIME, '...............')
        this.setLoaded({ loaded: true })
      })
    const VueAMap = this.$map
    let mapManager = new VueAMap.AMapManager()
    this.mapManager = mapManager
    this.$root.$on('view', this.view)
    this.$root.$on('locate', this.locate)
    this.$root.$on('search', this.search)
    this.$root.$on('clean', this.clean)
  },
  beforeDestroy () {
    this.$root.$off('view', this.view)
    this.$root.$off('locate', this.locate)
    this.$root.$off('search', this.search)
    this.$root.$off('clean', this.clean)

    this.setIsLocate({ falg: false })
  },
  mounted () {
    this.getParks()
  },

  methods: {
    ...mapActions('parking', [
      'getParks'
    ]),
    ...mapMutations('parking', [
      'setMarks',
      'setParks',
      'setLoaded',
      'setIsLocate',
      'setPriceMap'
    ]),

    viewDetail () {
      this.$router.push('/user')
    },
    entering () {
      this.loading = true
      const keyring = new Keyring({ type: 'sr25519' })
      // const alice = keyring.addFromUri('//Alice')
      const account = keyring.addFromUri(`//${this.account}`)

      const trx = window.$api.tx.parking
      const park = this.currentPark
      const { id } = park
      const transfer = trx.entering(id)
      transfer.signAndSend(account, ({ events = [], status }) => {
        if (status.isFinalized) {
        } else {

        }
        events.forEach(({ phase, event: { data, method, section } }) => {
          console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString(), '-------------')

          if (!data.isEmpty) {
            let result = JSON.parse(data)
            let res = result.filter(r => {
              return r.user_id
            })
            if (res && res.length) {
              this.loading = false
              this.$root.$emit('showDialog', res[0], 'entering')
            }
          }
        })
        _.delay(() => { this.loading = false }, 10000)
      })
    },
    closeWindow (park) {
      park.visible = false
    },
    clean () {
      let oldDriving = this.driving
      if (oldDriving) {
        oldDriving.clear()
      }
    },
    searchRoute (park) {
      _.delay(() => this.setIsLocate({ flag: true }), 500)

      park.visible = false
      let oldDriving = this.driving
      if (oldDriving) {
        oldDriving.clear()
      }
      const driving = new AMap.Driving({
        // 驾车路线规划策略，AMap.DrivingPolicy.LEAST_TIME是最快捷模式
        policy: AMap.DrivingPolicy.LEAST_TIME,
        map: this.mapManager.getMap()
      })

      const position = park.position
      driving.search(this.center, position, (status, result) => {
        console.log('search')
        this.$nextTick()
      })
      this.driving = driving
    },
    showDetailModal (park, idx) {
      park.idx = idx
      this.currentPark = park
      this.showDetail = true
    },
    view (park, idx) {
      this.showDetailModal(park, idx)
    },
    search (park) {
      this.searchRoute(park)
    },
    locate (park, flag = true) {
      const self = this
      const markArr = self.markArr
      markArr.forEach(mark => {
        mark.visible = mark.name === park.name
      })
    },
    getChartsData (park) {
      // const time = moment().hour()
      const { id } = park
      let xData = []
      let yData = []
      for (let i = 18; i >= 0; i--) {
        let label = 24 - i
        xData.push(label + '点')
        yData.push(_.random(park.min_price * 3600, park.max_price * 3600))
      }

      const priceMap = this.priceMap
      if (priceMap[id]) {
        yData = priceMap[id]
      } else {
        priceMap[id] = yData
        this.setPriceMap({ map: priceMap })
      }

      return {
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xData
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: yData,
          type: 'line',
          areaStyle: {}
        }]
      }
    }

  },
  computed: {
    ...mapState('parking', [
      'parks',
      'targetPark',
      'loaded',
      'priceMap'
    ]),
    ...mapState('user', [
      'address',
      'parkInfo',
      'account'
    ]),
    plugins () {
      // const self = this
      // 地图类型插件
      const type = {
        pName: 'MapType',
        defaultType: 0,
        events: {
          init (instance) {
            // console.log(instance)
          }
        }
      }

      const toolbar = {
        pName: 'ToolBar',
        events: {
          init (instance) {
            // console.log(instance)
          }
        }
      }
      // const driving = {
      //   pName: 'Driving',
      //   events: {
      //     init (instance) {
      //       self.driving = instance
      //     }
      //   }
      // }
      return [type, toolbar]
    },
    slotStyle () {
      return {
        // width: '100px',
        padding: '4px',
        background: '#eee',
        color: '#333',
        border: '1px solid #aaa',
        borderRadius: '5px'
      }
    }

  },
  watch: {
    parks (val) {
      const self = this
      if (val.length) {
        let marks = val.map((park, idx) => {
          let dis = AMap.GeometryUtil.distance(self.center, park.position)
          dis = Number(dis).toFixed(0)
          const data = {
            ...park,
            dis,
            events: {
              click () {
                self.markArr.forEach(window => {
                  window.visible = false
                })

                self.$nextTick(() => {
                  self.markArr[idx].visible = true
                })
              }
            }
          }
          return Object.assign({}, data)
        })
        self.markArr = _.cloneDeep(marks)
        this.setMarks({ marks: _.cloneDeep(marks) })
      }
    }
    // targetPark (target) {
    //   const self = this
    //   const markArr = self.markArr
    //   if (target) {
    //     markArr.forEach(mark => {
    //       mark.visible = mark.name === target.name
    //     })
    //   }
    // }
  },
  filters: {
    balance (val) {
      let arr = val.split('')
      arr.splice(-15, 0, '.')
      let num = arr.join('')
      num = Number(num).toFixed(2)
      return num
    },
    hour (val) {
      if (val) {
        return new Decimal(val).times(3600).toString()
      }
    }
  }
}
</script>

<style scoped>
.map-container {
  width: 100vw;
}
.close {
  display: flex;
  height: 5px;
  justify-content: flex-end;
}

.title {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.echarts {
  max-width: 95vw;
  max-height: 300px;
}
</style>
