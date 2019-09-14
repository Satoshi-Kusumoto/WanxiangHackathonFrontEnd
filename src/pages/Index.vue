<template>
  <q-page class="card">
    <q-card>
      <q-card-section>
        <q-input
          v-model="server"
          label="provider"
        >
          <template v-slot:append>
            <q-btn
              round
              dense
              flat
              icon="save"
              @click="setServer"
            />
          </template>
        </q-input>
      </q-card-section>
      <q-card-section>
        <q-select
          outlined
          v-model="name"
          :options="options"
          label="Outlined"
          @input="selectChange"
        />
      </q-card-section>

    </q-card>
  </q-page>
</template>

<script>
import { Notify } from 'quasar'
const { ApiPromise, WsProvider } = require('@polkadot/api')
const types = {
  ParkingLot: {
    owner: 'AccountId',
    remain: 'u32',
    capacity: 'u32',
    current_price: 'Balance',
    min_price: 'Balance',
    max_price: 'Balance',
    latitude: 'i32',
    longitude: 'i32'
  },
  ParkingLotInfo: 'ParkingLot',

  ParkingInfo: {
    user_id: 'AccountId',
    parking_lot_hash: 'H256',
    info_hash: 'H256',
    enter_time: 'Moment',
    current_time: 'Moment',
    current_fee: 'Balance'
  },

  EnteringInfo: 'ParkingInfo',
  LeavingInfo: 'ParkingInfo'
}
import {
  mapState,
  mapActions,
  mapMutations
} from 'vuex'

export default {
  name: 'Setting',
  data () {
    return {
      server: this.serverHost,
      options: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Ferdie'],
      name: ''
    }
  },
  mounted () {
    this.name = this.account
    if (this.serverHost) {
      this.server = this.serverHost
    }
  },
  methods: {
    ...mapMutations('user', [
      'setProvider',
      'setAccount'
    ]),
    ...mapActions('user', [
      'getUserParkInfo'
    ]),
    ...mapActions('parking', [
      'getParks'
    ]),
    async setServer () {
      try {
        const url = this.server
        const provider = new WsProvider(url)
        const api = await ApiPromise.create({ provider, types })
        window.$api = api
        this.setProvider({ provider: url })
        Notify.create('success ...')
      } catch (error) {
        Notify.create(error)
      }
    },
    selectChange (account) {
      this.setAccount({ account })
      this.getUserParkInfo()
      this.getParks()
    }
  },
  computed: {
    ...mapState('user', [
      'serverHost',
      'account'
    ])
  },
  watch: {
    // account (val) {
    //   if (val) {
    //     this.name = val
    //   }
    // },
    // serverHost (val) {
    //   if (val) {
    //     this.server = val
    //   }
    // }
  }
}
</script>
<style>
.card {
  width: 100%;
}
</style>
