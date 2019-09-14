<template>
  <q-layout view="lHh lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-white">
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
        >
          <!-- <q-icon name="menu" /> -->
          <q-icon name="img:statics/menu.png" />
        </q-btn>

        <q-toolbar-title>

        </q-toolbar-title>
        <q-btn
          flat
          dense
          round
          @click="$router.push('/setting')"
          aria-label="Menu"
        >
          <q-icon name="setting" />
        </q-btn>

      </q-toolbar>
    </q-header>
    <q-footer elevated>
      <q-tabs
        v-model="selectedTab"
        indicator-color="black"
        :current="selectedTab"
        class="bg-white"
      >
        <q-route-tab
          to="/"
          exact
        >
          <q-icon name="img:statics/map.png" />
        </q-route-tab>
        <q-route-tab
          to="/user"
          exact
        >
          <q-icon name="img:statics/user.png" />
        </q-route-tab>
      </q-tabs>
    </q-footer>
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-2"
    >
      <q-list>
        <q-item-label header>附近的停车场</q-item-label>
        <q-item
          v-for="(park, idx) in markArr"
          :key="idx"
          clickable
        >
          <!--
          <q-item-section>
            <q-item-label>{{ park.name }}</q-item-label>
            <q-item-label
              caption
              lines="1"
            >{{ park.price }} / 小时</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-item-label caption>{{park.dis}} m</q-item-label>
          </q-item-section>
          <q-item-section top side>
            <div class="text-grey-8 q-gutter-xs">
              <q-btn
                class="gt-xs"
                size="12px"
                flat
                dense
                round
                icon="map"
                 @click="()=>locate(park)"
              />
              <q-btn
                class="gt-xs"
                size="12px"
                flat
                dense
                round
                icon="done"
              />
            </div>
          </q-item-section> -->

          <!-- <q-item-section top class="col-2">
          <q-item-label class="q-mt-sm">{{ park.price }} / 小时</q-item-label>
        </q-item-section> -->

          <q-item-section
            top
            @click="()=>locate(park)"
          >
            <q-item-label lines="1">
              <span class="text-weight-medium">{{ park.name }}</span>
            </q-item-label>
            <q-item-label
              caption
              lines="1"
            >
              {{park.dis}} m
            </q-item-label>
            <q-item-label lines="1">
              {{park.current_price | hour}}P / 小时
            </q-item-label>
          </q-item-section>

          <q-item-section
            top
            side
          >
            <div class="text-grey-8 q-gutter-xs">
              <q-btn
                size="12px"
                flat
                dense
                round
                icon="near_me"
                @click="()=>search(park)"
              />
              <q-btn
                size="12px"
                flat
                dense
                round
                icon="line_style"
                @click="()=>view(park, idx)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog
      v-model="showDialog"
      @before-hide="cleanFee"
    >
      <q-card v-if="showData">
        <q-card-section>
          <div class="text-h6">{{showData.type == 'entering' ? '入库' : '出库'}}成功</div>
        </q-card-section>

        <q-card-section>
          用户：{{showData.user_id | split}}
        </q-card-section>
        <q-card-section>
          停车场id: {{showData.parking_lot_hash | split}}
        </q-card-section>
        <q-card-section v-if="parkFee">
          费用: {{parkFee}} P
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="关闭"
            color="primary"
            v-close-popup
          />
          <q-btn
            v-if="showData.type == 'entering'"
            flat
            label="查看"
            color="primary"
            @click="viewDetail"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-page-sticky
      v-if="isLocate"
      position="bottom"
      :offset="[18, 18]"
    >
      <q-btn
        fab
        icon="close"
        color="primary"
        @click="cancelLocate"
      />
    </q-page-sticky>
  </q-layout>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import _ from 'lodash'
import Decimal from 'decimal.js'

export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: false,
      selectedTab: 'map',
      showDialog: false,
      showData: null
    }
  },
  mounted () {
    // 获取停车场
    this.getParks()
    this.getUserParkInfo()
    this.$root.$on('showDialog', this.dialog)
  },
  destroyed () {
    this.$root.$off('showDialog', this.dialog)
  },
  methods: {
    ...mapActions('parking', [
      'getParks'
    ]),
    ...mapActions('user', [
      'getUserParkInfo'
    ]),
    ...mapMutations('parking', [
      'setIsLocate',
      'setParkFee'
    ]),
    cleanFee () {
      this.setParkFee({ fee: 0 })
    },
    search (park) {
      this.leftDrawerOpen = false
      if (this.$route.path !== '/') {
        this.$router.push('/')
      }
      _.delay(() => { this.$root.$emit('search', park) }, 500)
    },
    locate (park) {
      this.leftDrawerOpen = false
      if (this.$route.path !== '/') {
        this.$router.push('/')
      }
      _.delay(() => { this.$root.$emit('locate', park) }, 500)
    },
    view (park, idx) {
      this.leftDrawerOpen = false
      if (this.$route.path !== '/') {
        this.$router.push('/')
      }
      _.delay(() => { this.$root.$emit('view', park, idx) }, 1000)
    },
    dialog (data, type) {
      this.showDialog = true
      data.type = type
      this.showData = data
      console.log(data, 'data ....')
    },
    viewDetail () {
      const data = this.showData
      if (data.type === 'entering') {
        this.$router.push('/user')
      }
    },
    cancelLocate () {
      this.setIsLocate({ flag: false })
      this.$root.$emit('clean')
    }
  },
  computed: {
    ...mapState('parking', [
      'markArr',
      'dialogType',
      'isLocate'

    ]),
    ...mapState('parking', [
      'parkFee'
    ])

  },
  filters: {
    hour (val) {
      if (val) {
        return new Decimal(val).times(3600).toString()
      }
    },
    split (val) {
      const head = val.substr(0, 5)
      const tail = val.substr(-5)
      return `${head}...${tail}`
    }
  }

}
</script>

<style>
</style>
