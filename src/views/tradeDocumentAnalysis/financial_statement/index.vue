<template>
  <div
    class="treasury-flow-analysis-wrapper"
    style="flex-shrink: 1; flex-grow: 1; width: calc(100vw - 230px)"
  >
    <ocrLayout :data="data" ref="documents">
      <template>
        <div
          v-show="bank === '' && !loading && !failedStatus"
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
          <table cellspacing="0" class="table-data" ref="table">
            <tbody>
              <tr v-for="(row, rowindex) in page" :key="rowindex">
                <td
                  v-for="(item, index) in row.columns"
                  :key="rowindex + index"
                >
                  {{ item }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-show="!loading && failedStatus"
          class="noContent"
          v-loading="loading"
        >
          <img :src="failed" alt="" />
          <span>解析失败 </span>
          <span class="extraText"
            >上传流水与该银行信息不匹配，请重新选择银行</span
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
export default {
  name: 'treasuryFlowAnalysis',
  components: {
    ocrLayout
  },
  data() {
    return {
      failed,
      searching,
      data: staticData.financial_statement,
      page: {}, // 当前页面数据信息
      activeDocumentIndex: 0,
      documents: [],
      bank: '',
      loading: false,
      banks: null,
      failedStatus: false,
      taskId: ''
    }
  },
  created() {
    this.documents = this.data[0]
    this.page = this.documents.content
    this.bank = this.documents.bank
  },
  computed: {
    originLocation() {
      return process.env.NODE_ENV === 'development'
        ? 'https://beefeather-ng-front.lianyirong.com.cn//file-handle-web/file/image'
        : `${window.location.origin}/file-handle-web/file/image`
    }
  },
  mounted() {
    this.$refs.documents.$refs.rightTab.bank = this.documents.bank
  },
  methods: {
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
    },
    getResult(bank) {
      this.bank = bank
      this.loading = true
      const param = {
        taskId: this.taskId,
        bank,
        application: 'FINANCIAL_STATEMENT'
      }
      extractInfo(param)
        .then((res) => {
          res = res.data
          if (res.code === '200' && res.data[0]?.content?.length > 0) {
            this.documents.content = res.data[0].content
            this.$refs.documents.resizeImg()
            this.documents.bank = this.bank
            this.page = this.documents.content
            this.failedStatus = false
            this.data[0] = { ...this.documents, ...res.data[0] }
          } else {
            this.data[0].json = res.data[0]?.json || ''
            this.failedStatus = true
          }
        })
        .catch(() => {
          this.failedStatus = true
          this.documents.flag = ''
          this.bank = ''
          this.$refs.documents.down_allow = false
          this.$message({
            message: '解析失败',
            type: 'error',
            offset: 60
          })
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>
<style lang="stylus" scoped>
.table-data {
  width: 100%;

  tr {
    &:hover {
      background: #f6f9fb;
      cursor: pointer;
    }

    &:first-child {
      background: #f3f4f6;

      td {
        border-top: 1px solid #E3E8F0;
        color: #202D40;
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
    min-width: 100px;
    cursor: text;
    white-space: nowrap;

    &:last-child {
      border-right: 1px solid #E3E8F0;
    }
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
</style>
