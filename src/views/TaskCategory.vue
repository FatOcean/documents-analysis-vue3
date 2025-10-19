<template>
  <div class="task-category">
    <div class="header">
      <div class="header-left">
        <el-button 
          type="text" 
          @click="goBack" 
          class="back-button"
          :icon="ArrowLeft"
        />
        <h1>单据分类</h1>
      </div>
      <el-button type="primary" @click="confirmClassification">确定</el-button>
    </div>

    <div class="image-grid">
      <div
        v-for="(image, index) in imageList"
        :key="index"
        class="image-container"
      >
        <!-- 图片上方的选择器 -->
        <div class="image-controls">
          <div class="control-item">
            <label>单据分类：</label>
            <el-select
              v-model="image.category"
              placeholder="选择分类"
              size="small"
              @change="handleCategoryChange(index, $event)"
            >
              <el-option
                v-for="category in availableCategories"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              />
            </el-select>
          </div>
          <div class="control-item">
            <label>组别：</label>
            <el-select
              v-model="image.group"
              placeholder="选择组别"
              size="small"
              @change="handleGroupChange(index, $event)"
            >
              <el-option
                v-for="group in availableGroups"
                :key="group.value"
                :label="group.label"
                :value="group.value"
              />
            </el-select>
          </div>
        </div>

        <!-- 图片区域 -->
        <div
          class="image-item"
          :class="{ selected: selectedImages.includes(index) }"
          @click="toggleImageSelection(index)"
        >
          <img :src="image.url" :alt="image.name" />
          <div class="image-overlay">
            <span class="image-name">{{ image.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="imageList.length === 0" class="empty-state">
      <el-empty description="暂无图片需要分类">
        <el-button type="primary" @click="$router.push('/')">返回任务列表</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script>
import { ArrowLeft } from '@element-plus/icons-vue'

export default {
  name: 'TaskCategory',
  components: {
    ArrowLeft
  },
  data() {
    return {
      imageList: [
        {
          url: 'https://picsum.photos/300/200?random=1',
          name: '合同照片1.jpg',
          category: '',
          group: 1
        },
        {
          url: 'https://picsum.photos/300/200?random=2',
          name: '发票照片1.jpg',
          category: '',
          group: 1
        },
        {
          url: 'https://picsum.photos/300/200?random=3',
          name: '收据照片1.jpg',
          category: '',
          group: 1
        },
        {
          url: 'https://picsum.photos/300/200?random=4',
          name: '合同照片2.jpg',
          category: '',
          group: 1
        },
        {
          url: 'https://picsum.photos/300/200?random=5',
          name: '发票照片2.jpg',
          category: '',
          group: 1
        },
        {
          url: 'https://picsum.photos/300/200?random=6',
          name: '收据照片2.jpg',
          category: '',
          group: 1
        }
      ],
      selectedImages: [],
      availableCategories: [
        { label: '合同', value: 'contract1' },
        { label: '发票', value: 'invoice1' },
        { label: '提单', value: 'receipt2' }
      ],
      availableGroups: [
        { label: '组别1', value: 1 },
        { label: '组别2', value: 2 },
        { label: '组别3', value: 3 },
        { label: '组别4', value: 4 },
        { label: '组别5', value: 5 }
      ]
    }
  },
  mounted() {
    // 这里可以从路由参数中获取任务ID，然后加载对应的图片
    const taskId = this.$route.query.taskId
    if (taskId) {
      this.loadImages(taskId)
    }
  },
  methods: {
    loadImages(taskId) {
      // 模拟加载图片数据
      console.log('Loading images for task:', taskId)
    },

    toggleImageSelection(index) {
      const idx = this.selectedImages.indexOf(index)
      if (idx > -1) {
        this.selectedImages.splice(idx, 1)
      } else {
        this.selectedImages.push(index)
      }
    },

    handleCategoryChange(index, category) {
      this.imageList[index].category = category
      console.log(`图片 ${index + 1} 分类更改为:`, category)
    },

    handleGroupChange(index, group) {
      this.imageList[index].group = group
      console.log(`图片 ${index + 1} 组别更改为:`, group)
    },

    goBack() {
      this.$router.push('/')
    },

    confirmClassification() {
      // 验证所有图片都有分类
      const unclassifiedImages = this.imageList.filter(img => !img.category)
      if (unclassifiedImages.length > 0) {
        this.$message.warning('请为所有图片选择分类')
        return
      }

      // 模拟提交分类结果
      console.log('Classification results:', this.imageList)

      this.$message.success('分类完成，开始解析...')
      setTimeout(() => {
        this.$router.push('/')
      }, 1500)
    }
  }
}
</script>

<style scoped>
.task-category {
  padding: var(--spacing-xl);
  background: var(--bg-color);
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-small);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-button {
  color: var(--primary-color);
  font-size: var(--font-size-base);
  padding: var(--spacing-sm);
  border-radius: var(--radius-small);
  transition: var(--transition-fast);
}

.back-button:hover {
  color: var(--primary-hover);
  background-color: var(--primary-light);
}

.header h1 {
  color: var(--text-primary);
  font-size: var(--font-size-xxl);
  font-weight: 600;
  margin: 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-xl);
  background: var(--bg-white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-small);
}

.image-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-controls {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-hover);
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-color);
}

.control-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.control-item label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  font-weight: 500;
}

.image-item {
  position: relative;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-large);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-small);
}

.image-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
}

.image-item.selected {
  border-color: var(--success-color);
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.3);
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 8px 12px;
}

.image-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 移除原来的image-actions样式，因为选择器已移到图片上方 */

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.el-select{
  min-width: 140px;
}
</style>
