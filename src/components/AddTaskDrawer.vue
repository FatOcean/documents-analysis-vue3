<template>
  <!-- 新增任务抽屉 -->
  <el-drawer
    v-model="visible"
    title="新增任务"
    :size="700"
    @close="handleClose"
    class="task-drawer"
  >
    <div class="drawer-content">
      <el-form
        :model="taskForm"
        :rules="rules"
        ref="formRef"
        label-width="140px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>

        <el-form-item label="单据类型" prop="documentType">
          <el-select
            v-model="taskForm.documentType"
            placeholder="请选择单据类型"
            @change="handleDocumentTypeChange"
          >
            <el-option label="合同" value="contract" />
            <el-option label="发票" value="invoice" />
            <el-option label="收据" value="receipt" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item :label="currentUploadLabel" prop="files">
          <div class="custom-upload-area">
            <el-upload
              ref="uploadRef"
              :file-list="taskForm.files"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :before-upload="beforeUpload"
              :accept="currentAccept"
              :auto-upload="false"
              multiple
              :show-file-list="false"
            >
              <div class="upload-trigger">
                <el-button class="upload-btn" type="primary" plain>
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </el-upload>
            
            <!-- 文件列表展示 -->
            <div v-if="taskForm.files.length > 0" class="file-list">
              <div 
                v-for="(file, index) in taskForm.files" 
                :key="index"
                class="file-item"
              >
                <div class="file-preview">
                  <img v-if="isImageFile(file)" :src="getFilePreview(file)" :alt="file.name" />
                  <div v-else class="file-icon" :class="getFileIconClass(file)">
                    <span>{{ getFileExtension(file.name).toUpperCase() }}</span>
                  </div>
                </div>
                <div class="file-name">{{ file.name }}</div>
                <el-button 
                  type="text" 
                  class="remove-btn"
                  @click="removeFile(index)"
                  size="small"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            
            <!-- 提示文字 -->
            <div class="upload-tips">
              <div>1.支持pdf、jpg、png、jpeg、bmp、tif、tiff、zip、xls、xlsx、doc、docx格式</div>
              <div>2.压缩包内最多支持3张文件</div>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 底部按钮 -->
    <div class="drawer-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </div>
  </el-drawer>
</template>

<script>
import { Plus, Close } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

export default {
  name: "AddTaskDrawer",
  components: {
    Plus,
    Close,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "submit"],
  data() {
    return {
      taskForm: {
        name: "",
        documentType: "",
        files: [],
      },
      rules: {
        name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
        documentType: [
          { required: true, message: "请选择单据类型", trigger: "change" },
        ],
        files: [{ required: true, message: "请上传文件", trigger: "change" }],
      },
      uploadConfig: {
        contract: {
          label: "合同文件",
          accept: ".jpg,.jpeg,.png,.pdf",
        },
        invoice: {
          label: "发票文件",
          accept: ".jpg,.jpeg,.png,.pdf",
        },
        receipt: {
          label: "收据文件",
          accept: ".jpg,.jpeg,.png,.pdf",
        },
        other: {
          label: "其他文件",
          accept: ".jpg,.jpeg,.png,.pdf",
        },
      },
      currentUploadLabel: "请选择单据类型",
      currentAccept: ".jpg,.jpeg,.png,.pdf",
    };
  },
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
  },
  methods: {
    handleDocumentTypeChange(type) {
      this.currentUploadLabel = this.uploadConfig[type].label;
      this.currentAccept = this.uploadConfig[type].accept;
      // 清空已上传的文件
      this.taskForm.files = [];
      if (this.$refs.uploadRef) {
        this.$refs.uploadRef.clearFiles();
      }
    },

    handleFileChange(file, fileList) {
      this.taskForm.files = fileList;
    },

    handleFileRemove(file, fileList) {
      this.taskForm.files = fileList;
    },

    removeFile(index) {
      this.taskForm.files.splice(index, 1);
    },

    isImageFile(file) {
      const imageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
      ];
      const fileName = file.name.toLowerCase();
      return (
        imageTypes.includes(file.raw?.type || file.type) ||
        /\.(jpg|jpeg|png|gif|bmp|webp)$/.test(fileName)
      );
    },

    getFilePreview(file) {
      if (file.url) return file.url;
      if (file.raw) {
        return URL.createObjectURL(file.raw);
      }
      return "";
    },

    getFileExtension(filename) {
      return filename.split(".").pop().toLowerCase();
    },

    getFileIconClass(file) {
      const extension = this.getFileExtension(file.name);
      const iconMap = {
        pdf: "icon-pdf",
        doc: "icon-word",
        docx: "icon-word",
        xls: "icon-excel",
        xlsx: "icon-excel",
        zip: "icon-zip",
        rar: "icon-zip",
        tif: "icon-image",
        tiff: "icon-image",
      };
      return iconMap[extension] || "icon-file";
    },

    beforeUpload(file) {
      // 文件大小限制等验证
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        ElMessage.error("上传文件大小不能超过 10MB!");
        return false;
      }
      return true;
    },

    handleSubmit() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          // 构造任务数据
          const taskData = {
            name: this.taskForm.name,
            documentType: this.taskForm.documentType,
            files: this.taskForm.files,
          };
          
          // 触发提交事件
          this.$emit("submit", taskData);
          
          // 重置表单
          this.resetForm();
          
          // 关闭抽屉
          this.visible = false;
        }
      });
    },

    handleCancel() {
      this.visible = false;
      this.resetForm();
    },

    handleClose() {
      this.resetForm();
    },

    resetForm() {
      this.taskForm = {
        name: "",
        documentType: "",
        files: [],
      };
      this.currentUploadLabel = "请选择单据类型";
      this.currentAccept = ".jpg,.jpeg,.png,.pdf";
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields();
      }
    },
  },
};
</script>

<style scoped>
/* 抽屉样式 */
.task-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xl);
}

.drawer-footer {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  background: var(--bg-white);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

/* 自定义上传区域 */
.custom-upload-area {
  width: 100%;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-large);
  background: var(--bg-hover);
  padding: var(--spacing-xl);
  min-height: 140px;
  transition: var(--transition-fast);
}

.custom-upload-area:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.upload-trigger {
  display: inline-block;
}

.upload-btn {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-medium);
  border: 2px dashed var(--border-color);
  background: var(--bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: var(--transition-fast);
}

.upload-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.upload-btn .el-icon {
  font-size: 24px;
  color: var(--primary-color);
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
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
  border-radius: var(--radius-medium);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-small);
  transition: var(--transition-fast);
}

.file-preview:hover {
  box-shadow: var(--shadow-medium);
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

.file-name {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-primary);
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
  color: var(--error-color);
  padding: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.remove-btn:hover {
  background: #fef0f0;
}

.remove-btn .el-icon {
  font-size: 14px;
}

/* 上传提示 */
.upload-tips {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-loose);
}
</style>

