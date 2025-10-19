/**
 * 数据管理器
 * 用于加载不同类型的示例数据
 */

// 导入所有类型的示例数据（使用命名导入）
import { data as vatData } from './data/vat.js'
import { data as orderData } from './data/order.js'
import { data as airwayBillData } from './data/airway_bill.js'

// 数据映射表
const dataMap = {
  vat: vatData,                    // 增值税发票
  order: orderData,                // 订单
  airway_bill: airwayBillData,    // 航空运单
  // 可以继续添加其他类型的数据
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
 * 获取指定类型的示例数据
 * @param {string} type - 单证类型
 * @returns {Array} 示例数据数组
 */
export function getDataByType(type = 'vat') {
  const data = dataMap[type] || dataMap.vat
  console.log(`加载 ${documentTypeNames[type] || type} 示例数据:`, data.length, '个文档')
  return data
}

/**
 * 获取所有可用的单证类型
 * @returns {Array} 单证类型数组
 */
export function getAvailableTypes() {
  return Object.keys(dataMap).map(type => ({
    value: type,
    label: documentTypeNames[type] || type,
    count: dataMap[type].length
  }))
}

/**
 * 获取默认数据（增值税发票）
 * @returns {Array} 默认示例数据
 */
export function getDefaultData() {
  return getDataByType('vat')
}

/**
 * 根据taskId获取对应的数据
 * 这里可以根据实际需求实现更复杂的逻辑
 * @param {string} taskId - 任务ID
 * @returns {Array} 数据数组
 */
export function getDataByTaskId(taskId) {
  // 这里可以根据taskId的特征判断应该加载哪种类型的数据
  // 示例：如果taskId包含特定关键字，加载对应类型的数据
  
  if (!taskId) {
    return getDefaultData()
  }

  // 简单的示例逻辑
  if (taskId.includes('vat') || taskId.includes('invoice')) {
    return getDataByType('vat')
  } else if (taskId.includes('order')) {
    return getDataByType('order')
  } else if (taskId.includes('airway') || taskId.includes('bill')) {
    return getDataByType('airway_bill')
  }

  // 默认返回增值税发票数据
  return getDefaultData()
}

/**
 * 混合多种类型的数据（用于演示）
 * @param {Array} types - 要混合的类型数组
 * @returns {Array} 混合后的数据数组
 */
export function getMixedData(types = ['vat', 'order', 'airway_bill']) {
  const mixedData = []
  
  types.forEach(type => {
    const data = dataMap[type]
    if (data && data.length > 0) {
      // 每种类型取第一个作为示例
      mixedData.push({
        ...data[0],
        documentType: type,
        documentTypeName: documentTypeNames[type]
      })
    }
  })

  console.log('加载混合示例数据:', mixedData.length, '个文档')
  return mixedData
}

export default {
  getDataByType,
  getAvailableTypes,
  getDefaultData,
  getDataByTaskId,
  getMixedData,
  documentTypeNames
}

