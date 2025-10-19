<template>
  <div
    class="vat-invoice-wrapper"
    style="flex-shrink: 1; flex-grow: 1; width: calc(100vw - 230px)"
  >
    <ocr-layout
      @resetId="() => (activeTextId = null)"
      @tabs="tabs"
      @changeActivePageIndex="changeActivePageIndex"
      :data="documents"
      v-model="page"
      ref="documents"
    >
      <div class="search-box">
        <el-input
          placeholder="请输入字段名进行搜索"
          prefix-icon="el-icon-search"
          @input="fieldNameInput"
          v-model="fieldName"
        >
        </el-input>
        <el-checkbox v-model="checkedNull">隐藏空白字段</el-checkbox>
      </div>
      <el-tabs @tab-click="handleClick" v-model="activeName">
        <el-tab-pane
          v-for="(item, index) in tabsArray"
          :key="index"
          :label="item.name"
          :name="item.name"
        ></el-tab-pane>
      </el-tabs>
      <table cellspacing="0" class="table-data">
        <thead>
          <td colspan="2">字段名</td>
          <td>识别结果</td>
        </thead>
        <tr
          :class="{
            active: activeTextId === i.id && activeTableType === 'info',
            pointer: i.position,
          }"
          @click="(e) => clickHandler(e, i, 'info')"
          v-for="i in showPageData.content[0].info"
          :key="i.key"
        >
          <td colspan="2" >{{ i.key }}</td>
          <td style="word-break: break-all;" >{{ i.value }}</td>
        </tr>
        <template v-for="(item, index) in showPageData.content[0].commodity">
          <tr v-bind:key="index">
            <td
              class="td-title"
              v-show="showPageData.content[0].commodity[index].length > 0"
              :rowspan="showPageData.content[0].commodity[index].length + 1"
            >
              货物或应税劳务、服务描述{{ index + 1 }}
            </td>
          </tr>
          <tr
            :class="{
              active:
                activeTextId === item.id && activeTableType === 'commodity',
              pointer: item.position,
            }"
            @click="(e) => clickHandler(e, item, 'commodity')"
            v-for="item in showPageData.content[0].commodity[index]"
            :key="item.key"
          >
            <td >{{ item.key }}</td>
            <td>{{ item.value }}</td>
          </tr>
        </template>
        <tr
          :class="{
            active: activeTextId === i.id && activeTableType === 'others',
            pointer: i.position,
          }"
          @click="(e) => clickHandler(e, i, 'others')"
          v-for="i in showPageData.content[0].others"
          :key="i.key"
        >
          <td colspan="2">{{ i.key }}</td>
          <td>{{ i.value }}</td>
        </tr>
      </table>
    </ocr-layout>
  </div>
</template>
<script>
import ocrLayout from './ocr-layout'
import { staticData } from '../staticData'
import { cloneDeep } from 'lodash'
export default {
  data() {
    return {
      activePageIndex: 0,
      activeTextId: '',
      page: {},
      activeName: '',
      activeDocumentIndex: 0,
      tabsArray: [],
      documents: staticData.vat,
      activeTableType: '',
      fieldName: '',
      checkedNull: false,
      showPageData: {} // 用作展示
    }
  },
  components: { ocrLayout },
  watch: {
    checkedNull() {
      this.fieldNameInput()
    },
    page: {
      handler(val) {
        this.showPageData = cloneDeep(val)
      },
      deep: true,
      immediate: true // 立即执行
    }
  },
  computed: {
    originLocation() {
      return process.env.NODE_ENV === 'development'
        ? 'https://beefeather-ng-front.lianyirong.com.cn//file-handle-web/file/image'
        : `${window.location.origin}/file-handle-web/file/image`
    }
  },
  created() {
    this.page = this.documents[0]
    this.showPageData = cloneDeep(this.page)

    this.tabsArray = this.documents.map((item, index) => {
      return {
        name: `发票${index + 1}`
      }
    })
    this.activeName = this.tabsArray[0].name
  },
  methods: {
    changeActivePageIndex(activePageIndex) {
      this.activePageIndex = activePageIndex
    },
    tabs(activeDocumentIndex, activePageIndex) {
      this.activePageIndex = 0
      this.activeDocumentIndex = activeDocumentIndex
      this.tabsArray = this.documents.map((item, index) => {
        return {
          name: `发票${index + 1}`
        }
      })
      this.fieldName = ''
      this.checkedNull = false
      this.activeName = this.tabsArray[activePageIndex].name
    },
    handleClick(value) {
      this.tabsArray.forEach((item, index) => {
        if (item.name === value.name) {
          this.$refs.documents.handleClick(index)
        }
      })
      this.fieldName = ''
      this.checkedNull = false
    },
    clickHandler(e, i, type) {
      if (i.value === '' || i.position[0].length !== 4) {
        return
      }
      const el =
        e.target.nodeName === 'TR'
          ? e.target.firstChild
          : e.target.parentNode.firstChild
      this.activeTextId = i.id
      this.activeTableType = type
      e = e || window.event
      this.$refs.documents.$events.trigger('click-ocr-el', {
        el,
        value: i.position
      })
    },
    uploadFileData(res) {
      const data = res.data
      data.map((item) => {
        item.imagePath = `${this.originLocation}?filename=${encodeURIComponent(
          item.imagePath
        )}`
      })
      this.documents = data
      this.page = this.documents[0]
      this.showPageData = cloneDeep(this.page)
      this.tabsArray = this.documents.map((item, index) => {
        return {
          name: `发票${index + 1}`
        }
      })
      this.fieldName = ''
      this.checkedNull = false
      this.activeName = this.tabsArray[0].name
    },
    fieldNameInput() {
      const fieldName = this.fieldName.toLowerCase()
      this.activeTextId = ''
      this.$refs.documents.pathValue = null
      this.$refs.documents.activeText = null
      this.showPageData.content[0] = this.fuzzySearch(fieldName, this.page.content[0], this.checkedNull)
    },
    fuzzySearch(keyword, data) {
      const lowerKeyword = keyword.toLowerCase()

      // 进行模糊搜索
      const results = {
        info: this.searchAndCheckEmpty(data.info, lowerKeyword),
        commodity: data.commodity.map((subArray) => {
          return this.searchAndCheckEmpty(subArray, lowerKeyword)
        }),
        others: this.searchAndCheckEmpty(data.others, lowerKeyword)
      }

      return results
    },
    // 辅助函数
    searchAndCheckEmpty(categoryData, keyword, isNull = this.checkedNull) {
      const results = categoryData.filter((item) => {
        const isKeyMatch = item.key.toLowerCase().includes(keyword)
        const isValueMatch = item.value.toLowerCase().includes(keyword)
        const isNullMatch = isNull && item.value === ''
        return (isKeyMatch || isValueMatch) && !isNullMatch
      })
      return results
    }
  }
}
</script>
<style lang="stylus">
.pre-line {
  white-space: pre-line;
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
</style>
