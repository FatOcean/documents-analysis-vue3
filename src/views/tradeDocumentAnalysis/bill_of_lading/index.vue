<template>
  <div class="bill-of-lading-wrapper" style="width: 100%">
    <ocr-layout
      @resetId="() => (activeTextId = null)"
      :data="data"
      v-model="pageDetail"
      ref="documents"
      :activeTabIndex="activeTabIndex"
    >
      <div class="search-box">
        <el-input
          placeholder="请输入字段名进行搜索"
          prefix-icon="el-icon-search"
          v-model="search"
        >
        </el-input>
        <el-checkbox v-model="checked">隐藏空白字段</el-checkbox>
      </div>
      <div class="bill-tabs">
        <el-tabs @tab-click="handleClick" v-model="activeName">
          <el-tab-pane
            v-for="(item, index) in tabsArray"
            :key="index"
            :label="item.name"
            :name="item.name"
          >
            <table cellspacing="0" class="table-data">
              <thead>
                <td colspan="2">字段名</td>
                <td>识别结果</td>
              </thead>
              <tbody v-for="i in page" :key="i.sortId">
                <tr
                  v-if="i.rows && i.rows.length > 0"
                  @click.stop="(e) => clickHandler(e, i)"
                  :class="{
                    active: activeTextId === i.sortId && text.keyCh === i.keyCh,
                  }"
                >
                  <td :rowspan="i.rows.length + 1">
                    {{ i.keyEn }}<br />{{ i.keyCh }}
                  </td>
                  <td
                    :class="{
                      activeTd:
                        activeTextId === i.sortId && text.keyCh === i.keyCh,
                    }"
                  >
                  <table>
                    <p v-for="j in i.rows" :key="j.keyCh">
                      {{ j.keyEn }}<br />{{ j.keyCh }}
                    </p>
                    </table>
                  </td>
                  <td :rowspan="i.rows.length + 1">
                    {{
                      i.values && i.values.length > 0 && i.values[0].value
                        ? i.values[0].value
                        : ""
                    }}
                  </td>
                </tr>

                <tr
                  v-else
                  @click="(e) => clickHandler(e, i)"
                  :class="{
                    active: activeTextId === i.sortId && text.keyCh === i.keyCh,
                  }"
                >
                  <td colspan="2">{{ i.keyEn }}<br />{{ i.keyCh }}</td>
                  <td>
                    {{
                      i.values && i.values.length > 0 && i.values[0].value
                        ? i.values[0].value
                        : ""
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </ocr-layout>
  </div>
</template>
<script>
import { staticData } from '../staticData'
import ocrLayout from './ocr-layout.vue'
export default {
  components: {
    ocrLayout
  },
  props: {
    productName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      staticData,
      data: staticData[this.productName],
      activeTextId: '',
      page: [], // 当前页面数据信息
      activeName: '',
      activeDocumentIndex: 0,
      tabsArray: [],
      documents: [],
      search: '',
      checked: false,
      activeTabIndex: 0,
      instance: {},
      pageDetail: [],
      text: '',
      rowMapping: {
        'Goods Description': [
          { keyCh: '商品描述', keyEn: 'Goods Description' },
          { keyCh: '商品名称', keyEn: 'Commodity' },
          { keyCh: 'HS编码', keyEn: 'HS Code' },
          { keyCh: '数量', keyEn: 'Quantity' },
          { keyCh: '数量单位', keyEn: 'Quantity Unit' }
        ],
        'Gross Weight': [
          { keyCh: '毛重', keyEn: 'Gross Weight' },
          { keyCh: '毛重单位', keyEn: 'Gross Weight Unit' },
          { keyCh: '每箱毛重', keyEn: 'Gross Weight per Carton' }
        ],
        'Net Weight': [
          { keyCh: '净重', keyEn: 'Net Weight' },
          { keyCh: '净重单位', keyEn: 'Net Weight Unit' }
        ],
        'Product CBM': [{ keyCh: '商品体积', keyEn: 'Product CBM' }]
      }
    }
  },
  computed: {
    isbillofLading() {
      return this.productName === 'bill_of_lading' ? '提单' : '航空单'
    },
    originLocation() {
      return process.env.NODE_ENV === 'development'
        ? 'https://beefeather-ng-front.lianyirong.com.cn//file-handle-web/file/image'
        : `${window.location.origin}/file-handle-web/file/image`
    }
  },
  created() {
    this.instance = this.data[0]
    this.documents = this.instance
    this.page = this.documents.content
    this.page = this.handlePage(this.page)
    this.tabsArray = this.data.map((item, index) => {
      return { name: `${this.isbillofLading}${index + 1}` }
    })
    this.activeName = this.tabsArray[0].name
    this.pageDetail = this.page
  },
  mounted() {},
  watch: {
    checked(val) {
      this.activeTextId = null
      this.$refs.documents.activeTextId = null
      this.$refs.documents.pathValue = null
      this.$refs.documents.rectanglePosition = []
      this.filterEmpty(val)
    },
    search(val) {
      this.searchData()
    },
    productName() {
      this.data = staticData[this.productName]
      this.instance = this.data[0]
      this.documents = this.instance
      this.page = this.documents.content
      this.page = this.handlePage(this.page)
      this.tabsArray = this.data.map((item, index) => {
        return { name: `${this.isbillofLading}${index + 1}` }
      })
      this.activeName = this.tabsArray[0].name
      this.pageDetail = this.page
      this.$nextTick(() => {
        this.$refs.documents.resetProps()
      })
      this.checked = false
      this.search = ''
    }
  },
  methods: {
    createRowMapping(keyEn) {
      return this.rowMapping[keyEn] || []
    },
    handlePage(page) {
      return page.map((item) => {
        // eslint-disable-next-line no-return-assign
        return { ...item, rows: this.createRowMapping(item.keyCh) }
      })
    },
    clickHandler(e, i, noParent) {
      console.log(e)
      let el = e.target.parentNode.firstChild
      if (el.tagName === 'P') {
        el = el.parentNode.parentNode.parentNode.firstChild
      }
      if (!(i.values && i.values.length > 0 && i.values[0].value !== '')) {
        return
      }
      e = e || window.event
      this.text = i
      this.$refs.documents.$events.trigger('click-ocr-el', {
        el,
        id: i.sortId,
        text: i
      })
      this.activeTextId = this.$refs.documents.activeTextId
    },
    uploadFileData(res) {
      this.data = res.data
      this.instance = this.data[0]
      this.documents = this.instance
      this.page = this.documents.content
      this.page = this.handlePage(this.page)
      this.tabsArray = this.data.map((item, index) => {
        return { name: `${this.isbillofLading}${index + 1}` }
      })
      this.activeName = this.tabsArray[0].name
      this.pageDetail = this.page
      this.checked = false
      this.search = ''
    },

    handleClick(value) {
      let index
      if (typeof value === 'number') {
        index = value
        this.instance = this.data[index]
        this.documents = this.instance
        this.page = this.documents.content
        this.page = this.handlePage(this.page)
        this.activeName = this.tabsArray[index].name
        this.pageDetail = this.page
        this.checked = false
        this.search = ''
      } else {
        this.$refs.documents.handleTurnPage(Number(value.index) + 1, true)
      }
    },

    filterEmpty(flag) {
      const data =
        this.search !== ''
          ? this.searchArray(this.pageDetail, this.search.toLowerCase())
          : this.pageDetail
      if (flag) {
        this.page = data.filter((item) => {
          // 过滤掉values为空或者values为数组但value为空的项
          return (
            item.values &&
            (Array.isArray(item.values)
              ? item.values.some(
                (v) => v.value !== undefined && v.value !== null
              )
              : true)
          )
        })
      } else {
        this.page = data
      }
    },
    searchData() {
      this.activeTextId = null
      this.$refs.documents.activeTextId = null
      this.$refs.documents.pathValue = null
      this.$refs.documents.rectanglePosition = []
      if (this.checked) this.filterEmpty(true)
      this.page = this.searchArray(
        this.checked ? this.page : this.pageDetail,
        this.search.toLowerCase()
      )
    },
    searchArray(data, searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()

      return data.filter((item) => {
        // 判断 keyCh、keyEn、value 是否包含搜索关键词（不区分大小写）
        const keyChMatch = item.keyCh.toLowerCase().includes(lowerSearchTerm)
        const keyEnMatch = item.keyEn.toLowerCase().includes(lowerSearchTerm)

        if (item.values && Array.isArray(item.values)) {
          const valueMatch = item.values.some(
            (v) => v.value && v.value.toLowerCase().includes(lowerSearchTerm)
          )
          // 返回是否匹配任何一个属性
          if (keyChMatch || keyEnMatch || valueMatch) {
            return true
          }
        }

        // 判断是否包含在 rows 数组中（不区分大小写）
        if (item.rows && Array.isArray(item.rows)) {
          const rowsMatch = item.rows.some(
            (row) =>
              row.keyCh.toLowerCase().includes(lowerSearchTerm) ||
          row.keyEn.toLowerCase().includes(lowerSearchTerm)
          )
          // 如果 rows 中有匹配项，则返回 true
          if (rowsMatch) {
            return true
          }
        }

        // 返回是否匹配 keyCh 或 keyEn
        return keyChMatch || keyEnMatch
      })
    }
  }
}
</script>
<style lang="stylus" scoped>
.bill-tabs {
  ::v-deep .el-tabs__active-bar {
    min-width: 36px !important;
  }
}

.search-box {
  margin-top: 12px;
  display: flex;
  align-items: center;
  margin-bottom: 4px;

  .el-checkbox__label {
    padding-left: 4px;
    color: #202D40;
  }

  .el-checkbox {
    margin-left: 32px;
  }

  .el-checkbox__input.is-checked+.el-checkbox__label {
    color: #202D40;
  }
}

.table-data {
  width: 100%;
  margin-bottom: 16px;

  tbody {
    tr {
      td {
        table {
          width: calc(100% + 8px);
          margin-left: -8px;

          p {
            padding-left: 8px;
            border-bottom: 1px solid #e3e8f0;
            white-space: pre-line;

            &:last-child {
              border: none;
            }
          }
        }
      }
    }
  }

  thead {
    background: #F3F4F6;

    td {
      border-top: 1px solid #E3E8F0;
      font-weight: bold;
      color: #202D40;

      &:last-child {
        width: 50%;
        color: #202D40;
        border-right: 1px solid #E3E8F0;
      }
    }
  }

  tr td:last-child {
    width: 50%;
    color: #202D40;
    border-right: 1px solid #E3E8F0;
  }

  .td-title {
    width: 33% !important;
    border-right: none !important;
  }

  tr {
    &:hover {
      background: #f6f9fb;
      cursor: pointer;
    }

    &.commonCursor {
      cursor: default;
      background: none;
    }

    &.active {
      .activeTd {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-right: none;
        border-left: none;
      }

      td:first-child {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-top-left-radius: 4px;
        border-right: none;
        border-bottom-left-radius: 4px;
      }

      td:last-child {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-left: 1px solid #E3E8F0;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }
  }

  td {
    line-height: 40px;
    padding-left: 8px;
    padding-right: 8px;
    color: #5F6C80;
    border-bottom: 1px solid #E3E8F0;
    border-left: 1px solid #E3E8F0;
    white-space: pre-line;
  }
}
</style>
