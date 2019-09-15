<template>
  <q-page class="flex">
    <q-card class="cardPanel">
      <q-item>
        <q-item-section avatar>
          <q-avatar>
            <img src="https://cdn.quasar.dev/img/avatar2.jpg">
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{account}}</q-item-label>
          <q-item-label caption>
            <span>{{address | split}}</span>
          </q-item-label>
          <q-item-label caption>{{balance}}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <div class="">
          停车状态
        </div>
      </q-item>
      <q-item v-if="parkInfo">

        <q-item-section>
           <q-item-label>{{getParkName}}
            <span class="text-grey">(总{{getCap}} 余{{getRemain}} )</span>
          </q-item-label>
          <q-item-label caption>
            <span>入库时间 {{parkInfo.enter_time}}</span>
          </q-item-label>
          <q-item-label caption>
            <span>停车时间 {{parkInfo.dur_time}}</span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label caption>当前价格{{getPrice}} P</q-item-label>
          <q-item-label class="text-black">费用 ≈ {{parkInfo.calcFee}} P </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            label="出库"
            @click="leaving"
            :loading="loading"
          />
        </q-item-section>

      </q-item>
      <q-item
        class="noData"
        v-else
      >
        暂无停车数据
      </q-item>
    </q-card>

  </q-page>
</template>

<script>
import {
  mapState,
  mapActions,
  mapMutations
} from 'vuex'
import Keyring from '@polkadot/keyring'
import _ from 'lodash'

export default {
  name: 'PageIndex',
  data () {
    return {
      loading: false
    }
  },
  async mounted () {
    this.getBalance()
    this.getUserParkInfo()
  },
  methods: {
    ...mapActions('user', [
      'getUserParkInfo',
      'getBalance'
    ]),
    ...mapMutations('parking', [
      'setParkFee'
    ]),
    leaving () {
      this.loading = true
      const keyring = new Keyring({ type: 'sr25519' })
      // const alice = keyring.addFromUri('//Alice')
      const account = keyring.addFromUri(`//${this.account}`)
      const trx = window.$api.tx.parking
      const transfer = trx.leaving()
      transfer.signAndSend(account, ({ events = [], status }) => {
        if (status.isFinalized) {
          // console.log(status, 'finalized')
        } else {
          // console.log(status)
        }
        // this.$root.$emit('showDialog', events, status)
        events.forEach(({ phase, event: { data, method, section } }) => {
          if (!data.isEmpty) {
            console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString(), '-------------')
            let result = JSON.parse(data)
            if (method === 'Transfer' && result[0] === this.address) {
              console.log('setparkfee', result[2])
              this.setParkFee({ fee: result[2] })
            }
            let res = result.filter(r => {
              return r.user_id
            })
            if (res && res.length) {
              this.loading = false
              this.$root.$emit('showDialog', res[0], 'leaving')
              // _.delay(() => {
              // this.getUserParkInfo()
              // this.getBalance()
              // }, 5000)
              this.getUserParkInfo()
              this.getBalance()
            }
          }
        })
        _.delay(() => { this.loading = false }, 10000)
      })
    }
  },
  computed: {
    ...mapState('user', [
      'address',
      'parkInfo',
      'balance',
      'account'
    ]),
    ...mapState('parking', [
      'parkNames'
    ]),
    getParkName () {
      const park = this.parkInfo
      if (park && park.parkLotInfo) {
        const id = park.parkLotInfo.id
        const names = this.parkNames
        if (names[id]) return names[id]
      }
      return ''
    },
    getRemain () {
      const park = this.parkInfo
      if (park && park.parkLotInfo) {
        return park.parkLotInfo.remain
      }
      return ''
    },
    getCap () {
      const park = this.parkInfo
      if (park && park.parkLotInfo) {
        return park.parkLotInfo.capacity
      }
      return ''
    },
    getPrice () {
      const park = this.parkInfo
      if (park && park.parkLotInfo) {
        return (park.parkLotInfo.current_price * 3.6).toFixed(2)
      }
      return ''
    }
  },
  filters: {
    split (val) {
      const head = val.substr(0, 5)
      const tail = val.substr(-5)
      return `${head}...${tail}`
    }
  }
}
</script>

<style>
.cardPanel {
  width: 100%;
}

.userInfo {
  height: 70px;
}

.noData {
  display: flex;
  justify-content: center;
  color: gray;
  text-align: center;
}
</style>
