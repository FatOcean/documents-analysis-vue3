/**
 * 静态数据管理
 * 使用 Vite 的 import.meta.glob 动态导入数据文件
 */

// 使用 Vite 的 import.meta.glob 导入所有数据文件
const dataModules = import.meta.glob('./data/*.js', { eager: true })

// 处理导入的模块，提取数据
const staticData = {}

for (const path in dataModules) {
  // 提取文件名作为 key，例如：'./data/vat.js' -> 'vat'
  const moduleName = path.replace(/^\.\/data\/(.*)\.js$/, '$1')
  const module = dataModules[path]
  
  // 获取导出的 data
  staticData[moduleName] = module.data || module.default || []
}

// 单证类型名称映射
const documentTypeNames = {
  vat: '增值税发票',
  order: '订单',
  airway_bill: '航空运单',
  bill_of_lading: '提单',
  receipt: '回单',
  financial_statement: '财务流水',
  cross_border_contract: '跨境合同',
  customs_declaration: '报关单',
  commercial_invoice: '商业发票',
  bank_acceptance_bill: '银行汇票',
}

/**
 * 获取指定类型的数据
 * @param {string} type - 数据类型
 * @returns {Array} 数据数组
 */
export function getDataByType(type = 'vat') {
  const data = staticData[type] || staticData.vat || []
  console.log(`加载 ${documentTypeNames[type] || type} 数据:`, data.length, '个文档')
  return data
}

/**
 * 获取所有可用的数据类型
 * @returns {Array} 类型数组
 */
export function getAvailableTypes() {
  return Object.keys(staticData).map(type => ({
    value: type,
    label: documentTypeNames[type] || type,
    count: staticData[type]?.length || 0
  }))
}

/**
 * 获取默认数据
 * @returns {Array} 默认数据
 */
export function getDefaultData() {
  return getDataByType('vat')
}

/**
 * 根据 taskId 获取数据
 * @param {string} taskId - 任务ID
 * @returns {Array} 数据数组
 */
export function getDataByTaskId(taskId) {
  if (!taskId) {
    return getDefaultData()
  }

  // 根据 taskId 特征判断类型
  if (taskId.includes('vat') || taskId.includes('invoice')) {
    return getDataByType('vat')
  } else if (taskId.includes('order')) {
    return getDataByType('order')
  } else if (taskId.includes('airway') || taskId.includes('bill')) {
    return getDataByType('airway_bill')
  }

  return getDefaultData()
}

/**
 * 获取混合数据
 * @param {Array} types - 类型数组
 * @returns {Array} 混合数据
 */
export function getMixedData(types = ['vat', 'order', 'airway_bill']) {
  const mixedData = []
  
  types.forEach(type => {
    const data = staticData[type]
    if (data && data.length > 0) {
      mixedData.push({
        ...data[0],
        documentType: type,
        documentTypeName: documentTypeNames[type]
      })
    }
  })

  console.log('加载混合数据:', mixedData.length, '个文档')
  return mixedData
}

// 导出
export { staticData, documentTypeNames }

export default {
  staticData,
  documentTypeNames,
  getDataByType,
  getAvailableTypes,
  getDefaultData,
  getDataByTaskId,
  getMixedData
}
