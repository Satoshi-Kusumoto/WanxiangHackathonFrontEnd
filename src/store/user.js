import moment from 'moment'
import { parseParkLot } from './parking'
import Decimal from 'decimal.js'
import Keyring from '@polkadot/keyring'
moment.locale('zh-cn')

export default {
  namespaced: true,
  state: () => ({
    isConnect: false,
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', // bob
    parkInfo: undefined,
    balance: 0,
    serverHost: 'wss://kusama-rpc.polkadot.io/',
    account: 'Bob'
  }),
  actions: {
    getBalance: async ({ commit, state }) => {
      const balance = await window.$api.query.balances.freeBalance(
        state.address
      )
      commit('setBalance', {
        balance
      })
    },
    getUserParkInfo: async ({ commit, state }) => {
      const parkingStorage = window.$api.query.parking
      const data = await parkingStorage.userParkingInfo(state.address)
      // console.log(parkInfo, 'parkInfo')
      if (data.isEmpty) {
        commit('setParkInfo', {
          parkInfo: undefined
        })
        return
      }
      const rawData = data.raw
      let parkInfo = {}
      parkInfo.current_time = moment(
        Number(rawData.current_time.toString())
      ).format('YYYY-MM-DD hh:mm:ss')
      parkInfo.current_fee = rawData.current_fee.toString()
      parkInfo.enter_time = moment(
        Number(rawData.enter_time.toString())
      ).format('YYYY-MM-DD hh:mm:ss')
      let parkId = rawData.parking_lot_hash.toString()
      let park = await parkingStorage.parkingLots(parkId)
      let parsedPark = parseParkLot(park)
      parkInfo.parkLotInfo = parsedPark
      parkInfo.parkLotInfo.id = parkId
      parkInfo.dur_time = moment(
        Number(rawData.enter_time.toString())
      ).fromNow()
      let now = moment()

      let durSecond = now.diff(Number(rawData.enter_time.toString()), 'seconds')
      // let durSecond = now.diff(
      //   Number(rawData.enter_time.toString()),
      //   'seconds'
      // )
      let currentPrice = parsedPark.current_price
      let currentFee = parkInfo.current_fee

      parkInfo.calcFee = new Decimal(durSecond)
        .times(currentPrice)
        .add(currentFee)
        .toFixed(2)

      commit('setParkInfo', {
        parkInfo
      })
    }
  },
  mutations: {
    setParkInfo: (state, { parkInfo }) => {
      state.parkInfo = parkInfo
      return state
    },
    setBalance: (state, { balance }) => {
      state.balance = balance
      return state
    },
    setProvider: (state, { provider }) => {
      state.serverHost = provider
      return state
    },
    setAccount: (state, { account }) => {
      state.account = account
      const keyring = new Keyring({ type: 'sr25519' })
      const keys = keyring.addFromUri(`//${state.account}`)
      state.address = keys.address
      return state
    }
  }
}
