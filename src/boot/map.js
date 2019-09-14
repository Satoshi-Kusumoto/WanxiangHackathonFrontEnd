import Vue from 'vue'
import VueAMap from 'vue-amap'

Vue.use(VueAMap)

VueAMap.initAMapApiLoader({
  key: 'e8e0c6ea84f82981e383ce3d00589c87',

  plugin: [
    'Autocomplete',
    'PlaceSearch',
    'Scale',
    'OverView',
    'ToolBar',
    'MapType',
    'PolyEditor',
    'AMap.CircleEditor',
    'MapMarker',
    'Driving'
  ],
  v: '1.4.4'
})

export default async ({ Vue }) => {
  Vue.prototype.$map = VueAMap
}
