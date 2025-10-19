<template>
  <div class="ocr-layout">
    <!-- ocr -->
    <div class="ocr-inner" style="width: 100%">
      <!-- 文档 -->
      <div class="document-box" ref="document-box">
        <div class="tool-bar">
          <div class="name">
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
              @click.native="handleTurnPage(-1)"
            ></svg-icon>
             <span class="number">
              <input
                class="dih-page-input"
                type="number"
                v-model.number="activePageIndex"
                v-on:change="inputChange($event)"
              /><span>/&nbsp;&nbsp;{{ total }}</span></span
            >
            <svg-icon
              v-if="activePageIndex === total"
              class="dis-icon"
              iconClass="右置灰"
            ></svg-icon>
            <svg-icon
              v-else
              class="big-icon"
              iconClass="ic-右"
              @click.native="handleTurnPage(1)"
            ></svg-icon>
          </div>
          <div>
            <svg-icon
              iconClass="ic-放大"
              @click.native="handleZoom(zoomStep)"
            ></svg-icon>
            <svg-icon
              iconClass="ic-缩小"
              @click.native="handleZoom(-zoomStep)"
            ></svg-icon>
            <svg-icon
              iconClass="ic-旋转"
              @click.native="handleClickRotate"
            ></svg-icon>
            <svg-icon
              iconClass="ic-恢复默认"
              @click.native="resetProps"
            ></svg-icon>
            <svg-icon
              iconClass="ic-全屏"
              @click.native="
                showImageViewer = true;
              "
            ></svg-icon>
          </div>
        </div>
        <div
          class="document-layout"
          ref="documentLayout"
          @mouseleave="
            (e) => {
              removeEventListener(e, 'drag-document');
            }
          "
          @mousewheel="handleZoom"
        >
          <div
            class="document"
            ref="drag-document"
            :key="page.id"
            :class="{ draggable: draggable, transition: transition }"
            @mousedown="
              (e) => {
                handleMousedown(e, 'drag-document');
              }
            "
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
              <template v-for="(item, index) in activeText">
                <template v-if="index === 0">
                  <circle
                    v-for="(i, idx) in item"
                    :key="`cir${index}${idx}`"
                    ref="pointEl"
                    :cx="i.x * imgScale"
                    :cy="i.y * imgScale"
                    r="0.5"
                    fill="none"
                    stroke="none"
                  />
                </template>
                <path
                  :key="index"
                  ref="maskEl"
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
        ref="drag-view"
        class="drag-view"
        @mousedown="
          (e) => {
            handleMousedown(e, 'drag-view');
          }
        "
      ></div>
      <!-- ocr识别结果 -->
      <div class="ocr-result" ref="ocrResult">
        <!-- <div
          v-for="i in 4"
          :key="i"
          class="border-corner"
          :class="[`border-corner-${i}`]"
        ></div>
        <div class="ocr-title-bar">
          <div class="ocr-title">
            <svg-icon iconClass="识别结果"></svg-icon>
            <span>识别结果</span>
          </div>
        </div>
        <div class="ocr-text" @scroll="proxy(calculateXy)" ref="ocrTextWrapper">
          <slot></slot>
        </div> -->
        <RightTab :codeTest="codeTest" ref="rightTab"> <slot></slot></RightTab>
      </div>
            <svgPath v-if="pathValue" :pathValue="pathValue" :documentWidth="documentWidth" :documentHeight="documentHeight"></svgPath>
      <el-collapse-transition>
        <upload-File @uploadFileData="$parent.uploadFileData"></upload-File>
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
<script>
import ResizeObserver from 'resize-observer-polyfill'
import ImageViewer from '@/components/imageViewer.vue'
export default {
  model: {
    prop: 'value',
    event: 'handle-change'
  },
  components: {
    [ImageViewer.name]: ImageViewer
  },
  props: {
    value: {
      type: Object,
      default: function () {
        return null
      }
    },
    data: {
      // 文档数组
      type: Array,
      required: true,
      default: () => []
    }
  },
  data() {
    return {
      documentWidth: null, // 画布的宽度
      documentHeight: null, // 画布的高度
      activeDocumentIndex: 0, // 当前示例索引
      activePageIndex: 1, // 当前页面索引
      activeText: null, // 高亮的文本
      pathValue: null, // 连线的起点、终点路径
      rotateIndex: 0, // 旋转次数
      zoomScale: 1, // 手动缩放比例
      zoomStep: 0.2, // 缩放梯度
      dragX: 0, // x方向拖动距离
      dragY: 0, // y方向拖动距离
      moveX: 0, // x方向平移距离
      moveY: 0, // y方向平移距离
      viewX: 0, // 视口偏移值
      initTranslateY: 0, // 初始位移数据
      draggable: false, // 是否抓住页面
      showImageViewer: false, // 是否启用大图预览
      transition: false, // 是否开启缓动效果
      realRenderHeight: 0,
      realRenderWidth: 0,
      imgRotatingDeg: 0,
      scale: 1,
      codeTest: ''
    }
  },
  mounted() {
    // 监听窗口变化 并读取文档的宽度
    this.resizeImg()
    // 兼容firefox
    this.bind(this.$refs.documentLayout, 'DOMMouseScroll', this.handleZoom)
    this.$events.listen('click-ocr-el', this.handleClickText)
    this.$events.listen('drag-document', this.transferDocument)
    this.$events.listen('drag-view', this.transferView)
  },
  watch: {
    data(val) {
      this.activeDocumentIndex = 0
      this.reRenderImage()
      this.resetProps()
      this.$refs.rightTab.activeName = 'first'
    }
  },
  beforeDestroy() {
    this.$events.remove('click-ocr-el', this.handleClickText)
    this.$events.remove('drag-document', this.transferDocument)
    this.$events.remove('drag-view', this.transferView)
    this.resizeObserver.disconnect()
  },
  methods: {
    multiMaskElPathValue(value) {
      if (!value || Object.keys(value).length === 0) {
        return
      }
      let d = ''
      value.forEach((i, index) => {
        d += `${index === 0 ? 'M' : 'L'}${i.x * this.imgScale} ${
          i.y * this.imgScale
        } `
        // d += `${i.x * this.imgScale} ${i.y * this.imgScale}, `
      })
      return d + 'Z'
    },
    inputChange() {
      // 输入页码
      if (this.activePageIndex > this.total) {
        this.activePageIndex = this.total
      }
      if (this.activePageIndex < 1) {
        this.activePageIndex = 1
      }
      const page = this.data[this.activePageIndex - 1]
      this.resizeImg()
      this.$emit('handle-change', page)
      this.$emit('tabs', this.activeDocumentIndex, this.activePageIndex - 1)
    },
    handleClick(index) {
      // 点击右侧tabs
      this.resetProps()
      this.activePageIndex = index + 1
      const page = this.data[index]
      this.resizeImg()
      this.$emit('handle-change', page)
    },
    resizeImg() {
      const el = this.$el
      this.resizeObserver = new ResizeObserver((_) => {
        this.proxy((_) => {
          this.documentWidth = this.$refs.documentLayout.clientWidth
          this.documentHeight = this.$refs.documentLayout.clientHeight
          // 初始化每张图片的宽高
          this.reRenderImage()
        })
      })
      this.resizeObserver.observe(el)
    },
    // 切换示例
    handleClickExample(index) {
      if (this.activeDocumentIndex === index) {
        return
      }
      this.activeDocumentIndex = index
      this.resetProps()

      const page = this.data[this.activePageIndex - 1]
      this.resizeImg()
      this.$emit('handle-change', page)
      this.$emit('tabs', this.activeDocumentIndex, this.activePageIndex - 1)
    },
    // 翻页
    handleTurnPage(val) {
      const num = this.activePageIndex - 1 + val
      this.resetProps()
      if (num === this.total) {
        if (this.activeDocumentIndex === this.data.length - 1) {
          this.activeDocumentIndex = 0
          this.activePageIndex = 1
        } else {
          this.activeDocumentIndex += 1
          this.activePageIndex = 1
        }
      } else if (num < 0) {
        if (this.activeDocumentIndex === 0) {
          this.activeDocumentIndex = this.data.length - 1
          this.activePageIndex =
            this.data[this.activeDocumentIndex].length
        } else {
          this.activeDocumentIndex -= 1
          this.activePageIndex =
            this.data[this.activeDocumentIndex].length
        }
      } else {
        this.activePageIndex = num + 1
      }

      const page = this.data[this.activePageIndex - 1]
      this.resizeImg()
      this.$emit('handle-change', page)
      this.$emit('tabs', this.activeDocumentIndex, this.activePageIndex - 1)
      this.$emit('changeActivePageIndex', this.activePageIndex - 1)
    },
    // 旋转图片
    handleClickRotate() {
      this.rotateIndex++
      this.moveX = this.dragX
      this.moveY = this.dragY
      if (this.rotateIndex % 4 === 1) {
        this.moveX = this.dragY
        this.moveY = -this.dragX
      }
      if (this.rotateIndex % 4 === 2) {
        this.moveX = -this.dragX
        this.moveY = -this.dragY
      }
      if (this.rotateIndex % 4 === 3) {
        this.moveX = -this.dragY
        this.moveY = this.dragX
      }
      this.updateTranslateY()
      this.$nextTick((_) => {
        this.calculateXy()
      })
    },
    // 缩放图片
    handleZoom(e) {
      this.initTranslateY = 0
      let scale = this.zoomScale
      let scrollDis
      if (typeof e === 'number') {
        scale += e
      } else {
        e = e || window.event
        if (!e) return
        scrollDis = Math.ceil(e.wheelDelta ? e.wheelDelta / 10 : -e.detail * 6)
        scale += scrollDis > 0 ? this.zoomStep : -this.zoomStep
      }
      if (scale < 0.3) {
        scale = 0.3
      }
      if (scale > 3) {
        scale = 3
      }
      this.zoomScale = scale
      this.calculateXy()
      e.preventDefault && e.preventDefault()
      return false
    },
    // 计算鼠标移动距离
    calculateDragDis(offset) {
      const disX = offset.offsetX - this.offsetX
      const disY = offset.offsetY - this.offsetY
      this.$events.trigger(offset.elName, { disX, disY })
      this.offsetX = offset.offsetX
      this.offsetY = offset.offsetY
    },
    // 移动文档图片
    transferDocument({ disX, disY }) {
      this.dragX += disX
      this.dragY += disY
      this.moveX = this.dragX
      this.moveY = this.dragY
      if (this.rotateIndex % 4 === 1) {
        this.moveX = this.dragY
        this.moveY = -this.dragX
      }
      if (this.rotateIndex % 4 === 2) {
        this.moveX = -this.dragX
        this.moveY = -this.dragY
      }
      if (this.rotateIndex % 4 === 3) {
        this.moveX = -this.dragY
        this.moveY = this.dragX
      }
      this.calculateXy()
    },
    // 移动两侧视口
    transferView({ disX, disY }) {
      this.viewX += disX
      const windowWidth = window.innerWidth
      if (this.viewX > windowWidth * 0.2) {
        this.viewX = windowWidth * 0.2
      }
      if (this.viewX < -windowWidth * 0.2) {
        this.viewX = -windowWidth * 0.2
      }
      this.$refs['document-box'].style.width = `calc(50% + ${this.viewX}px)`
      this.$refs.ocrResult.style.width = `calc(50% - ${this.viewX + 8}px)`
      this.$nextTick((_) => {
        this.documentWidth = this.$refs.documentLayout.clientWidth
        this.documentHeight = this.$refs.documentLayout.clientHeight
        this.reRenderImage()
        this.calculateXy()
      })
    },
    // 激活文本
    handleClickText({ el, value }) {
      this.activeEl = el
      this.activeText = value
      // this.calculateXy()
      this.$nextTick((_) => {
        const maskEl = this.$refs.maskEl[0]
        const documentLayout = this.$refs.documentLayout
        const maskElRect = maskEl.getBoundingClientRect()
        const documentLayoutRect = documentLayout.getBoundingClientRect()
        const lY = documentLayoutRect.top
        const lX = documentLayoutRect.left
        const mY = maskElRect.top
        const mX = maskElRect.left
        const startX = mX - lX
        const startY = mY - lY
        // 先判断是否出界 => 1、出界=>move  2、未出界=>计算位置
        if (
          startX <= 0 ||
          startY <= 0 ||
          startX >= this.documentWidth ||
          startY >= this.documentHeight
        ) {
          let disX = 0
          let disY = 0
          if (startX <= 0) {
            disX = -startX + this.documentWidth / 2
          }
          if (startY <= 0) {
            disY = -startY + this.documentHeight / 2
          }
          if (startX >= this.documentWidth) {
            disX = this.documentWidth / 2 - startX
          }
          if (startY >= this.documentHeight) {
            disY = this.documentHeight / 2 - startY
          }
          this.transferDocument({ disX, disY })
          this.transition = true
          let index = 0
          this.timer = window.setInterval((_) => {
            this.calculateXy()
            index++
            if (index === 10) {
              clearInterval(this.timer)
              this.transition = false
            }
          }, 30)
        } else {
          this.calculateXy()
        }
      })
    },
    // 计算path起点、终点坐标
    calculateXy() {
      if (this.activeText == null) {
        return
      }
      // const activeTextId = this.activeTextId
      const page = this.page
      const rotateIndex = this.rotateIndex
      const zoomScale = this.zoomScale || 1

      this.$nextTick((_) => {
        const maskEl = this.$refs.maskEl[0]
        const documentLayout = this.$refs.documentLayout
        const ocrTextWrapper = this.$refs.rightTab.$refs.ocrTextWrapper
        const maskElRect = maskEl.getBoundingClientRect()
        const documentLayoutRect = documentLayout.getBoundingClientRect()
        const lY = documentLayoutRect.top
        const lX = documentLayoutRect.left
        const mY = maskElRect.top
        const mX = maskElRect.right
        const startX = mX - lX
        const startY = mY - lY
        const offsetTop = this.activeEl.offsetTop + 96
        const offsetLeft = this.activeEl.offsetLeft
        const scrollTop = ocrTextWrapper.scrollTop
        const pathEndX = this.documentWidth + offsetLeft + 52
        const pathEndY = offsetTop - scrollTop + this.activeEl.clientHeight / 2
        const scale = page.rotateScale * zoomScale * this.imgScale
        const w = maskElRect.width
        const h = maskElRect.height
        const Q = maskElRect.deg || 0.0
        const leanX = (scale * w * Math.sin((2 * Math.PI * Q) / 360)) / 2

        let x = startX
        const y = startY + h / 2
        // if (rotateIndex % 4 === 1) {
        //   console.log(w)
        //   x = startX + leanX
        //   y = startY + (w * scale) / 2
        // }
        // if (rotateIndex % 4 === 2) {
        //   x = startX
        //   y = startY + (h * scale) / 2
        // }
        // if (rotateIndex % 4 === 3) {
        //   x = startX + leanX
        //   y = startY + (w * scale) / 2
        // }

        // 处理边界
        if (x > this.documentWidth) {
          x = this.documentWidths
        }

        this.pathValue = {
          pathStartX: x,
          pathStartY: y,
          pathEndX,
          pathEndY
        }
      })
    },
    // 还原
    resetProps() {
      this.rotateIndex = 0
      this.activePageIndex = 1
      this.activeText = null
      this.zoomScale = 1
      this.pathValue = null
      this.dragX = 0
      this.dragY = 0
      this.moveX = 0
      this.moveY = 0
      this.updateTranslateY()
      this.$emit('resetId')
    },
    // 设置初始y位移
    updateTranslateY() {
      this.$nextTick((_) => {
        if (this.rotateIndex % 4 === 0 && this.zoomScale === 1) {
          this.initTranslateY = Math.max(
            (this.realRenderHeight - this.documentHeight) / 2,
            0
          )
        } else {
          this.initTranslateY = 0
        }
      })
    },
    // 计算图片的的实际渲染大小
    reRenderImage() {
      const vm = this
      this.data.forEach((page, index) => {
        if (index === this.activePageIndex - 1) {
          const imgRotatingDeg = page.angle
          const widthScale = vm.documentWidth / page.width
          const heightScale = vm.documentHeight / page.height
          page.scale = widthScale < heightScale ? widthScale : heightScale
          page.realRenderWidth = page.width * page.scale // 图片实际渲染宽度
          page.realRenderHeight = page.height * page.scale // 图片实际渲染高度
          vm.realRenderHeight = page.realRenderHeight
          vm.realRenderWidth = page.realRenderWidth
          vm.imgRotatingDeg = imgRotatingDeg
          vm.scale = page.scale
        }
      })
      window.setTimeout((_) => {
        this.calculateXy()
      })
      this.updateTranslateY()
    },
    handleMousedown(e, elName) {
      const el = this.$refs[elName]
      this.removeEventListener(e, elName)
      e = e || window.event
      this.offsetX = e.pageX
      this.offsetY = e.pageY
      console.log(e, elName)
      window.addEventListener(
        'mousemove',
        (this[`${elName}Mousemove`] = (e) => {
          e = e || window.event
          this.proxy(this.calculateDragDis, {
            offsetX: e.pageX,
            offsetY: e.pageY,
            elName: elName
          })
          el.removeEventListener('mousedown', this.handleMousedown)
          this.draggable = true
        })
      )
      window.addEventListener(
        'mouseup',
        this.removeEventListener.bind(this, e, elName)
      )
    },
    removeEventListener(e, elName, w) {
      window.removeEventListener('mousemove', this[`${elName}Mousemove`])
      window.removeEventListener('mouseup', this.removeEventListener)
      this.draggable = false
    },
    fn(arr) {
      return arr.reduce((prev, cur) => {
        return prev.concat(Array.isArray(cur) ? this.fn(cur) : cur)
      }, [])
    },
    // 绑定事件函数
    bind(node, event, fun) {
      if (node.addEventListener) {
        node.removeEventListener(event, fun)
        node.addEventListener(event, fun, false)
      } else {
        node.detachEvent('on' + event, fun)
        node.attachEvent('on' + event, fun.call())
      }
    },
    parentProxy() {
      this.proxy(this.calculateXy)
    },
    // 代理函数
    proxy(fun, args) {
      if (this.proxying) return
      this.proxying = true
      window.requestAnimationFrame((_) => {
        fun.call(this, args)
        this.proxying = false
      })
    }
  },
  computed: {
    // 当前示例信息
    example() {
      return this.data[this.activeDocumentIndex]
    },
    // 总页数
    total() {
      return this.data.length
    },
    // 当前页面信息
    page() {
      const translateX = 0
      const translateY = 0
      const rotateScale = 1
      const page = {
        ...this.value,
        translateX,
        translateY,
        rotateScale // 旋转导致的缩放比例
      }
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.codeTest = JSON.stringify(page.json) || ''
      return page
    },
    // 文档图片地址
    imageUrl() {
      return this.page.imagePath
    },
    // 大图预览所需数据
    urlList() {
      return [{ url: this.page.imagePath, title: this.example.fileName }]
    },
    // 当前图片初始缩放比例
    imgScale() {
      return this.scale
    }
  }
}
</script>
<style lang="stylus">
@import '../ocr-layout.styl'
</style>
