<template>
  <div class="document-viewer">
    <div v-if="!documentData" class="empty-state">
      <el-empty description="请选择左侧文档查看解析结果" />
    </div>

    <div v-else class="viewer-container">
      <!-- 图片预览区域 -->
      <div class="image-section">
        <div class="image-header">
          <h3>{{ documentData.fileName }}</h3>
          <div class="image-actions">
            <el-button size="small" @click="handleZoomIn">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button size="small" @click="handleZoomOut">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button size="small" @click="handleRotate">
              <el-icon><RefreshRight /></el-icon>
            </el-button>
            <el-button size="small" @click="handleDownload">
              <el-icon><Download /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="image-container" ref="imageContainer">
          <div
            class="image-wrapper"
            :style="{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }"
          >
            <img
              ref="imageRef"
              :src="documentData.imagePath"
              :alt="documentData.fileName"
              @load="handleImageLoad"
            />
            
            <!-- 标注框 -->
            <div
              v-for="(item, index) in currentContent"
              :key="index"
              class="annotation-box"
              :class="{ active: selectedField === item.id }"
              :style="getBoxStyle(item.position)"
              @click="selectField(item.id)"
            >
              <div class="annotation-label">{{ item.key }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 字段信息区域 -->
      <div class="info-section">
        <div class="info-header">
          <h3>解析结果</h3>
          <el-button size="small" type="primary" @click="handleExport">
            导出数据
          </el-button>
        </div>

        <div class="info-content">
          <el-scrollbar height="100%">
            <div class="field-list">
              <div
                v-for="item in currentContent"
                :key="item.id"
                class="field-item"
                :class="{ selected: selectedField === item.id }"
                @click="selectField(item.id)"
                @mouseenter="hoverField = item.id"
                @mouseleave="hoverField = null"
              >
                <div class="field-label">{{ item.key }}</div>
                <div class="field-value">{{ item.value || '-' }}</div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ZoomIn, ZoomOut, RefreshRight, Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

export default {
  name: "DocumentViewer",
  components: {
    ZoomIn,
    ZoomOut,
    RefreshRight,
    Download,
  },
  props: {
    documentData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      scale: 1,
      rotation: 0,
      selectedField: null,
      hoverField: null,
      imageWidth: 0,
      imageHeight: 0,
    };
  },
  computed: {
    currentContent() {
      if (!this.documentData || !this.documentData.content) return [];
      return this.documentData.content[0]?.info || [];
    },
  },
  watch: {
    documentData(newVal) {
      if (newVal) {
        this.resetView();
      }
    },
  },
  methods: {
    handleImageLoad(e) {
      this.imageWidth = e.target.naturalWidth;
      this.imageHeight = e.target.naturalHeight;
    },

    getBoxStyle(position) {
      if (!position || !position[0] || position[0].length === 0) {
        return { display: "none" };
      }

      const points = position[0];
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);

      const left = Math.min(...xs);
      const top = Math.min(...ys);
      const width = Math.max(...xs) - left;
      const height = Math.max(...ys) - top;

      return {
        left: `${(left / this.documentData.width) * 100}%`,
        top: `${(top / this.documentData.height) * 100}%`,
        width: `${(width / this.documentData.width) * 100}%`,
        height: `${(height / this.documentData.height) * 100}%`,
      };
    },

    selectField(id) {
      this.selectedField = id === this.selectedField ? null : id;
    },

    handleZoomIn() {
      this.scale = Math.min(this.scale + 0.1, 3);
    },

    handleZoomOut() {
      this.scale = Math.max(this.scale - 0.1, 0.5);
    },

    handleRotate() {
      this.rotation = (this.rotation + 90) % 360;
    },

    handleDownload() {
      if (!this.documentData) return;
      
      const link = document.createElement("a");
      link.href = this.documentData.imagePath;
      link.download = this.documentData.fileName;
      link.click();
      
      ElMessage.success("下载成功");
    },

    handleExport() {
      const data = this.currentContent.map((item) => ({
        字段名: item.key,
        字段值: item.value,
      }));

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        Object.keys(data[0]).join(",") +
        "\n" +
        data.map((row) => Object.values(row).join(",")).join("\n");

      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `${this.documentData.fileName}_解析结果.csv`;
      link.click();

      ElMessage.success("导出成功");
    },

    resetView() {
      this.scale = 1;
      this.rotation = 0;
      this.selectedField = null;
    },
  },
};
</script>

<style scoped>
.document-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.viewer-container {
  display: flex;
  gap: var(--spacing-lg);
  height: 100%;
  padding: var(--spacing-lg);
}

/* 图片区域 */
.image-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-small);
  overflow: hidden;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.image-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.image-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.image-container {
  flex: 1;
  overflow: auto;
  position: relative;
  background: #f5f7fa;
}

.image-wrapper {
  position: relative;
  display: inline-block;
  transition: transform 0.3s ease;
  transform-origin: center center;
}

.image-wrapper img {
  display: block;
  max-width: 100%;
  height: auto;
  user-select: none;
}

.annotation-box {
  position: absolute;
  border: 2px solid var(--primary-color);
  background: rgba(24, 144, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.annotation-box:hover,
.annotation-box.active {
  border-color: var(--success-color);
  background: rgba(82, 196, 26, 0.15);
  z-index: 10;
}

.annotation-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: var(--primary-color);
  color: white;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  border-radius: var(--radius-small);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
}

.annotation-box:hover .annotation-label,
.annotation-box.active .annotation-label {
  opacity: 1;
}

/* 信息区域 */
.info-section {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-small);
  overflow: hidden;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.info-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.info-content {
  flex: 1;
  overflow: hidden;
}

.field-list {
  padding: var(--spacing-sm);
}

.field-item {
  padding: var(--spacing-md);
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: var(--spacing-sm);
  border: 1px solid transparent;
}

.field-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
}

.field-item.selected {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.field-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.field-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 500;
  word-break: break-all;
}
</style>

