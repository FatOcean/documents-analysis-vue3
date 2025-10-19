<template>
  <div class="ocr-layout">
    <!-- ocr -->
    <div class="ocr-inner">
      <!-- 文档 -->
      <div class="document-box" ref="document-box">
        <div class="tool-bar">
          <div class="name">
            <el-tooltip
              effect="dark"
              :content="imageName"
              placement="bottom-start"
            >
              <span>{{ imageName }}</span>
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
              @click.native="showImageViewer = true"
            ></svg-icon>
          </div>
        </div>
        <div
          class="document-layout"
          ref="documentLayout"
          @mousewheel="handleZoom"
          @mouseleave="
            (e) => {
              removeEventListener(e, 'drag-document');
            }
          "
        >
          <div
            class="document"
            ref="drag-document"
            :key="example.id"
            :class="{ draggable: draggable, transition: transition }"
            @mousedown="
              (e) => {
                handleMousedown(e, 'drag-document');
              }
            "
            :style="{
              // backgroundImage: `url(${imageUrl})`,
              height: `${realRenderHeight}px`,
              width: `${realRenderWidth}px`,
              transform: `rotate(${90 * rotateIndex}deg) translateY(${
                page.translateY + moveY + initTranslateY
              }px) translateX(${page.translateX + moveX}px) scale(${
                page.rotateScale * zoomScale
              })`,
              transformOrigin: page.transformOrigin,
            }"
          >
            <img
              :style="{
                transform: `rotate(${example.imgRotatingDeg || 0}deg)`,
              }"
              :src="imageUrl"
              :alt="imageName"
            />
            <svg
              class="svg-seal"
              :height="realRenderHeight"
              :width="realRenderWidth"
            >
              <polygon
                ref="svg-rectangle"
                :points="rectanglePosition"
                style="
                  fill: rgba(8, 135, 255, 0.1);
                  stroke: #009688;
                  stroke-width: 2;
                "
              />
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
        <RightTab :codeTest="codeTest" ref="rightTab"><slot></slot> </RightTab>
      </div>
      <svgPath
        v-if="pathValue"
        :pathValue="pathValue"
        :documentWidth="documentWidth"
        :documentHeight="documentHeight"
      ></svgPath>
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
import ResizeObserver from "resize-observer-polyfill";
export default {
  model: {
    prop: "value",
    event: "handle-change",
  },
  props: {
    value: {
      type: Array,
      default: function () {
        return null;
      },
    },
    data: {
      // 文档数组
      type: Array,
      required: true,
      default: () => [],
    },
    activeTabIndex: {
      type: Number,
    },
  },
  data() {
    return {
      codeTest: "",
      rectanglePosition: "",
      documentWidth: null, // 画布的宽度
      documentHeight: null, // 画布的高度
      activeDocumentIndex: 0, // 当前示例索引
      activePageIndex: 1, // 当前页面索引
      activeTextId: null, // 高亮的文本索引
      pathValue: null, // 连线的起点、终点路径
      rotateIndex: 0, // 旋转次数
      zoomScale: 1, // 手动缩放比例
      zoomStep: 0.1, // 缩放梯度
      // windowResizeScale: 1, // 浏览器窗口缩放比例
      dragX: 0, // x方向拖动距离
      dragY: 0, // y方向拖动距离
      moveX: 0, // x方向平移距离
      moveY: 0, // y方向平移距离
      viewX: 0, // 视口偏移值
      initTranslateY: 0, // 初始位移数据
      draggable: false, // 是否抓住页面
      showImageViewer: false, // 是否启用大图预览
      realRenderHeight: 0,
      realRenderWidth: 0,
      scale: 1,
      transition: false,
      text: "",
    };
  },
  created() {},
  mounted() {
    // 监听窗口变化 并读取文档的宽度
    this.resizeImg();

    // 兼容firefox
    this.bind(this.$refs.documentLayout, "DOMMouseScroll", this.handleZoom);

    this.$events.listen("click-ocr-el", this.handleClickText);
    this.$events.listen("drag-document", this.transferDocument);
    this.$events.listen("drag-view", this.transferView);
  },
  watch: {
    data(val) {
      this.activeDocumentIndex = 0;
      this.reRenderImage();
      this.resetProps();
      this.$refs.rightTab.activeName = "first";
    },
  },
  beforeDestroy() {
    this.$events.remove("click-ocr-el", this.clickOcrEl);
    this.$events.remove("drag-document", this.transferDocument);
    this.$events.remove("drag-view", this.transferView);
    this.resizeObserver.disconnect();
  },
  methods: {
    setRectangle(index = 0) {
      const rectangle = this?.text?.values[0].position[0];
      if (rectangle) {
        this.rectanglePosition = rectangle.reduce((total, cur) => {
          const str = (total +=
            `${cur.x * this.scale},${cur.y * this.scale}` + " ");
          return str;
        }, "");
      }
    },
    inputChange() {
      // 输入页码
      if (this.activePageIndex > this.total) {
        this.activePageIndex = this.total;
      }
      if (this.activePageIndex < 1) {
        this.activePageIndex = 1;
      }
      this.$parent.handleClick(this.activePageIndex);
      this.activeDocumentIndex = this.activePageIndex - 1;
      this.rectanglePosition = "";
      this.text = "";
      this.activeTextId = "";
      this.pathValue = null;
      this.resizeImg();
    },
    handleClick(index) {
      this.rotateIndex = 0;
      this.activeTextId = null;
      this.zoomScale = 1;
      this.pathValue = null;
      this.dragX = 0;
      this.dragY = 0;
      this.moveX = 0;
      this.moveY = 0;
      this.updateTranslateY();
      this.$emit("resetId");
      this.resizeImg();
    },
    resizeImg() {
      const el = this.$el;
      this.resizeObserver = new ResizeObserver((_) => {
        this.proxy((_) => {
          this.documentWidth = this.$refs.documentLayout.clientWidth;
          this.documentHeight = this.$refs.documentLayout.clientHeight;
          // console.log(this.documentWidth, this.documentHeight);
          // 初始化每张图片的宽高
          this.reRenderImage();
        });
      });
      this.resizeObserver.observe(el);
    },
    // 计算图片的的实际渲染大小
    reRenderImage() {
      this.example.images.forEach((page, index) => {
        const vm = this;
        if (index === this.activePageIndex - 1) {
          page.scale =
            page.originalHeight > page.width
              ? vm.documentHeight / +page.height
              : vm.documentWidth / +page.width; // 初始图片缩放比例

          page.realRenderHeight = +page.height * page.scale; // 图片实际渲染高度
          if (page.realRenderHeight > vm.documentHeight) {
            page.realRenderHeight = vm.documentHeight;
            page.scale = vm.documentHeight / +page.height;
          }
          page.realRenderWidth = +page.width * page.scale; // 图片实际渲染宽度
          vm.realRenderHeight = page.realRenderHeight;
          vm.realRenderWidth = page.realRenderWidth;
          vm.scale = page.scale;
          // page.initTranslateY = (page.realRenderHeight - vm.documentHeight) / 2; // 图片实际渲染高度
          // };
        }
      });
      // console.log("render")
      window.setTimeout((_) => {
        this.calculateXy();
      });
      this.updateTranslateY();
    },
    // 翻页
    handleTurnPage(val) {
      this.activePageIndex = this.activePageIndex + val;
      this.$parent.handleClick(this.activePageIndex);
      // if (num === this.total) {
      //   if (this.activeTabIndex < this.data.length - 1) {
      //     this.$parent.handleClick(1)
      //   } else {
      //     this.$parent.handleClick(0)
      //   }
      // } else if (num < 0) {
      //   if (this.activeTabIndex === 0) {
      //     this.$parent.handleClick(this.data.length - 1)
      //   } else {
      //     this.$parent.handleClick(-1)
      //   }
      // } else {
      //   this.activePageIndex = num + 1
      // }
      this.activeDocumentIndex = this.activePageIndex - 1;
      this.rectanglePosition = "";
      this.text = "";
      this.pathValue = null;
      this.activeTextId = "";
      this.resizeImg();
    },
    // 旋转图片
    handleClickRotate() {
      this.rotateIndex++;
      this.moveX = this.dragX;
      this.moveY = this.dragY;
      if (this.rotateIndex % 4 === 1) {
        this.moveX = this.dragY;
        this.moveY = -this.dragX;
      }
      if (this.rotateIndex % 4 === 2) {
        this.moveX = -this.dragX;
        this.moveY = -this.dragY;
      }
      if (this.rotateIndex % 4 === 3) {
        this.moveX = -this.dragY;
        this.moveY = this.dragX;
      }
      this.updateTranslateY();
      this.$nextTick((_) => {
        this.calculateXy();
      });
    },
    // 缩放图片
    handleZoom(e) {
      this.initTranslateY = 0;
      let scale = this.zoomScale;
      let scrollDis;
      if (typeof e === "number") {
        scale += e;
      } else {
        e = e || window.event;
        if (!e) return;
        scrollDis = Math.ceil(e.wheelDelta ? e.wheelDelta / 10 : -e.detail * 6);
        scale += scrollDis > 0 ? this.zoomStep : -this.zoomStep;
      }
      if (scale < 0.3) {
        scale = 0.3;
      }
      if (scale > 3) {
        scale = 3;
      }
      this.zoomScale = scale;
      this.calculateXy();
      e.preventDefault && e.preventDefault();
      return false;
    },
    // 计算鼠标移动距离
    calculateDragDis(offset) {
      const disX = offset.offsetX - this.offsetX;
      const disY = offset.offsetY - this.offsetY;
      this.$events.trigger(offset.elName, { disX, disY });
      this.offsetX = offset.offsetX;
      this.offsetY = offset.offsetY;
    },
    // 移动文档图片
    transferDocument({ disX, disY }) {
      this.dragX += disX;
      this.dragY += disY;
      this.moveX = this.dragX;
      this.moveY = this.dragY;
      if (this.rotateIndex % 4 === 1) {
        this.moveX = this.dragY;
        this.moveY = -this.dragX;
      }
      if (this.rotateIndex % 4 === 2) {
        this.moveX = -this.dragX;
        this.moveY = -this.dragY;
      }
      if (this.rotateIndex % 4 === 3) {
        this.moveX = -this.dragY;
        this.moveY = this.dragX;
      }
      this.calculateXy();
    },
    // 移动两侧视口
    transferView({ disX, disY }) {
      this.viewX += disX;
      const windowWidth = window.innerWidth;
      if (this.viewX > windowWidth * 0.12) {
        this.viewX = windowWidth * 0.12;
      }
      if (this.viewX < -windowWidth * 0.12) {
        this.viewX = -windowWidth * 0.12;
      }
      this.$refs.ocrResult.style.width = `calc(50% - ${this.viewX + 8}px)`;
      this.$refs["document-box"].style.width = `calc(50% + ${this.viewX}px)`;
      this.$nextTick((_) => {
        this.documentWidth = this.$refs.documentLayout.clientWidth;
        this.documentHeight = this.$refs.documentLayout.clientHeight;
        this.reRenderImage();
        this.calculateXy();
      });
    },
    // 激活文本
    handleClickText({ el, id, text, imageIndex }) {
      if (imageIndex + 1 !== this.activePageIndex) {
        this.activePageIndex = imageIndex + 1;
      }

      this.text = text;
      // console.log(el, "el2");
      // if (imageIndex !== this.activePageIndex) {
      //   this.activePageIndex = imageIndex
      // }
      this.activeEl = el;
      this.activeTextId = id;
      this.setRectangle();
      this.$nextTick((_) => {
        const maskEl = this.$refs["svg-rectangle"];
        const documentLayout = this.$refs.documentLayout;
        const maskElRect = maskEl.getBoundingClientRect();
        const documentLayoutRect = documentLayout.getBoundingClientRect();
        const lY = documentLayoutRect.top;
        const lX = documentLayoutRect.left;
        const mY = maskElRect.top;
        const mX = maskElRect.left;
        const startX = mX - lX;
        const startY = mY - lY;
        // 先判断是否出界 => 1、出界=>move  2、未出界=>计算位置
        if (
          startX <= 0 ||
          startY <= 0 ||
          startX >= this.documentWidth ||
          startY >= this.documentHeight
        ) {
          let disX = 0;
          let disY = 0;
          if (startX <= 0) {
            disX = -startX + this.documentWidth / 2;
          }
          if (startY <= 0) {
            disY = -startY + this.documentHeight / 2;
          }
          if (startX >= this.documentWidth) {
            disX = this.documentWidth / 2 - startX;
          }
          if (startY >= this.documentHeight) {
            disY = this.documentHeight / 2 - startY;
          }
          this.transferDocument({ disX, disY });
          this.transition = true;
          let index = 0;
          this.timer = window.setInterval((_) => {
            this.calculateXy();
            index++;
            if (index === 12) {
              clearInterval(this.timer);
              this.transition = false;
            }
          }, 30);
        } else {
          this.calculateXy();
        }
      });
    },
    // 计算path起点、终点坐标
    calculateXy() {
      if (this.activeTextId == null) {
        return;
      }
      if (!this.activeEl) return;
      if (!this.text) return;
      // this.setRectangle()
      const page = this.page;
      const rotateIndex = this.rotateIndex;
      const zoomScale = this.zoomScale || 1;
      this.$nextTick((_) => {
        // maskValue = page.tableData[activeTextId],
        const maskEl = this.$refs["svg-rectangle"];
        const documentLayout = this.$refs.documentLayout;
        const ocrTextWrapper = this.$refs.rightTab.$refs.ocrTextWrapper;
        const maskElRect = maskEl.getBoundingClientRect();
        const documentLayoutRect = documentLayout.getBoundingClientRect();
        const lY = documentLayoutRect.top;
        const lX = documentLayoutRect.left;
        const mY = maskElRect.top;
        const mX = maskElRect.right;
        const startX = mX - lX;
        const startY = mY - lY;
        const offsetTop = this.activeEl.offsetTop + 60;
        const offsetLeft = this.activeEl.offsetLeft;
        const scrollTop = ocrTextWrapper.scrollTop;
        const pathEndX = this.documentWidth + offsetLeft + 52;
        const pathEndY =
          offsetTop - scrollTop + this.activeEl.clientHeight / 2 + 8;
        const scale = page.rotateScale * zoomScale * this.imgScale;
        const position = this.text.values[0].position[0];
        const w = position[1].x - position[0].x;
        const h = position[2].y - position[0].y;

        let x = startX;
        let y = startY + (h * scale) / 2;

        if (rotateIndex % 4 === 1) {
          // x = startX + leanX;
          y = startY + (w * scale) / 2;
        }
        if (rotateIndex % 4 === 2) {
          y = startY + (h * scale) / 2;
        }
        if (rotateIndex % 4 === 3) {
          // x = startX + leanX;
          y = startY + (w * scale) / 2;
        }

        // 处理边界
        if (x > this.documentWidth) {
          x = this.documentWidth;
        }

        this.pathValue = {
          pathStartX: x,
          pathStartY: y,
          pathEndX,
          pathEndY,
        };
      });
    },
    // 还原
    resetProps() {
      this.rotateIndex = 0;
      this.activePageIndex = 1;
      this.activeTextId = null;
      this.zoomScale = 1;
      this.pathValue = null;
      this.dragX = 0;
      this.dragY = 0;
      this.moveX = 0;
      this.moveY = 0;
      this.updateTranslateY();
      this.rectanglePosition = "";
      this.$emit("resetId");
    },
    // 设置初始y位移
    updateTranslateY() {
      this.$nextTick((_) => {
        if (this.rotateIndex % 4 === 0 && this.zoomScale === 1) {
          this.initTranslateY = Math.max(
            (this.realRenderHeight - this.documentHeight) / 2,
            0
          );
        } else {
          this.initTranslateY = 0;
        }
      });
    },

    handleMousedown(e, elName) {
      const el = this.$refs[elName];
      this.removeEventListener(e, elName);
      e = e || window.event;
      // if (e.target !== el) {
      //   return;
      // }
      this.offsetX = e.pageX;
      this.offsetY = e.pageY;
      window.addEventListener(
        "mousemove",
        (this[`${elName}Mousemove`] = (e) => {
          e = e || window.event;
          // const el = this.$refs[elName];
          this.proxy(this.calculateDragDis, {
            offsetX: e.pageX,
            offsetY: e.pageY,
            elName: elName,
          });
          el.removeEventListener("mousedown", this.handleMousedown);
          this.draggable = true;
          // console.log(e, elName, this[`${elName}Mousemove`]);
        })
      );
      window.addEventListener(
        "mouseup",
        this.removeEventListener.bind(this, e, elName)
      );
    },
    removeEventListener(e, elName, w) {
      window.removeEventListener("mousemove", this[`${elName}Mousemove`]);
      window.removeEventListener("mouseup", this.removeEventListener);
      // this[`${elName}Mousemove`] = null;
      this.draggable = false;
    },
    fn(arr) {
      return arr.reduce((prev, cur) => {
        return prev.concat(Array.isArray(cur) ? this.fn(cur) : cur);
      }, []);
    },
    // 绑定事件函数
    bind(node, event, fun) {
      if (node.addEventListener) {
        node.removeEventListener(event, fun);
        node.addEventListener(event, fun, false);
      } else {
        node.detachEvent("on" + event, fun);
        node.attachEvent("on" + event, fun.call());
      }
    },
    parentProxy() {
      this.proxy(this.calculateXy);
    },
    // 代理函数
    proxy(fun, args) {
      if (this.proxying) return;
      this.proxying = true;
      window.requestAnimationFrame((_) => {
        fun.call(this, args);
        this.proxying = false;
      });
    },
  },
  computed: {
    // 当前示例信息
    example() {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.codeTest = JSON.stringify(this.data[0].json) || "";
      return this.data[0];
    },
    // 总页数
    total() {
      return this.example.images.length;
    },
    // 当前页面信息
    page() {
      const translateX = 0;
      const translateY = 0;
      const rotateScale = 1;
      const page = {
        value: this.value,
        translateX,
        translateY,
        rotateScale, // 旋转导致的缩放比例
      };

      return page;
    },
    originalLocation() {
      if (window.location.origin === "http://localhost:8096") {
        return "https://beefeather-ng-front.lianyirong.com.cn/file-handle-web/file/image?filename=";
      } else {
        return `${window.location.origin}/file-handle-web/file/image?filename=`;
      }
    },
    // 文档图片地址
    imageUrl() {
      return this.example.images[this.activePageIndex - 1].imagePath;
    },
    imageName() {
      return this.example.images[this.activePageIndex - 1].imageName;
    },
    // 大图预览所需数据
    urlList() {
      return [{ url: this.imageUrl, title: this.imageName }];
    },
    // 当前文本信息
    // text() {
    //   const { value } = this.page
    //   const textArr = [...value]
    //   if (this.activeTextId > 1000) {
    //     const fatherId = Number(this.activeTextId.toString().substring(0, 2))
    //     const fatherText = textArr.filter((i) => {
    //       return i.sortId === fatherId
    //     })[0].billDictionaryList
    //     return fatherText.filter((i) => {
    //       return i.sortId === this.activeTextId
    //     })[0]
    //   } else {
    //     return textArr.filter((i) => {
    //       return i.sortId === this.activeTextId
    //     })[0]
    //   }
    // },
    // 当前图片初始缩放比例
    imgScale() {
      return this.scale;
    },
  },
};
</script>
<style lang="stylus" spored>
@import '../ocr-layout.styl';

.dih-page-input {
  background-color: transparent;
  max-width: 20px;
  border: none;
  text-align: center;
  outline: medium;
  color: #999;
}

.svg-seal {
  pointer-events: none;
  position: absolute;
  z-index: 1;
}
</style>
