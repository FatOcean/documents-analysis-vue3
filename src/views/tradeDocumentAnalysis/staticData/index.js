const datas = require.context('./data', true, /\.js$/)
const staticData = datas.keys().reduce((data, modulePath) => {
  const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1')
  const value = datas(modulePath)
  data[moduleName] = value.data
  return data
}, {})
export { staticData }
