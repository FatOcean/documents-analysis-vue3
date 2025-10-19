<template>
  <div class="ocr-layout">
    <!-- ocr -->
    <div class="ocr-inner" style="width: 100%">
      <!-- 文档 -->
      <div class="document-box" ref="documentBoxRef">
        <div class="tool-bar">
          <div class="name">
            <el-dropdown @command="handleClickGroupName">
              <span class="el-dropdown-link">
                {{ groupName }}
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    :command="item" 
                    v-for="item in groupNameList" 
                    :key="item"
                  >
                    {{ item }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-tooltip
              effect="dark"
              :content="example.fileName"
              placement="bottom-start"
            >
              <span>{{ example.fileName }}</span>
            </el-tooltip>
          </div>
          <div>
            <svg-icon
              v-if="activePageIndex === 1"
              class="dis-icon"
              iconClass="左置灰"
            ></svg-icon>
            <svg-icon
              v-else
              class="big-icon"
              iconClass="ic-左"
              @click="handleTurnPage(-1)"
            ></svg-icon>
            <span class="number">
              <input
                class="dih-page-input"
                type="number"
                v-model.number="activePageIndex"
                @change="inputChange"
              /><span>/&nbsp;&nbsp;{{ total }}</span>
            </span>
            <svg-icon
              v-if="activePageIndex === total"
              class="dis-icon"
              iconClass="右置灰"
            ></svg-icon>
            <svg-icon
              v-else
              class="big-icon"
              iconClass="ic-右"
              @click="handleTurnPage(1)"
            ></svg-icon>
          </div>
          <div>
            <svg-icon
              iconClass="ic-放大"
              @click="handleZoom(zoomStep)"
            ></svg-icon>
            <svg-icon
              iconClass="ic-缩小"
              @click="handleZoom(-zoomStep)"
            ></svg-icon>
            <svg-icon
              iconClass="ic-旋转"
              @click="handleClickRotate"
            ></svg-icon>
            <svg-icon
              iconClass="ic-恢复默认"
              @click="resetProps"
            ></svg-icon>
            <svg-icon
              iconClass="ic-全屏"
              @click="showImageViewer = true"
            ></svg-icon>
          </div>
        </div>
        <div
          class="document-layout"
          ref="documentLayoutRef"
          @mouseleave="(e) => removeEventListener(e, 'drag-document')"
          @mousewheel="handleZoom"
        >
          <div
            class="document"
            ref="dragDocumentRef"
            :key="page.id"
            :class="{ draggable: draggable, transition: transition }"
            @mousedown="(e) => handleMousedown(e, 'drag-document')"
            :style="{
              height: `${realRenderHeight}px`,
              width: `${realRenderWidth}px`,
              transform: `rotate(${90 * rotateIndex}deg) translateY(${
                page.translateY + moveY
              }px) translateX(${page.translateX + moveX}px) scale(${
                page.rotateScale * zoomScale
              })`,
            }"
          >
            <img :src="imageUrl" :alt="example.fileName" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              class="frame-mask-svg"
              :width="realRenderWidth"
              :height="realRenderHeight"
              :style="{
                transform: `rotate(${imgRotatingDeg || 0}deg)`,
              }"
            >
              <template v-for="(item, index) in activeText" :key="`path${index}`">
                <template v-if="index === 0">
                  <circle
                    v-for="(i, idx) in item"
                    :key="`cir${index}${idx}`"
                    ref="pointElRef"
                    :cx="i.x * imgScale"
                    :cy="i.y * imgScale"
                    r="0.5"
                    fill="none"
                    stroke="none"
                  />
                </template>
                <path
                  ref="maskElRef"
                  stroke-width="0.5"
                  stroke="#009688"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  fill="rgba(8, 135, 255, 0.1)"
                  :d="multiMaskElPathValue(item)"
                />
              </template>
            </svg>
          </div>
        </div>
      </div>
      <!-- 拖动更改两侧视口大小 -->
      <div
        ref="dragViewRef"
        class="drag-view"
        @mousedown="(e) => handleMousedown(e, 'drag-view')"
      ></div>
      <!-- ocr识别结果 -->
      <div class="ocr-result" ref="ocrResultRef">
        <RightTab :codeTest="codeTest" ref="rightTabRef">
          <slot></slot>
        </RightTab>
      </div>
      <svgPath 
        v-if="pathValue" 
        :pathValue="pathValue" 
        :documentWidth="documentWidth" 
        :documentHeight="documentHeight"
      ></svgPath>
      <el-collapse-transition>
        <upload-File @uploadFileData="emit('uploadFileData', $event)"></upload-File>
      </el-collapse-transition>
    </div>
    <!-- 大图预览 -->
    <showImg
      v-if="showImageViewer"
      :urlList="urlList"
      @close="showImageViewer = false"
    ></showImg>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ResizeObserver from 'resize-observer-polyfill'
import ImageViewer from '@/components/imageViewer.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => null
  },
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  staticData: {
    type: Array,
    required: true,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'handle-change', 'tabs', 'changeActivePageIndex', 'resetId', 'uploadFileData'])

// Refs
const documentBoxRef = ref(null)
const documentLayoutRef = ref(null)
const dragDocumentRef = ref(null)
const dragViewRef = ref(null)
const ocrResultRef = ref(null)
const rightTabRef = ref(null)
const maskElRef = ref([])
const pointElRef = ref([])

// Reactive state
const documentWidth = ref(null)
const documentHeight = ref(null)
const activeDocumentIndex = ref(0)
const activePageIndex = ref(1)
const activeText = ref(null)
const pathValue = ref(null)
const rotateIndex = ref(0)
const zoomScale = ref(1)
const zoomStep = ref(0.2)
const dragX = ref(0)
const dragY = ref(0)
const moveX = ref(0)
const moveY = ref(0)
const viewX = ref(0)
const initTranslateY = ref(0)
const draggable = ref(false)
const showImageViewer = ref(false)
const transition = ref(false)
const realRenderHeight = ref(0)
const realRenderWidth = ref(0)
const imgRotatingDeg = ref(0)
const scale = ref(1)
const codeTest = ref('')
const groupName = ref('')
const groupNameList = ref([])

// Internal state
const offsetX = ref(0)
const offsetY = ref(0)
const activeEl = ref(null)
let resizeObserver = null
let timer = null
let proxying = false
const eventHandlers = {}

// Computed
const example = computed(() => {
  return props.data[activeDocumentIndex.value] || {}
})

const total = computed(() => {
  return props.data.length
})

const page = computed(() => {
  const translateX = 0
  const translateY = 0
  const rotateScale = 1
  const pageData = {
    ...props.modelValue,
    translateX,
    translateY,
    rotateScale
  }
  codeTest.value = JSON.stringify(pageData.json) || ''
  return pageData
})

const imageUrl = computed(() => {
  return page.value.imagePath
})

const urlList = computed(() => {
  return [{ url: page.value.imagePath, title: example.value.fileName }]
})

const imgScale = computed(() => {
  return scale.value
})

// Methods
const handleClickGroupName = (item) => {
  groupName.value = item
  emit('update:staticData', item)
}

const multiMaskElPathValue = (value) => {
  if (!value || Object.keys(value).length === 0) {
    return
  }
  let d = ''
  value.forEach((i, index) => {
    d += `${index === 0 ? 'M' : 'L'}${i.x * imgScale.value} ${i.y * imgScale.value} `
  })
  return d + 'Z'
}

const inputChange = () => {
  if (activePageIndex.value > total.value) {
    activePageIndex.value = total.value
  }
  if (activePageIndex.value < 1) {
    activePageIndex.value = 1
  }
  const pageData = props.data[activePageIndex.value - 1]
  resizeImg()
  emit('update:modelValue', pageData)
  emit('tabs', activeDocumentIndex.value, activePageIndex.value - 1)
}

const handleClick = (index) => {
  resetProps()
  activePageIndex.value = index + 1
  const pageData = props.data[index]
  resizeImg()
  emit('update:modelValue', pageData)
}

const resizeImg = () => {
  const el = documentLayoutRef.value?.parentElement
  if (!el) return
  
  resizeObserver = new ResizeObserver(() => {
    proxy(() => {
      if (documentLayoutRef.value) {
        documentWidth.value = documentLayoutRef.value.clientWidth
        documentHeight.value = documentLayoutRef.value.clientHeight
        reRenderImage()
      }
    })
  })
  resizeObserver.observe(el)
}

const handleClickExample = (index) => {
  if (activeDocumentIndex.value === index) {
    return
  }
  activeDocumentIndex.value = index
  resetProps()

  const pageData = props.data[activePageIndex.value - 1]
  resizeImg()
  emit('update:modelValue', pageData)
  emit('tabs', activeDocumentIndex.value, activePageIndex.value - 1)
}

const handleTurnPage = (val) => {
  const num = activePageIndex.value - 1 + val
  resetProps()
  if (num === total.value) {
    if (activeDocumentIndex.value === props.data.length - 1) {
      activeDocumentIndex.value = 0
      activePageIndex.value = 1
    } else {
      activeDocumentIndex.value += 1
      activePageIndex.value = 1
    }
  } else if (num < 0) {
    if (activeDocumentIndex.value === 0) {
      activeDocumentIndex.value = props.data.length - 1
      activePageIndex.value = props.data[activeDocumentIndex.value].length
    } else {
      activeDocumentIndex.value -= 1
      activePageIndex.value = props.data[activeDocumentIndex.value].length
    }
  } else {
    activePageIndex.value = num + 1
  }

  const pageData = props.data[activePageIndex.value - 1]
  resizeImg()
  emit('update:modelValue', pageData)
  emit('tabs', activeDocumentIndex.value, activePageIndex.value - 1)
  emit('changeActivePageIndex', activePageIndex.value - 1)
}

const handleClickRotate = () => {
  rotateIndex.value++
  moveX.value = dragX.value
  moveY.value = dragY.value
  if (rotateIndex.value % 4 === 1) {
    moveX.value = dragY.value
    moveY.value = -dragX.value
  }
  if (rotateIndex.value % 4 === 2) {
    moveX.value = -dragX.value
    moveY.value = -dragY.value
  }
  if (rotateIndex.value % 4 === 3) {
    moveX.value = -dragY.value
    moveY.value = dragX.value
  }
  updateTranslateY()
  nextTick(() => {
    calculateXy()
  })
}

const handleZoom = (e) => {
  initTranslateY.value = 0
  let scaleValue = zoomScale.value
  let scrollDis
  if (typeof e === 'number') {
    scaleValue += e
  } else {
    e = e || window.event
    if (!e) return
    scrollDis = Math.ceil(e.wheelDelta ? e.wheelDelta / 10 : -e.detail * 6)
    scaleValue += scrollDis > 0 ? zoomStep.value : -zoomStep.value
  }
  if (scaleValue < 0.3) {
    scaleValue = 0.3
  }
  if (scaleValue > 3) {
    scaleValue = 3
  }
  zoomScale.value = scaleValue
  calculateXy()
  e.preventDefault && e.preventDefault()
  return false
}

const calculateDragDis = (offset) => {
  const disX = offset.offsetX - offsetX.value
  const disY = offset.offsetY - offsetY.value
  
  // Trigger custom event
  if (eventHandlers[offset.elName]) {
    eventHandlers[offset.elName]({ disX, disY })
  }
  
  offsetX.value = offset.offsetX
  offsetY.value = offset.offsetY
}

const transferDocument = ({ disX, disY }) => {
  dragX.value += disX
  dragY.value += disY
  moveX.value = dragX.value
  moveY.value = dragY.value
  if (rotateIndex.value % 4 === 1) {
    moveX.value = dragY.value
    moveY.value = -dragX.value
  }
  if (rotateIndex.value % 4 === 2) {
    moveX.value = -dragX.value
    moveY.value = -dragY.value
  }
  if (rotateIndex.value % 4 === 3) {
    moveX.value = -dragY.value
    moveY.value = dragX.value
  }
  calculateXy()
}

const transferView = ({ disX, disY }) => {
  viewX.value += disX
  const windowWidth = window.innerWidth
  if (viewX.value > windowWidth * 0.2) {
    viewX.value = windowWidth * 0.2
  }
  if (viewX.value < -windowWidth * 0.2) {
    viewX.value = -windowWidth * 0.2
  }
  if (documentBoxRef.value) {
    documentBoxRef.value.style.width = `calc(50% + ${viewX.value}px)`
  }
  if (ocrResultRef.value) {
    ocrResultRef.value.style.width = `calc(50% - ${viewX.value + 8}px)`
  }
  nextTick(() => {
    if (documentLayoutRef.value) {
      documentWidth.value = documentLayoutRef.value.clientWidth
      documentHeight.value = documentLayoutRef.value.clientHeight
      reRenderImage()
      calculateXy()
    }
  })
}

const handleClickText = ({ el, value }) => {
  activeEl.value = el
  activeText.value = value
  
  nextTick(() => {
    if (!maskElRef.value[0] || !documentLayoutRef.value || !rightTabRef.value?.$refs.ocrTextWrapper) {
      return
    }
    
    const maskEl = maskElRef.value[0]
    const documentLayout = documentLayoutRef.value
    const ocrTextWrapper = rightTabRef.value.$refs.ocrTextWrapper
    const maskElRect = maskEl.getBoundingClientRect()
    const documentLayoutRect = documentLayout.getBoundingClientRect()
    const lY = documentLayoutRect.top
    const lX = documentLayoutRect.left
    const mY = maskElRect.top
    const mX = maskElRect.left
    const startX = mX - lX
    const startY = mY - lY
    
    if (
      startX <= 0 ||
      startY <= 0 ||
      startX >= documentWidth.value ||
      startY >= documentHeight.value
    ) {
      let disX = 0
      let disY = 0
      if (startX <= 0) {
        disX = -startX + documentWidth.value / 2
      }
      if (startY <= 0) {
        disY = -startY + documentHeight.value / 2
      }
      if (startX >= documentWidth.value) {
        disX = documentWidth.value / 2 - startX
      }
      if (startY >= documentHeight.value) {
        disY = documentHeight.value / 2 - startY
      }
      transferDocument({ disX, disY })
      transition.value = true
      let index = 0
      timer = window.setInterval(() => {
        calculateXy()
        index++
        if (index === 10) {
          clearInterval(timer)
          transition.value = false
        }
      }, 30)
    } else {
      calculateXy()
    }
  })
}

const calculateXy = () => {
  if (activeText.value == null) {
    return
  }
  
  const pageData = page.value
  const rotateIndexValue = rotateIndex.value
  const zoomScaleValue = zoomScale.value || 1

  nextTick(() => {
    if (!maskElRef.value[0] || !documentLayoutRef.value || !rightTabRef.value?.$refs.ocrTextWrapper) {
      return
    }
    
    const maskEl = maskElRef.value[0]
    const documentLayout = documentLayoutRef.value
    const ocrTextWrapper = rightTabRef.value.$refs.ocrTextWrapper
    const maskElRect = maskEl.getBoundingClientRect()
    const documentLayoutRect = documentLayout.getBoundingClientRect()
    const lY = documentLayoutRect.top
    const lX = documentLayoutRect.left
    const mY = maskElRect.top
    const mX = maskElRect.right
    const startX = mX - lX
    const startY = mY - lY
    const offsetTop = activeEl.value.offsetTop + 96
    const offsetLeft = activeEl.value.offsetLeft
    const scrollTop = ocrTextWrapper.scrollTop
    const pathEndX = documentWidth.value + offsetLeft + 52
    const pathEndY = offsetTop - scrollTop + activeEl.value.clientHeight / 2
    const scaleValue = pageData.rotateScale * zoomScaleValue * imgScale.value
    const w = maskElRect.width
    const h = maskElRect.height
    const Q = maskElRect.deg || 0.0
    const leanX = (scaleValue * w * Math.sin((2 * Math.PI * Q) / 360)) / 2

    let x = startX
    const y = startY + h / 2

    if (x > documentWidth.value) {
      x = documentWidth.value
    }

    pathValue.value = {
      pathStartX: x,
      pathStartY: y,
      pathEndX,
      pathEndY
    }
  })
}

const resetProps = () => {
  rotateIndex.value = 0
  activePageIndex.value = 1
  activeText.value = null
  zoomScale.value = 1
  pathValue.value = null
  dragX.value = 0
  dragY.value = 0
  moveX.value = 0
  moveY.value = 0
  updateTranslateY()
  emit('resetId')
}

const updateTranslateY = () => {
  nextTick(() => {
    if (rotateIndex.value % 4 === 0 && zoomScale.value === 1) {
      initTranslateY.value = Math.max(
        (realRenderHeight.value - documentHeight.value) / 2,
        0
      )
    } else {
      initTranslateY.value = 0
    }
  })
}

const reRenderImage = () => {
  props.data.forEach((pageData, index) => {
    if (index === activePageIndex.value - 1) {
      const imgRotatingDegValue = pageData.angle
      const widthScale = documentWidth.value / pageData.width
      const heightScale = documentHeight.value / pageData.height
      pageData.scale = widthScale < heightScale ? widthScale : heightScale
      pageData.realRenderWidth = pageData.width * pageData.scale
      pageData.realRenderHeight = pageData.height * pageData.scale
      realRenderHeight.value = pageData.realRenderHeight
      realRenderWidth.value = pageData.realRenderWidth
      imgRotatingDeg.value = imgRotatingDegValue
      scale.value = pageData.scale
    }
  })
  window.setTimeout(() => {
    calculateXy()
  })
  updateTranslateY()
}

const handleMousedown = (e, elName) => {
  const el = elName === 'drag-document' ? dragDocumentRef.value : dragViewRef.value
  removeEventListenerFunc(e, elName)
  e = e || window.event
  offsetX.value = e.pageX
  offsetY.value = e.pageY

  const mousemoveHandler = (e) => {
    e = e || window.event
    proxy(calculateDragDis, {
      offsetX: e.pageX,
      offsetY: e.pageY,
      elName: elName
    })
    draggable.value = true
  }

  eventHandlers[`${elName}Mousemove`] = mousemoveHandler
  window.addEventListener('mousemove', mousemoveHandler)
  window.addEventListener('mouseup', () => removeEventListenerFunc(e, elName))
}

const removeEventListenerFunc = (e, elName) => {
  const handler = eventHandlers[`${elName}Mousemove`]
  if (handler) {
    window.removeEventListener('mousemove', handler)
    delete eventHandlers[`${elName}Mousemove`]
  }
  window.removeEventListener('mouseup', removeEventListenerFunc)
  draggable.value = false
}

const bind = (node, event, fun) => {
  if (node.addEventListener) {
    node.removeEventListener(event, fun)
    node.addEventListener(event, fun, false)
  } else {
    node.detachEvent('on' + event, fun)
    node.attachEvent('on' + event, fun.call())
  }
}

const parentProxy = () => {
  proxy(calculateXy)
}

const proxy = (fun, args) => {
  if (proxying) return
  proxying = true
  window.requestAnimationFrame(() => {
    fun.call(null, args)
    proxying = false
  })
}

// Setup event handlers
eventHandlers['drag-document'] = transferDocument
eventHandlers['drag-view'] = transferView

// Watch
watch(() => props.data, (val) => {
  activeDocumentIndex.value = 0
  reRenderImage()
  resetProps()
  if (rightTabRef.value) {
    rightTabRef.value.activeName = 'first'
  }
})

watch(() => props.staticData, (val) => {
  groupNameList.value = val.map((item) => item.name)
  groupName.value = groupNameList.value[0]
}, { immediate: true })

// Lifecycle
onMounted(() => {
  resizeImg()
  if (documentLayoutRef.value) {
    bind(documentLayoutRef.value, 'DOMMouseScroll', handleZoom)
  }
  
  // 使用自定义事件系统
  if (window.$events) {
    window.$events.listen('click-ocr-el', handleClickText)
    window.$events.listen('drag-document', transferDocument)
    window.$events.listen('drag-view', transferView)
  }
})

onBeforeUnmount(() => {
  if (window.$events) {
    window.$events.remove('click-ocr-el', handleClickText)
    window.$events.remove('drag-document', transferDocument)
    window.$events.remove('drag-view', transferView)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (timer) {
    clearInterval(timer)
  }
})

// Expose methods for parent component
defineExpose({
  handleClick,
  parentProxy,
  resetProps
})
</script>

<style lang="scss">
@import '../ocr-layout.scss'
</style>
