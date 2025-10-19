const productListAll = [
  {
    name: '跨境贸易',
    icon: '上传',
    isShowChildren: true,
    children: [
      {
        name: '提单',
        staticName: 'bill_of_lading'
      },
      {
        name: '订单',
        staticName: 'order'

      },
      // {
      //   name: '报关单',
      //   staticName: 'customs_declaration'

      // },
      // {
      //   name: '航空单',
      //   staticName: 'airway_bill'

      // },
      {
        name: '跨境合同',
        staticName: 'cross_border_contract'

      }
    ]
  },
  {
    name: '财务票据',
    icon: '下载',
    isShowChildren: true,
    children: [
      // {
      //   name: '商业发票',
      //   staticName: 'commercial_invoice'
      // },
      // {
      //   name: '银行承兑汇票',
      //   staticName: 'bank_acceptance_bill'
      // },
      {
        name: '流水',
        staticName: 'financial_statement'
      },
      {
        name: '增值税发票',
        staticName: 'vat'
      }
      // {
      //   name: '回单',
      //   staticName: 'receipt'
      // }
    ]
  }
]

export { productListAll }
