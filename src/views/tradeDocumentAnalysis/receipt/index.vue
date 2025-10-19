<template>
  <div class="treasury-flow-analysis-wrapper" style="width: 100%">
    <ocrLayout
      @tabs="tabs"
      :data="data"
      ref="documents"
      :activeTabIndex="activeTabIndex"
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
      <template>
        <div
          v-show="bank === ''&& !loading && !failedStatus"
          class="noContent"
          v-loading="loading"
        >
          <img :src="searching" alt="" />
          <span>在上方选择银行后方可进行解析</span>
        </div>
        <div
          class="hasContent"
          ref="content"
          v-show="bank !== '' && !loading && !failedStatus"
          v-loading="loading"
        >
          <el-tabs @tab-click="handleClick" v-model="activeName">
            <el-tab-pane
              v-for="(item, index) in tabsArray"
              :key="index"
              :label="item.name"
              :name="item.name"
            >
              <table cellspacing="0" class="table-data" ref="table">
                <thead>
                  <td colspan="2">字段名</td>
                  <td>识别结果</td>
                </thead>
                <tbody v-for="i in showPage.fields" :key="i.id">
                  <tr>
                    <td colspan="2">{{ i.key }}</td>
                    <td>{{ i.value }}</td>
                  </tr>
                </tbody>
              </table>
            </el-tab-pane>
          </el-tabs>
        </div>
        <div
          v-show="!loading && failedStatus"
          class="noContent"
          v-loading="loading"
        >
          <img :src="failed" alt="" />
          <span>解析失败 </span>
          <span class="extraText"
            >上传回单与该银行信息不匹配，请重新选择银行</span
          >
        </div>
        <div class="noContent" v-show="loading" v-loading="loading">
          <img :src="searching" alt="" />
          <span>正在解析中...</span>
        </div>
      </template>
    </ocrLayout>
  </div>
</template>
<script>
import { staticData } from '../staticData'
import failed from '@/assets/images/failed.png'
import searching from '@/assets/images/searching.png'
import { extractInfo } from '@/api/receiptAnalysis'
import ocrLayout from './ocr-layout'
import { cloneDeep } from 'lodash'
export default {
  data() {
    return {
      failed,
      searching,
      data: staticData.receipt,
      page: {}, // 当前页面数据信息
      activeName: '',
      activeDocumentIndex: 0,
      tabsArray: [],
      documents: [],
      activeTabIndex: 0,
      tabList: [],
      bank: '',
      loading: false,
      failedStatus: false,
      taskId: 0,
      instance: {},
      fieldName: '',
      checkedNull: false,
      showPage: []
    }
  },
  components: {
    ocrLayout
  },
  watch: {
    checkedNull: {
      handler(val) {
        this.fieldNameInput()
      }
    },
    page: {
      handler(val) {
        this.showPage = cloneDeep(val)
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
  mounted() {
    this.instance = this.data[0]
    this.documents = this.instance.content
    this.page = this.documents[0]
    // this.showPage = this.page
    this.tabsArray = this.documents.map((item, index) => {
      return { name: `回单${index + 1}` }
    })
    this.activeName = this.tabsArray[0].name
    this.$refs.documents.$refs.rightTab.bank = this.instance.bank
    this.bank = this.instance.bank
    this.$refs.documents.handleClick(this.page.boundingBox)
  },
  methods: {
    resetProps() {},
    uploadFileData({ res, taskId }) {
      res.data.map((item) => {
        item.imagePath = `${this.originLocation}?filename=${encodeURIComponent(
          item.imagePath
        )}`
      })
      this.taskId = taskId
      this.data = res.data
      this.bank = ''
      this.failedStatus = false
      this.$refs.documents.$refs.rightTab.bank = ''
      this.$refs.documents.$refs.rightTab.bankType = false
      this.$refs.documents.resetPosition()
    },
    getResult(bank) {
      this.bank = bank
      this.loading = true
      this.$refs.documents.resetPosition()
      const param = {
        taskId: this.taskId,
        bank,
        application: 'RECEIPT'
      }
      extractInfo(param)
        .then((res) => {
          res = res.data
          if (res.code === '200' && res.data[0]?.content.length > 0) {
            this.data[0] = { ...this.data[0], ...res.data[0] }
            this.instance.content = res.data[0].content
            this.$refs.documents.resizeImg()
            this.instance.flag = this.bank
            this.documents = this.instance.content
            this.tabsArray = this.documents.map((item, index) => {
              return { name: `回单${index + 1}` }
            })
            this.activeName = this.tabsArray[0].name
            this.page = this.documents[0]
            this.failedStatus = false
            this.fieldName = ''
            this.checkedNull = false
            this.$refs.documents.handleClick(this.page.boundingBox || {})
          } else {
            this.data[0].json = res.data[0]?.json || ''
            this.failedStatus = true
          }
        })
        .catch((err) => {
          console.log(err)
          this.failedStatus = true
          this.instance.flag = ''
          this.bank = ''
          this.$refs.documents.down_allow = false
        })
        .finally(() => {
          this.loading = false
        })
    },
    tabs(activeDocumentIndex, activePageIndex) {
      this.failedStatus = false
      this.activeDocumentIndex = activeDocumentIndex
      this.instance = this.data[activeDocumentIndex]
      this.$refs.documents.resetPosition()
      this.documents = this.instance.tabList
      this.bank = this.instance.flag
      if (this.bank !== '') {
        this.page = this.documents[0]
        this.tabsArray = this.documents.map((item, index) => {
          return { name: item.tabName }
        })
        this.activeName = this.tabsArray[0].name
        this.$refs.documents.handleClick(this.page.boundingBox || {})
        this.$refs.documents.down_allow = true
      }
    },
    handleClick(value) {
      this.$refs.documents.resetPosition()
      this.activeTabIndex = Number(value.index)
      this.page = this.documents[this.activeTabIndex]
      this.fieldName = ''
      this.checkedNull = false
      this.$refs.documents.handleClick(this.page.boundingBox || {})
    },
    fieldNameInput() {
      const fieldName = this.fieldName.toLowerCase()
      this.showPage.fields = this.fuzzySearch(fieldName, this.page.fields, this.checkedNull)
    },
    fuzzySearch(keyword, data, checkedNull) {
      return data.filter((item) => {
        const key = (item?.key || '').toLowerCase()
        const value = (item?.value || '').toLowerCase()

        const isKeyMatch = key.includes(keyword.toLowerCase())
        const isValueMatch = value.includes(keyword.toLowerCase())
        const isNullMatch = checkedNull && !value

        return (isKeyMatch || isValueMatch) && !isNullMatch
      })
    }
  }
}
</script>
<style lang="stylus">
.table-data {
  width: 100%;
  margin-bottom: 16px;

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

  tr {
    &:hover {
      background: #f6f9fb;
      cursor: pointer;
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
    min-width: 100px;
    cursor: text;

    &:last-child {
      border-right: 1px solid #E3E8F0;
      width: 50%;
    }
  }
}

.treasury-flow-analysis-wrapper {
  // loadin 样式
  .analyzing {
    display: flex;
    justify-content: center;
    position: absolute;
    top: 0;
    vertical-align: middle;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    background: #000000;
    position: fixed !important;
    z-index: 999;
    left: 0;
  }
}

.noContent {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  user-select: none;

  img {
    width: 104px;
    height: 96px;
  }

  span {
    margin-top: 12px;
    height: 20px;
    font-weight: bold;
    font-size: 14px;
    color: #5f6c80;
  }

  .extraText {
    margin-top: 12px;
    height: 18px;
    font-weight: 400;
    font-size: 12px;
    color: #8492a6;
  }
}

.hasContent {
  overflow: auto;
  width: calc(100% - 16px);
  position: relative;
  margin: 8px;
}

.el-select:hover .el-input__inner {
  border-color: #009688 !important;
}

.el-select .el-input.is-disabled .el-input__inner:hover {
  border-color: #E9E9E9 !important;
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
