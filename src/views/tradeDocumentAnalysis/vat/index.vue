<template>
  <div
    class="vat-invoice-wrapper"
    style="flex-shrink: 1; flex-grow: 1; width: calc(100vw - 230px)"
  >
    <ocr-layout
      @resetId="handleResetId"
      @tabs="handleTabs"
      @changeActivePageIndex="handleChangeActivePageIndex"
      :data="documents"
      :staticData="newStaticData"
      @update:staticData="updateStaticData"
      v-model="page"
      ref="documentsRef"
    >
      <div class="search-box">
        <el-input
          placeholder="请输入字段名进行搜索"
          prefix-icon="el-icon-search"
          @input="fieldNameInput"
          v-model="fieldName"
        >
        </el-input>
        <el-checkbox v-model="checkedNull">隐藏空白字段</el-checkbox>
      </div>
      <el-tabs @tab-click="handleClick" v-model="activeName">
        <el-tab-pane
          v-for="(item, index) in tabsArray"
          :key="index"
          :label="item.name"
          :name="item.name"
        ></el-tab-pane>
      </el-tabs>
      <table cellspacing="0" class="table-data">
        <thead>
          <td colspan="2">字段名</td>
          <td>识别结果</td>
        </thead>
        <tr
          :class="{
            active: activeTextId === i.id && activeTableType === 'info',
            pointer: i.position,
          }"
          @click="(e) => clickHandler(e, i, 'info')"
          v-for="i in showPageData.content?.[0]?.info || []"
          :key="i.key"
        >
          <td colspan="2">{{ i.key }}</td>
          <td style="word-break: break-all;">{{ i.value }}</td>
        </tr>
        <template v-for="(item, index) in showPageData.content?.[0]?.commodity || []" :key="index">
          <tr>
            <td
              class="td-title"
              v-show="showPageData.content[0].commodity[index].length > 0"
              :rowspan="showPageData.content[0].commodity[index].length + 1"
            >
              货物或应税劳务、服务描述{{ index + 1 }}
            </td>
          </tr>
          <tr
            :class="{
              active:
                activeTextId === item.id && activeTableType === 'commodity',
              pointer: item.position,
            }"
            @click="(e) => clickHandler(e, item, 'commodity')"
            v-for="item in showPageData.content[0].commodity[index]"
            :key="item.key"
          >
            <td>{{ item.key }}</td>
            <td>{{ item.value }}</td>
          </tr>
        </template>
        <tr
          :class="{
            active: activeTextId === i.id && activeTableType === 'others',
            pointer: i.position,
          }"
          @click="(e) => clickHandler(e, i, 'others')"
          v-for="i in showPageData.content?.[0]?.others || []"
          :key="i.key"
        >
          <td colspan="2">{{ i.key }}</td>
          <td>{{ i.value }}</td>
        </tr>
      </table>
    </ocr-layout>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { cloneDeep } from 'lodash'
import ocrLayout from './ocr-layout.vue'
import { staticData } from '../staticData'

const props = defineProps({
  documentData: {
    type: Object,
    default: () => {}
  }
})
// Refs
const documentsRef = ref(null)

// Reactive state
const activePageIndex = ref(0)
const activeTextId = ref('')
const page = ref({})
const activeName = ref('')
const activeDocumentIndex = ref(0)
const tabsArray = ref([])
const newStaticData = ref(props.documentData.documents)
const documents = ref(props.documentData.documents[0].data)
const activeTableType = ref('')
const fieldName = ref('')
const checkedNull = ref(false)
const showPageData = ref({}) // 用作展示

// Computed
const originLocation = computed(() => {
  return process.env.NODE_ENV === 'development'
    ? 'https://beefeather-ng-front.lianyirong.com.cn//file-handle-web/file/image'
    : `${window.location.origin}/file-handle-web/file/image`
})

// Methods
const updateStaticData = (name) => {
  const data = newStaticData.value.find((item) => item.name === name).data
  console.log(data, "data")
  documents.value = data
}

const handleChangeActivePageIndex = (index) => {
  activePageIndex.value = index
}

const handleTabs = (activeDocIndex, activePageIdx) => {
  activePageIndex.value = 0
  activeDocumentIndex.value = activeDocIndex
  tabsArray.value = documents.value.map((item, index) => {
    return {
      name: `发票${index + 1}`
    }
  })
  fieldName.value = ''
  checkedNull.value = false
  activeName.value = tabsArray.value[activePageIdx].name
}

const handleClick = (tab) => {
  tabsArray.value.forEach((item, index) => {
    if (item.name === tab.paneName) {
      documentsRef.value?.handleClick(index)
    }
  })
  fieldName.value = ''
  checkedNull.value = false
}

const clickHandler = (e, i, type) => {
  if (i.value === '' || !i.position || i.position[0]?.length !== 4) {
    return
  }
  const el =
    e.target.nodeName === 'TR'
      ? e.target.firstChild
      : e.target.parentNode.firstChild
  activeTextId.value = i.id
  activeTableType.value = type
  e = e || window.event
  
  // 使用自定义事件系统
  if (documentsRef.value && window.$events) {
    window.$events.trigger('click-ocr-el', {
      el,
      value: i.position
    })
  }
}

const uploadFileData = (res) => {
  const data = res.data
  data.map((item) => {
    item.imagePath = `${originLocation.value}?filename=${encodeURIComponent(
      item.imagePath
    )}`
    return item
  })
  documents.value = data
  page.value = documents.value[0]
  showPageData.value = cloneDeep(page.value)
  tabsArray.value = documents.value.map((item, index) => {
    return {
      name: `发票${index + 1}`
    }
  })
  fieldName.value = ''
  checkedNull.value = false
  activeName.value = tabsArray.value[0].name
}

const fieldNameInput = () => {
  const fieldNameValue = fieldName.value.toLowerCase()
  activeTextId.value = ''
  
  if (documentsRef.value) {
    documentsRef.value.pathValue = null
    documentsRef.value.activeText = null
  }
  
  if (page.value.content && page.value.content[0]) {
    showPageData.value.content[0] = fuzzySearch(fieldNameValue, page.value.content[0])
  }
}

const fuzzySearch = (keyword, data) => {
  const lowerKeyword = keyword.toLowerCase()

  // 进行模糊搜索
  const results = {
    info: searchAndCheckEmpty(data.info, lowerKeyword),
    commodity: data.commodity.map((subArray) => {
      return searchAndCheckEmpty(subArray, lowerKeyword)
    }),
    others: searchAndCheckEmpty(data.others, lowerKeyword)
  }

  return results
}

// 辅助函数
const searchAndCheckEmpty = (categoryData, keyword) => {
  const results = categoryData.filter((item) => {
    const isKeyMatch = item.key.toLowerCase().includes(keyword)
    const isValueMatch = item.value.toLowerCase().includes(keyword)
    const isNullMatch = checkedNull.value && item.value === ''
    return (isKeyMatch || isValueMatch) && !isNullMatch
  })
  return results
}

const handleResetId = () => {
  activeTextId.value = null
}

// Watch
watch(checkedNull, () => {
  fieldNameInput()
})

watch(
  page,
  (val) => {
    showPageData.value = cloneDeep(val)
  },
  { deep: true, immediate: true }
)

// Lifecycle
onMounted(() => {
  page.value = documents.value[0]
  showPageData.value = cloneDeep(page.value)

  tabsArray.value = documents.value.map((item, index) => {
    return {
      name: `发票${index + 1}`
    }
  })
  activeName.value = tabsArray.value[0].name
})

// Expose methods for parent component (if needed)
defineExpose({
  uploadFileData,
  documentsRef
})
</script>

<style lang="scss" scoped>
.pre-line {
  white-space: pre-line;
}

.search-box {
  margin-top: 12px;
  display: flex;
  align-items: center;
  margin-bottom: 4px;

  :deep(.el-checkbox__label) {
    padding-left: 4px;
    color: #202D40;
  }

  :deep(.el-checkbox) {
    margin-left: 32px;
  }

  :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
    color: #202D40;
  }
}
</style>
