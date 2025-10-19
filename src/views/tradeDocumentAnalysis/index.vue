<template>
  <div class="document-parsing">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="text" @click="goBack" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>贸易单证解析</h1>
      </div>
      
      <!-- 开发模式：数据类型切换器 -->
      <div v-if="!taskId" class="header-right">
        <el-select 
          v-model="currentDataType" 
          @change="handleDataTypeChange"
          placeholder="选择数据类型"
          size="default"
        >
          <el-option label="增值税发票" value="vat" />
          <el-option label="订单" value="order" />
          <el-option label="航空运单" value="airway_bill" />
          <el-option label="混合数据" value="mixed" />
        </el-select>
        <el-tag type="info" size="small" style="margin-left: 10px">
          示例数据
        </el-tag>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="document-container">
      <!-- 左侧文档列表 -->
      <DocumentList
        :documents="documentList"
        :selected-doc="selectedDocIndex"
        @select="handleDocSelect"
      />

      <!-- 右侧文档查看器 -->
      <DocumentViewer :document-data="currentDocument" />
    </div>
  </div>
</template>

<script>
import { ArrowLeft } from "@element-plus/icons-vue";
import DocumentList from "./components/DocumentList.vue";
import DocumentViewer from "./components/DocumentViewer.vue";
import { getDefaultData, getDataByTaskId, getMixedData, getDataByType } from "./staticData/dataManager.js";

export default {
  name: "DocumentParsing",
  components: {
    ArrowLeft,
    DocumentList,
    DocumentViewer,
  },
  data() {
    return {
      documentList: [],
      selectedDocIndex: null,
      currentDocument: null,
      taskId: null,
      currentDataType: 'vat', // 当前选择的数据类型
    };
  },
  mounted() {
    this.taskId = this.$route.query.taskId;
    this.loadDocuments();
  },
  methods: {
    async loadDocuments() {
      try {
        if (this.taskId) {
          // 如果有taskId，调用API获取真实数据
          // TODO: 替换为实际的API调用
          // const response = await this.$api.getDocumentList(this.taskId);
          // this.documentList = response.data;
          
          // 暂时使用模拟数据
          await this.loadMockData();
        } else {
          // 如果没有taskId，加载默认示例数据
          await this.loadMockData();
        }

        // 默认选择第一个文档
        if (this.documentList.length > 0) {
          this.handleDocSelect({ doc: this.documentList[0], index: 0 });
        }
      } catch (error) {
        console.error("加载文档失败:", error);
        this.$message.error("加载文档失败");
      }
    },

    async loadMockData() {
      // 使用数据管理器加载数据
      if (this.taskId) {
        // 根据taskId加载对应类型的数据
        this.documentList = getDataByTaskId(this.taskId);
      } else {
        // 没有taskId，加载默认数据（增值税发票）
        this.documentList = getDefaultData();
        
        // 如果想展示混合数据（多种类型），可以使用：
        // this.documentList = getMixedData(['vat', 'order', 'airway_bill']);
      }
    },

    handleDocSelect({ doc, index }) {
      this.selectedDocIndex = index;
      this.currentDocument = doc;
    },

    handleDataTypeChange(type) {
      console.log('切换数据类型:', type);
      
      if (type === 'mixed') {
        // 加载混合数据
        this.documentList = getMixedData(['vat', 'order', 'airway_bill']);
      } else {
        // 加载指定类型的数据
        this.documentList = getDataByType(type);
      }
      
      // 默认选择第一个文档
      if (this.documentList.length > 0) {
        this.handleDocSelect({ doc: this.documentList[0], index: 0 });
      }
    },

    goBack() {
      this.$router.back();
    },
  },
};
</script>

<style scoped>
.document-parsing {
  min-height: 100vh;
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.page-header {
  background: var(--bg-white);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-small);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.back-button {
  color: var(--primary-color);
  font-size: var(--font-size-base);
  padding: var(--spacing-sm);
  border-radius: var(--radius-small);
  transition: var(--transition-fast);
}

.back-button:hover {
  background: var(--primary-light);
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-xxl);
  font-weight: 600;
  color: var(--text-primary);
}

/* 主内容区 */
.document-container {
  flex: 1;
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  overflow: hidden;
}
</style>
