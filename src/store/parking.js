// import _ from 'lodash'
export const parseParkLot = (p, idx) => {
  const parksName = ['停车场 A', '停车场 B', '停车场 C', '停车场 D']
  const data = {}
  const rawData = p.raw
  const lat = rawData.latitude.toString()
  const long = rawData.longitude.toString()
  let latNum = lat.split('')
  latNum.splice(-6, 0, '.')
  latNum = latNum.join('')
  let longNum = long.split('')
  longNum.splice(-6, 0, '.')
  longNum = longNum.join('')
  // console.log(latNum, longNum)
  data.id = p.id
  data.name = parksName[idx] || '停车场 X'
  data.position = [longNum, latNum]
  data.remain = Number(rawData.remain.toString())
  data.capacity = Number(rawData.capacity.toString())
  let minPrice = rawData.min_price.toString()
  minPrice = minPrice.split('')
  minPrice.splice(-15, 0, '.')
  data.min_price = Number(minPrice.join('')).toPrecision(2)

  let maxPrice = rawData.max_price.toString()
  maxPrice = maxPrice.split('')
  maxPrice.splice(-15, 0, '.')
  data.max_price = Number(maxPrice.join('')).toPrecision(2)

  let currentPrice = rawData.current_price.toString()
  currentPrice = currentPrice.split('')
  currentPrice.splice(-15, 0, '.')
  data.current_price = Number(currentPrice.join('')).toPrecision(2)

  data.visible = false

  return data
}

export default {
  namespaced: true,
  state: () => ({
    isConnect: false,
    parks: [],
    markArr: [],
    loaded: false,
    isLocate: false // 导航状态
  }),
  actions: {
    setConnect: ({ commit }, { payload }) => {
      commit('setHeader', {
        header: payload.header,
        back: payload.back
      })
    },
    getParks: async ({ commit, state }) => {
      const api = window.$api
      const parkingStorage = api.query.parking
      // const parkIndex = [
      //   '0xf21b4fff364db4a2d31adcf580cd7f23842076d41446f3b1130310063fdf7f2f',
      //   '0x61197f65abfd736b69dfa093c74ae7b571a8359516413f74cdc64d6854b766be',
      //   '0xaece0ac9f0b576ee1455f474ff446e30291bec53de5c175ec6f8d605531cff72',
      //   '0x9951d5154eb6285f50f9dc61a384147d9c559ac594fcff91ae2e649df10e7a73'
      // ]
      let parks = []
      let parkingLotCount = await parkingStorage.allParkingLotsCount()
      parkingLotCount = parkingLotCount.toNumber()
      for (let i = 0; i < parkingLotCount; i++) {
        let parkId = await parkingStorage.parkingLotsByIndex(i)
        let park = await parkingStorage.parkingLots(parkId)
        park.id = parkId.toString()
        parks.push(park)
      }
      // console.log(parks)
      const datas = []
      parks.forEach((p, idx) => {
        const data = parseParkLot(p, idx)
        // console.log(data, 'data. .....')
        datas.push(data)
      })

      // console.log(datas)
      // const park1 = {
      //   position: [121.489559, 31.247538],
      //   name: '123',
      //   price: 24,
      //   amount: 30,
      //   current: 12,
      //   visible: false
      // }
      // const park2 = {
      //   position: [121.479559, 31.247538],
      //   name: '456',
      //   price: 30,
      //   amount: 80,
      //   current: 32,
      //   visible: false
      // }

      // const park3 = {
      //   position: [121.486359, 31.246538],
      //   name: '789',
      //   price: 23,
      //   amount: 130,
      //   current: 12,
      //   visible: false
      // }

      // const park4 = {
      //   position: [121.479559, 31.249538],
      //   name: '112',
      //   price: 15,
      //   amount: 50,
      //   current: 42,
      //   visible: false
      // }
      // let parks = [park1, park2, park3, park4]
      commit('setParks', { parks: datas })

      // let marks = datas.map((park, idx) => {
      //   let dis = AMap.GeometryUtil.distance(self.center, park.position)
      //   dis = Number(dis).toFixed(0)
      //   const data = {
      //     ...park,
      //     dis,
      //     events: {
      //       click () {
      //         state.markArr.forEach(window => {
      //           window.visible = false
      //         })

      //         self.$nextTick(() => {
      //           self.markArr[idx].visible = true
      //         })
      //       }
      //     }
      //   }
      //   return Object.assign({}, data)
      // })
      // self.markArr = _.cloneDeep(marks)
      // this.setMarks({ marks: _.cloneDeep(marks) })
    }
  },
  mutations: {
    setConnect: (state, { isConnect }) => {
      state.isConnect = isConnect
      return state
    },
    setParks: (state, { parks }) => {
      state.parks = parks
      return state
    },
    setMarks: (state, { marks }) => {
      state.markArr = marks.sort((a, b) => a.dis - b.dis)
      return state
    },
    setTargetPark: (state, { park }) => {
      state.targetPark = park
      return state
    },
    setLoaded: (state, { loaded }) => {
      state.loaded = loaded
      return state
    },
    setIsLocate: (state, { flag }) => {
      state.isLocate = flag
      return state
    }
  }
}
