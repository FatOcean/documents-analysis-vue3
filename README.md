# 单据解析系统

基于 Vue 3 + Element Plus + Vite 的单据解析管理系统，支持图片和PDF文档的智能识别和分类。

## 功能特性

- **任务管理**: 创建、查看和管理单据解析任务
- **智能分类**: 对上传的图片进行分类，支持多种单据类型
- **解析结果**: 查看OCR识别后的结构化数据
- **文件上传**: 支持图片和PDF格式的文件上传
- **响应式设计**: 适配不同屏幕尺寸

## 技术栈

- **Vue 3**: 现代化的前端框架
- **Element Plus**: 企业级UI组件库
- **Vite**: 快速的构建工具
- **JavaScript**: 原生JavaScript，无TypeScript依赖

## 项目结构

```
单据解析/
├── src/
│   ├── components/          # 公共组件
│   ├── views/              # 页面组件
│   │   ├── TaskList.vue    # 任务列表页
│   │   ├── TaskCategory.vue # 任务分类页
│   │   └── ParseResult.vue  # 解析结果页
│   ├── router/             # 路由配置
│   ├── main.js             # 应用入口
│   └── App.vue             # 根组件
├── index.html              # HTML模板
├── vite.config.js          # Vite配置
└── package.json            # 项目依赖
```

## 安装和运行

### 1. 安装依赖

```bash
cd 单据解析
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 3. 构建生产版本

```bash
npm run build
```

## 使用说明

### 任务列表页
- 点击右上角"新增任务"按钮创建新任务
- 支持选择单据类型（合同、发票、收据等）
- 上传对应的图片或PDF文件
- 查看任务状态和操作历史

### 任务分类页
- 对上传的图片进行分类
- 支持多种分类标签
- 一行展示4个图片，便于对比选择
- 点击确定按钮完成分类并开始解析

### 解析结果页
- 查看识别后的结构化数据
- 支持合同、发票、收据等多种格式展示
- 查看原始图片和处理日志

## 开发说明

### 新增单据类型
在 `TaskList.vue` 中的 `uploadConfig` 对象中添加新的单据类型配置：

```javascript
uploadConfig: {
  // ... 现有配置
  newType: {
    label: '新单据类型',
    accept: '.jpg,.jpeg,.png,.pdf'
  }
}
```

### 自定义分类标签
在 `TaskCategory.vue` 中的 `availableCategories` 数组中添加新的分类选项：

```javascript
availableCategories: [
  // ... 现有分类
  { label: '新分类1', value: 'newCategory1' },
  { label: '新分类2', value: 'newCategory2' }
]
```

## 注意事项

1. 项目使用JavaScript，无需配置TypeScript
2. 已配置Element Plus图标组件，无需额外引入
3. 文件上传功能需要后端API支持，目前使用模拟数据
4. 图片分类功能支持多选和拖拽操作

## 贡献

欢迎提交Issue和Pull Request来改进项目！
