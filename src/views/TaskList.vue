<template>
  <div class="task-list">
    <!-- 页面标题 -->
    <div class="page-title" style="display: flex; justify-content: space-between; align-items: center;">
      <h1>文档审核</h1>
      <div class="action-bar">
        <el-button type="primary" @click="showAddDialog = true" class="add-btn">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
      </div>
    </div>

    <!-- 导航标签 -->
    <!-- <div class="nav-tabs">
      <div class="nav-tab active">文档审核</div>
    </div> -->

    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-form">
        <div class="search-item">
          <label>任务名称</label>
          <el-input
            v-model="searchForm.taskName"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-buttons">
          <el-button type="primary" @click="handleSearch" class="search-btn">
            搜索
          </el-button>
          <el-button @click="handleReset" class="reset-btn"> 重置 </el-button>
        </div>
      </div>
    </div>

    <!-- 操作按钮区域 -->

    <el-table
      :data="taskList"
      style="width: 100%"
      v-loading="loading"
      class="data-table"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="序号" width="80" />
      <el-table-column prop="name" label="任务名称"  />
      <el-table-column prop="documentType" label="单据类型" />
      <el-table-column prop="status" label="系统状态" >
        <template #default="scope">
          <div class="status-cell">
            <span
              class="status-dot"
              :class="getStatusDotClass(scope.row.status)"
            ></span>
            <span>{{ getStatusText(scope.row.status) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="创建人"  />
      <el-table-column prop="createTime" label="创建时间"  />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <div class="action-buttons">
            <el-button size="small" type="text" @click="viewResult(scope.row)"
              >查看</el-button
            >
            <el-button size="small" type="text" @click="goToCategory(scope.row)"
              >分类</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />

    <!-- 新增任务抽屉组件 -->
    <AddTaskDrawer v-model="showAddDialog" @submit="handleTaskSubmit" />
  </div>
</template>

<script>
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import AddTaskDrawer from "@/components/AddTaskDrawer.vue";

export default {
  name: "TaskList",
  components: {
    Plus,
    AddTaskDrawer,
  },
  data() {
    return {
      loading: false,
      showAddDialog: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      taskList: [],
      searchForm: {
        taskName: "",
      },
    };
  },
  mounted() {
    this.loadTaskList();
  },
  methods: {
    loadTaskList() {
      this.loading = true;
      // 模拟API调用
      setTimeout(() => {
        let mockData = [
          {
            id: 1,
            name: "合同审核任务1",
            documentType: "合同",
            status: "failed",
            reviewStatus: "pending_handler",
            organization: "ADMINISTRATOR",
            handler: "",
            reviewer: "",
            updater: "",
            updateTime: "2025-10-19 15:05:5",
            creator: "admin",
            createTime: "2025-10-19 15:05:5",
          },
          {
            id: 2,
            name: "发票识别任务1",
            documentType: "发票",
            status: "failed",
            reviewStatus: "pending_handler",
            organization: "ADMINISTRATOR",
            handler: "",
            reviewer: "",
            updater: "",
            updateTime: "2025-10-19 15:05:5",
            creator: "admin",
            createTime: "2025-10-19 15:05:5",
          },
        ];

        // 应用搜索过滤
        if (this.searchForm.taskName) {
          mockData = mockData.filter((item) =>
            item.name
              .toLowerCase()
              .includes(this.searchForm.taskName.toLowerCase())
          );
        }

        this.taskList = mockData;
        this.total = mockData.length;
        this.loading = false;
      }, 1000);
    },

    handleSizeChange(size) {
      this.pageSize = size;
      this.loadTaskList();
    },

    handleCurrentChange(page) {
      this.currentPage = page;
      this.loadTaskList();
    },

    handleSearch() {
      this.currentPage = 1;
      this.loadTaskList();
    },

    handleReset() {
      this.searchForm.taskName = "";
      this.currentPage = 1;
      this.loadTaskList();
    },

    handleRetry(task) {
      ElMessage.info("重试功能待实现");
    },

    handleTaskSubmit(taskData) {
      // 创建新任务
      const newTask = {
        id: Date.now(),
        name: taskData.name,
        documentType: taskData.documentType,
        status: "pending",
        reviewStatus: "pending_handler",
        organization: "ADMINISTRATOR",
        handler: "",
        reviewer: "",
        updater: "",
        updateTime: new Date().toLocaleString(),
        creator: "admin",
        createTime: new Date().toLocaleString(),
        files: taskData.files,
      };
      
      this.taskList.unshift(newTask);
      this.total += 1;
      ElMessage.success("任务创建成功!");
    },

    goToCategory(task) {
      this.$router.push({
        name: "TaskCategory",
        query: { taskId: task.id },
      });
    },

    viewResult(task) {
      // 跳转到统一的文档解析页面
      this.$router.push({
        path: "/document-parsing",
        query: { taskId: task.id },
      });
    },

    getStatusDotClass(status) {
      const statusMap = {
        pending: "status-pending",
        processing: "status-processing",
        completed: "status-completed",
        failed: "status-failed",
      };
      return statusMap[status] || "status-pending";
    },

    getStatusText(status) {
      const statusMap = {
        pending: "待处理",
        processing: "处理中",
        completed: "已完成",
        failed: "分类失败",
      };
      return statusMap[status] || "未知";
    },

    getReviewStatusType(reviewStatus) {
      const statusMap = {
        pending_handler: "warning",
        pending_review: "info",
        completed: "success",
        rejected: "danger",
      };
      return statusMap[reviewStatus] || "info";
    },

    getReviewStatusText(reviewStatus) {
      const statusMap = {
        pending_handler: "待经办审核",
        pending_review: "待复核",
        completed: "已完成",
        rejected: "已拒绝",
      };
      return statusMap[reviewStatus] || "未知";
    },
  },
};
</script>

<style scoped>
.task-list {
  padding: var(--spacing-xl);
  background: var(--bg-color);
  min-height: 100vh;
}

/* 页面标题 */
.page-title {
  margin-bottom: var(--spacing-xl);
}

.page-title h1 {
  color: var(--text-primary);
  font-size: var(--font-size-xxl);
  font-weight: 600;
  margin: 0;
}

/* 导航标签 */
.nav-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.nav-tab {
  padding: 12px 24px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.nav-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 500;
}

.nav-tab:hover {
  color: #1890ff;
}

/* 搜索区域 */
.search-section {
  background: var(--bg-white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-large);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-small);
}

.search-form {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.search-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.search-item label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  white-space: nowrap;
}

.search-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.search-btn {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  border-radius: var(--radius-medium);
}

.search-btn:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.reset-btn {
  border-color: var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-medium);
}

.reset-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 操作按钮区域 */
.action-bar {
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  border-radius: var(--radius-medium);
}

.add-btn:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

/* 表格样式 */
.data-table {
  background: var(--bg-white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-small);
}

/* 状态指示器 */
.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-pending {
  background: #faad14;
}

.status-processing {
  background: #1890ff;
}

.status-completed {
  background: #52c41a;
}

.status-failed {
  background: #ff4d4f;
}

/* 审核状态标签 */
.review-tag {
  background: #fff7e6;
  border-color: #ffd591;
  color: #d46b08;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons .el-button {
  color: #1890ff;
  padding: 4px 8px;
}

.action-buttons .el-button:hover {
  color: #40a9ff;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  text-align: right;
  /* background: white; */
  padding: 16px;
  border-radius: 8px;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
  justify-content: end;
}

/* 覆盖Element Plus默认样式 */
:deep(.el-table th) {
  background: #fafafa;
  color: #333;
  font-weight: 600;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-pagination .el-pager li.active) {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

:deep(.el-pagination .el-pager li:hover) {
  color: #1890ff;
}

/* 自定义上传区域 */
.custom-upload-area {
  width: 100%;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  padding: 20px;
  min-height: 140px;
}

.upload-trigger {
  display: inline-block;
}

.upload-btn {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px dashed #d9d9d9;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.upload-btn .el-icon {
  font-size: 24px;
  color: #1890ff;
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  align-items: flex-start;
}

.file-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100px;
}

.file-preview {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.icon-pdf {
  background: #ff4d4f;
}

.icon-word {
  background: #1890ff;
}

.icon-excel {
  background: #52c41a;
}

.icon-zip {
  background: #722ed1;
}

.icon-image {
  background: #fa8c16;
}

.icon-file {
  background: #8c8c8c;
}

.file-name {
  margin-top: 8px;
  font-size: 12px;
  color: #333;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: 8px;
  color: #f56c6c;
  padding: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #fef0f0;
}

.remove-btn .el-icon {
  font-size: 14px;
}

/* 上传提示 */
.upload-tips {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}

/* 抽屉样式 */
.task-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
