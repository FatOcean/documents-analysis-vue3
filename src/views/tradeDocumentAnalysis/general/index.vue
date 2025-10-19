<template>
  <div class="bill-of-lading-wrapper" style="width: 100%">
    <ocr-layout
      @resetId="() => (activeTextId = null)"
      :data="data"
      v-model="page"
      ref="documents"
      :activeTabIndex="activeTabIndex"
      ><div class="search-box">
        <el-input
          placeholder="请输入字段名进行搜索"
          prefix-icon="el-icon-search"
          @input="fieldNameInput"
          v-model="fieldName"
        >
        </el-input>
        <el-checkbox v-model="checkedNull">隐藏空白字段</el-checkbox>
      </div>
      <table cellspacing="0" class="table-data">
        <thead>
          <td colspan="2">字段名</td>
          <td>识别结果</td>
        </thead>
        <tbody v-for="i in showPageData" :key="i.sortId">
          <template v-if="i.groupable">
            <tr>
              <td :rowspan="i.row.length + 1" class="td-title">
                {{ i.keyEn }}<br />{{ i.keyCh }}
              </td>
            </tr>
            <tr
              v-for="(j, jindex) in i.row"
              :key="jindex"
              :class="{
                active: activeTextId === j.sortId && text.keyCh === j.keyCh,
              }"
              @click="(e) => clickHandler(e, j)"
            >
              <template>
                <td>{{ j.keyEn }}<br />{{ j.keyCh }}</td>
                <td>
                  {{
                    j.values && j.values.length > 0 && j.values[0].value
                      ? j.values[0].value
                      : ""
                  }}
                </td>
              </template>
            </tr>
          </template>

          <tr
            v-else
            :class="{ active: activeTextId === i.sortId }"
            @click="(e) => clickHandler(e, i)"
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
      default: 'order'
    }
  },
  data() {
    return {
      data: staticData[this.productName],
      activeTextId: '',
      page: [], // 当前页面数据信息
      activeDocumentIndex: 0,
      activeTabIndex: 0,
      text: '',
      fieldName: '',
      checkedNull: false,
      showPageData: [] // 用作展示
    }
  },
  watch: {
    productName() {
      this.data = staticData[this.productName]
      this.page = this.disposeContent(this.data[0].content)
      this.$nextTick(() => {
        this.$refs.documents.resetProps()
      })
      this.fieldName = ''
      this.checkedNull = false
    },
    page: {
      handler(val) {
        this.showPageData = val
      },
      immediate: true // 立即执行
    },
    checkedNull() {
      // handler(val) {
      this.fieldNameInput()
      // }
    }
  },
  created() {
    const content = this.data[0].content
    this.page = this.disposeContent(content)
  },
  mounted() {},
  methods: {
    // 处理数据
    disposeContent(content) {
      // 找出groupable为true的数组中，row数组中存在values数组下数据为多个的情况
      // 修改原有数据，直接替换掉row数组
      const contents = content
      contents.forEach((item) => {
        if (item.groupable && item.row) {
          item.row = item.row
            .map((row) => {
              if (row.values && row.values.length > 1) {
                return row.values.map((value, index) => {
                  const newKeyCh = `${row.keyCh}${index + 1}`
                  return {
                    keyCh: newKeyCh,
                    keyEn: row.keyEn,
                    sortId: row.sortId,
                    values: [value]
                  }
                })
              } else {
                return row
              }
            })
            .flat() // 使用 flat() 展开嵌套数组
        }
      })
      return contents
    },
    clickHandler(e, i, noParent) {
      let el = e.target.parentNode.firstChild
      if (el.tagName === 'TR') el = el.firstChild
      if (!(i.values && i.values.length > 0 && i.values[0].value !== '')) {
        return
      }
      this.text = i
      e = e || window.event
      this.$refs.documents.$events.trigger('click-ocr-el', {
        el,
        id: i.sortId,
        text: i
      })
      this.activeTextId = this.$refs.documents.activeTextId
    },
    uploadFileData(res) {
      this.data = res.data
      this.page = this.disposeContent(this.data[0].content)
      this.checkedNull = false
      this.fieldName = ''
      this.activeTextId = ''
      this.$refs.documents.resetProps()
    },
    handleClick(value) {
      this.page = this.disposeContent(this.data[value - 1].content)
      this.checkedNull = false
      this.fieldName = ''
      this.activeTextId = ''
    },
    fieldNameInput() {
      const fieldName = this.fieldName.toLowerCase()
      this.activeTextId = ''
      this.$refs.documents.pathValue = null
      this.$refs.documents.text = ''
      this.$refs.documents.rectanglePosition = null
      this.showPageData = this.fuzzySearch(
        fieldName,
        this.page,
        this.checkedNull
      )
      // 对多层级数组再进行操作
      if (this.checkedNull) {
        this.showPageData = this.showPageData
          .map((item) => {
            if (item.row) {
              const filteredRow = item.row.filter((rowItem) => {
                return (
                  rowItem.values &&
                  rowItem.values.length > 0 &&
                  rowItem.values[0].value !== ''
                )
              })

              if (filteredRow.length > 0) {
                return { ...item, row: filteredRow }
              } else {
                return null
              }
            } else {
              return item
            }
          })
          .filter(Boolean)
      }
    },
    fuzzySearch(keyword, data, isCheckboxChecked) {
      // 将搜索关键字转换为小写，以进行不区分大小写的搜索
      const lowerKeyword = keyword.toLowerCase()

      // 进行模糊搜索
      const results = data.filter((item) => {
        // 检查 checkbox 是否选中，只有在选中时才判断隐藏空白字段
        // const isHiddenFieldChecked = isCheckboxChecked && item?.values?.length === 0
        const isHiddenFieldChecked =
          isCheckboxChecked &&
          (item?.values?.length === 0 ||
            item?.values?.every((valueObj) => valueObj.value.trim() === ''))
        // 检查 keyEn 和 keyCh 是否包含关键字
        const keyEnMatch = item.keyEn.toLowerCase().includes(lowerKeyword)
        const keyChMatch = item.keyCh.toLowerCase().includes(lowerKeyword)

        // 检查 values 中的 value 是否包含关键字
        const valueMatch = item?.values?.some((valueObj) =>
          valueObj.value.toLowerCase().includes(lowerKeyword)
        )

        // 递归检查 row 中的每个子项
        const rowMatch =
          item.row &&
          item.row.some(
            (rowItem) =>
              this.fuzzySearch(keyword, item.row, isCheckboxChecked).length > 0
          )

        // 返回任何匹配的项
        return (
          (keyEnMatch || keyChMatch || valueMatch || rowMatch) &&
          !isHiddenFieldChecked
        )
      })

      return results
    }
  }
}
</script>
<style lang="stylus" scoped>
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
  margin: 12px 0;

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
