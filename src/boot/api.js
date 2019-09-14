const { ApiPromise, WsProvider } = require('@polkadot/api')

const host = 'wss://kusama-rpc.polkadot.io/'
// const host = 'wss://poc3-rpc.polkadot.io/'

export default async ({ Vue }) => {
  try {
    const provider = new WsProvider(host)
    const api = await ApiPromise.create({
      provider,
      types: {
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
    })
    Vue.prototype.$api = api
    window.$api = api
  } catch (error) {
    console.log(error)
  }
}
