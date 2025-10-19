<template>
  <div class="right-select" :style="{ width: isshowRight ? '200px' : '60px' }">
    <div v-show="isshowRight">
      <div class="serInput">
        <el-input
          v-model.trim="productName"
          placeholder="请输入应用名称"
          @input="findProductName"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="product">
        <div
          v-for="(child, childIndex) in documentData"
          :key="childIndex"
          :class="{
            'product-list-name': true,
            activebg: child.name === activebgName,
          }"
          @click="productNameClick(child, childIndex)"
        >
          <div>{{ child.name }}</div>
        </div>
      </div>
      <div class="right-btn">
        <el-icon class="fold-icon" @click="showRight">
          <Fold />
        </el-icon>
      </div>
    </div>
    <div class="right-show" v-show="!isshowRight">
      <el-icon class="unfold-icon" @click="showRight">
        <Expand />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Fold, Expand } from '@element-plus/icons-vue'
// Emits
const emit = defineEmits(['productSelect'])
const props = defineProps({
  documentData: {
    type: Array,
    default: () => []
  }
})
// Reactive state
const productName = ref('')
const isshowRight = ref(true)
const activebgName = ref('增值税发票')
const productList = ref([
  {
    name: '增值税发票',
    staticName: 'vat'
  },
  {
    name: '订单',
    staticName: 'order'
  },
  {
    name: '跨境合同',
    staticName: 'cross_border_contract'
  }
])
const product = ref([])

// Methods
const productNameClick = (item, index) => {
  activebgName.value = item.name
  emit('productSelect', item)
}


const showChildren = (item) => {
  item.isShowChildren = !item.isShowChildren
}

const showRight = () => {
  isshowRight.value = !isshowRight.value
}

const findProductName = (val) => {
  if (val !== '') {
    productList.value = mapTree(val, product.value)
  } else {
    productList.value = product.value
  }
}

const mapTree = (value, arr) => {
  const newarr = []
  arr.forEach((element) => {
    // 不区分大小写
    if (element.name.toLowerCase().indexOf(value.toLowerCase()) > -1) {
      // 判断条件
      element.openStatus = true
      newarr.push(element)
    } else {
      if (element.children && element.children.length > 0) {
        const redata = mapTree(value, element.children)
        if (redata && redata.length > 0) {
          const obj = {
            ...element,
            children: redata
          }
          obj.openStatus = true
          newarr.push(obj)
        }
      }
    }
  })
  return newarr
}

// Lifecycle
onMounted(() => {
  // 初始化产品列表
  product.value = [
    {
      name: '增值税发票',
      staticName: 'vat'
    },
    {
      name: '订单',
      staticName: 'order'
    },
    {
      name: '跨境合同',
      staticName: 'cross_border_contract'
    }
  ]
})

// Expose methods for parent component (if needed)
defineExpose({
  showRight,
  productNameClick
})
</script>

<style lang="scss" scoped>
.right-select {
  margin-right: 6px;
  width: 200px;
  flex-shrink: 0;
  flex-grow: 0;

  .serInput {
    padding-bottom: 10px;

    :deep(.el-input__wrapper) {
      border-radius: 0px !important;
      border: none;
      border-bottom: 1px solid #BFE0FF;
      box-shadow: none;
    }

    :deep(.el-input__inner) {
      border-radius: 0px !important;
    }

    .el-icon {
      color: #009688;
    }
  }

  .product {
    overflow: auto;
    height: calc(100vh - 220px);
    font-size: 14px;

    .product-list-name {
      line-height: 30px;
      cursor: pointer;

      > div {
        padding-left: 28px;

        &:hover {
          background: #009688;
          color: #fff;
        }
      }
    }

    .activebg {
      background: #009688;
      color: #fff;
    }
  }

  .right-btn {
    height: 60px;
    border-top: 1px solid #D8E1FF;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 10px;

    .fold-icon {
      font-size: 20px;
      color: #8492A6;
      cursor: pointer;
      
      &:hover {
        color: #606266;
      }
    }
  }

  .right-show {
    position: absolute;
    left: 0px;
    bottom: 27px;
    background: #009688;
    padding: 6px 12px 6px 6px;
    border-radius: 0 16px 16px 0;
    cursor: pointer;
    transition: var(--transition-fast);

    &:hover {
      background: #00796b;
    }

    .unfold-icon {
      font-size: 20px;
      color: #FFF;
      cursor: pointer;
    }
  }
}
</style>
