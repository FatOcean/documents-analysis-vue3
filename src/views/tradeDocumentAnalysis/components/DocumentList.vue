<template>
  <div class="document-list">
    <div class="list-header">
      <h3>文档列表</h3>
      <span class="doc-count">{{ documents.length }} 个文档</span>
    </div>

    <el-scrollbar height="calc(100vh - 160px)">
      <div class="list-content">
        <div
          v-for="(doc, index) in documents"
          :key="doc.taskId || index"
          class="doc-item"
          :class="{ active: selectedDoc === index }"
          @click="selectDocument(doc, index)"
        >
          <div class="doc-thumbnail">
            <img :src="doc.imagePath" :alt="doc.fileName" />
            <div v-if="doc.isexample" class="example-badge">示例</div>
          </div>
          
          <div class="doc-info">
            <div class="doc-name" :title="doc.fileName">
              {{ doc.fileName }}
            </div>
            <div class="doc-meta">
              <span class="doc-status" :class="getStatusClass(doc.status)">
                {{ getStatusText(doc.status) }}
              </span>
              <span class="doc-fields">
                {{ getFieldCount(doc) }} 个字段
              </span>
            </div>
          </div>

          <div class="doc-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div v-if="documents.length === 0" class="empty-list">
          <el-empty description="暂无文档数据" />
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script>
import { ArrowRight } from "@element-plus/icons-vue";

export default {
  name: "DocumentList",
  components: {
    ArrowRight,
  },
  props: {
    documents: {
      type: Array,
      default: () => [],
    },
    selectedDoc: {
      type: Number,
      default: null,
    },
  },
  emits: ["select"],
  methods: {
    selectDocument(doc, index) {
      this.$emit("select", { doc, index });
    },

    getFieldCount(doc) {
      if (!doc.content || !doc.content[0] || !doc.content[0].info) {
        return 0;
      }
      return doc.content[0].info.length;
    },

    getStatusClass(status) {
      const statusMap = {
        0: "status-pending",
        1: "status-success",
        2: "status-failed",
      };
      return statusMap[status] || "status-pending";
    },

    getStatusText(status) {
      const statusMap = {
        0: "待处理",
        1: "已完成",
        2: "失败",
      };
      return statusMap[status] || "未知";
    },
  },
};
</script>

<style scoped>
.document-list {
  width: 300px;
  background: var(--bg-white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-small);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.doc-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.list-content {
  padding: var(--spacing-sm);
}

.doc-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  margin-bottom: var(--spacing-sm);
}

.doc-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
}

.doc-item.active {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.doc-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-small);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: #f5f7fa;
}

.doc-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.example-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--warning-color);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--radius-small);
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-meta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.doc-status {
  padding: 2px 8px;
  border-radius: var(--radius-small);
  font-weight: 500;
}

.status-pending {
  background: #fff7e6;
  color: var(--warning-color);
}

.status-success {
  background: #f6ffed;
  color: var(--success-color);
}

.status-failed {
  background: #fff1f0;
  color: var(--error-color);
}

.doc-fields {
  color: var(--text-tertiary);
}

.doc-arrow {
  color: var(--text-tertiary);
  font-size: 16px;
}

.empty-list {
  padding: var(--spacing-xxl) 0;
}
</style>

