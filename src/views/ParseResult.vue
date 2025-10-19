<template>
  <div class="parse-result">
    <div class="header">
      <h1>解析结果</h1>
      <el-button @click="$router.push('/')">返回列表</el-button>
    </div>

    <el-card class="result-card">
      <template #header>
        <div class="card-header">
          <span>任务详情</span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">合同审核任务1</el-descriptions-item>
        <el-descriptions-item label="单据类型">合同</el-descriptions-item>
        <el-descriptions-item label="状态">已完成</el-descriptions-item>
        <el-descriptions-item label="创建时间">2024-01-01 10:00:00</el-descriptions-item>
        <el-descriptions-item label="完成时间">2024-01-01 10:05:00</el-descriptions-item>
        <el-descriptions-item label="处理耗时">5分钟</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="result-card">
      <template #header>
        <div class="card-header">
          <span>识别结果</span>
        </div>
      </template>

      <el-tabs type="border-card">
        <el-tab-pane label="合同信息">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="合同编号">HT2024001</el-descriptions-item>
            <el-descriptions-item label="合同名称">软件开发服务合同</el-descriptions-item>
            <el-descriptions-item label="甲方">某某科技有限公司</el-descriptions-item>
            <el-descriptions-item label="乙方">合作伙伴公司</el-descriptions-item>
            <el-descriptions-item label="合同金额">¥100,000.00</el-descriptions-item>
            <el-descriptions-item label="签订日期">2024-01-01</el-descriptions-item>
            <el-descriptions-item label="生效日期">2024-01-01</el-descriptions-item>
            <el-descriptions-item label="合同期限">12个月</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="发票信息">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="发票号码">FP2024001</el-descriptions-item>
            <el-descriptions-item label="发票类型">增值税专用发票</el-descriptions-item>
            <el-descriptions-item label="开票日期">2024-01-01</el-descriptions-item>
            <el-descriptions-item label="发票金额">¥100,000.00</el-descriptions-item>
            <el-descriptions-item label="税率">6%</el-descriptions-item>
            <el-descriptions-item label="税额">¥5,660.38</el-descriptions-item>
            <el-descriptions-item label="价税合计">¥105,660.38</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="收据信息">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="收据编号">SJ2024001</el-descriptions-item>
            <el-descriptions-item label="收款单位">合作伙伴公司</el-descriptions-item>
            <el-descriptions-item label="收款金额">¥100,000.00</el-descriptions-item>
            <el-descriptions-item label="收款日期">2024-01-01</el-descriptions-item>
            <el-descriptions-item label="收款事由">软件开发服务费</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="原始图片">
          <div class="image-gallery">
            <el-image
              v-for="(image, index) in resultImages"
              :key="index"
              :src="image.url"
              :preview-src-list="resultImages.map(img => img.url)"
              fit="cover"
              style="width: 200px; height: 150px; margin: 10px;"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="result-card">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item timestamp="2024-01-01 10:00:00" type="primary">
          任务创建成功
        </el-timeline-item>
        <el-timeline-item timestamp="2024-01-01 10:01:00" type="warning">
          开始图片预处理
        </el-timeline-item>
        <el-timeline-item timestamp="2024-01-01 10:02:00" type="warning">
          图片分类完成，开始OCR识别
        </el-timeline-item>
        <el-timeline-item timestamp="2024-01-01 10:03:00" type="warning">
          合同信息识别完成
        </el-timeline-item>
        <el-timeline-item timestamp="2024-01-01 10:04:00" type="warning">
          发票信息识别完成
        </el-timeline-item>
        <el-timeline-item timestamp="2024-01-01 10:05:00" type="success">
          解析完成，所有信息识别成功
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ParseResult',
  data() {
    return {
      resultImages: [
        { url: 'https://picsum.photos/300/200?random=1' },
        { url: 'https://picsum.photos/300/200?random=2' },
        { url: 'https://picsum.photos/300/200?random=3' },
        { url: 'https://picsum.photos/300/200?random=4' }
      ]
    }
  },
  mounted() {
    // 这里可以从路由参数中获取任务ID，然后加载对应的解析结果
    const taskId = this.$route.query.taskId
    if (taskId) {
      this.loadResult(taskId)
    }
  },
  methods: {
    loadResult(taskId) {
      // 模拟加载解析结果数据
      console.log('Loading result for task:', taskId)
    }
  }
}
</script>

<style scoped>
.parse-result {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  color: #333;
  font-size: 24px;
  font-weight: 500;
}

.result-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  color: #303133;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}
</style>
