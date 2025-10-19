<template>
    <transition name="viewer-fade">
        <div tabindex="-1" ref="el-image-viewer__wrapper" class="el-image-viewer__wrapper"
            :style="{ 'z-index': zIndex }">
            <div class="el-image-viewer__mask" @click.self="handleMaskClick"></div>
            <!-- ARROW -->
            <template v-if="!isSingle">
                <span class="el-image-viewer__btn el-image-viewer__prev"
                    :class="{ 'is-disabled': !infinite && isFirst }" @click="prev">
                    <i class="el-icon-arrow-left" />
                </span>
                <span class="el-image-viewer__btn el-image-viewer__next"
                    :class="{ 'is-disabled': !infinite && isLast }" @click="next">
                    <i class="el-icon-arrow-right" />
                </span>
            </template>
            <!-- ACTIONS -->
            <div class="el-image-viewer__actions">
                <div class="el-image-viewer__title">
                    {{ currentTitle }}
                </div>
                <div v-if="!isSingle" class="el-image-viewer__pages">
                    {{ this.index + 1 }} / {{ this.urlList.length }}
                </div>
                <div class="el-image-viewer__actions__inner">
                    <template v-if="!currentIsPDF">
                        <i class="el-icon-zoom-out" @click="handleActions('zoomOut')"></i>
                        <i class="el-icon-zoom-in" @click="handleActions('zoomIn')"></i>
                        <i :class="mode.icon" @click="toggleMode"></i>
                        <i class="el-icon-refresh-left" @click="handleActions('anticlocelise')"></i>
                        <i class="el-icon-refresh-right" @click="handleActions('clocelise')"></i>
                    </template>
                    <template v-if="currentIsPDF && $slots.pdf">
                        <i class="el-icon-zoom-out" @click="emitAction('zoomOut')"></i>
                        <i class="el-icon-zoom-in" @click="emitAction('zoomIn')"></i>
                        <i class="el-icon-refresh-left" @click="emitAction('rotateLeft')"></i>
                        <i class="el-icon-refresh-right" @click="emitAction('rotateRight')"></i>
                    </template>
                    <i class="el-icon-close" @click="hide"></i>
                </div>
            </div>
            <div class="el-image-viewer__exter" v-if="exterActions.length > 0">
                <template v-for="item in exterActions">
                    <el-popover v-if="item === 'rename'" placement="top" width="265" v-model="renameVisible"
                        :key="item">
                        <div style="font-weight: bold;margin-bottom: 7px">{{ exterActionsMap.rename.text }}</div>
                        <el-input v-model="renameValue"></el-input>
                        <div style="text-align: right;margin-top: 15px;">
                            <el-button size="mini" type="primary" plain @click="handleRename(false)">取消</el-button>
                            <el-button type="primary" size="mini" @click="handleRename(true)">确认</el-button>
                        </div>
                        <template v-slot:reference>
                            <div class="el-image-viewer__exter-item">
                                <i :class="exterActionsMap.rename.icon"></i>
                                <span>{{ exterActionsMap.rename.text }}</span>
                            </div>
                        </template>
                    </el-popover>
                    <div v-else>
                        <div class="el-image-viewer__exter-item" :key="item" @click="handleExterClick(item)">
                            <i :class="exterActionsMap[item].icon"></i>
                            <span>{{ exterActionsMap[item].text }}</span>
                        </div>
                    </div>

                </template>
            </div>
            <!-- CANVAS -->
            <div class="el-image-viewer__canvas" v-if="!currentIsPDF">
                <img v-for="(urlObj, i) in urlList" v-if="i === index" ref="img" class="el-image-viewer__img"
                    :key="urlObj.url" :src="currentImg" :style="imgStyle" @load="handleImgLoad" @error="handleImgError"
                    @mousedown="handleMouseDown">
            </div>
            <div class="el-image-viewer__pdf" v-else>
                <slot v-if="$slots.pdf" name="pdf" v-bind:url="urlList[index].url"></slot>
                <object v-else :data="urlList[index].url" type="application/pdf" width="100%" height="100%">
                    <embed type="application/pdf" wmode="opaque" :src="urlList[index].url">
                    <div>
                        不支持预览，可尝试以下方法：<br>
                        1、请<a href="https://acrobat.adobe.com/us/en/acrobat/pdf-reader.html" target="_blank"
                            style="color:#009688">点击下载</a>或自行安装Adobe Reader播放器<br>
                        2、切换至其他浏览器（推荐Chrome）
                    </div>
                    </embed>
                </object>
            </div>
        </div>
    </transition>
</template>

<script>
//   import { on, off } from './utils/dom'
//   import { rafThrottle, isFirefox } from './utils/util'
// import { Vue } from 'vue'

const on = (function () {
  if (document.addEventListener) {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false);
      }
    };
  } else {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.attachEvent("on" + event, handler);
      }
    };
  }
})();

const off = (function () {
  if (document.removeEventListener) {
    return function (element, event, handler) {
      if (element && event) {
        element.removeEventListener(event, handler, false);
      }
    };
  } else {
    return function (element, event, handler) {
      if (element && event) {
        element.detachEvent("on" + event, handler);
      }
    };
  }
})();
const isFirefox = function () {
  return (
    typeof window !== "undefined" && /firefox/i.test(window.navigator.userAgent)
  );
};

const rafThrottle = function (fn) {
  let locked = false;
  return function (...args) {
    if (locked) return;
    locked = true;
    window.requestAnimationFrame(() => {
      fn.apply(this, args);
      locked = false;
    });
  };
};

const Mode = {
  CONTAIN: {
    name: "contain",
    icon: "el-icon-full-screen",
  },
  ORIGINAL: {
    name: "original",
    icon: "el-icon-c-scale-to-original",
  },
};

const mousewheelEventName = isFirefox() ? "DOMMouseScroll" : "mousewheel";

const ExterActionsMap = {
  rename: {
    icon: "el-icon-edit",
    text: "重命名",
  },
  download: {
    icon: "el-icon-download",
    text: "下载",
  },
  replace: {
    icon: "el-icon-sort",
    text: "替换",
  },
};

export default {
  name: "llsImageViewer",

  // components: {
  //   [Popover.name]: Popover,
  //   [Button.name]: Button,
  //   [Input.name]: Input,
  // },

  props: {
    urlList: {
      type: Array,
      default: () => [],
    },
    zIndex: {
      type: Number,
      default: 2000,
    },
    onSwitch: {
      type: Function,
      default: () => {},
    },
    onClose: {
      type: Function,
      default: () => {},
    },
    initialIndex: {
      type: Number,
      default: 0,
    },
    appendToBody: {
      type: Boolean,
      default: true,
    },
    maskClosable: {
      type: Boolean,
      default: true,
    },
    exterActions: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      index: this.initialIndex,
      isShow: false,
      infinite: true,
      loading: false,
      mode: Mode.CONTAIN,
      transform: {
        scale: 1,
        deg: 0,
        offsetX: 0,
        offsetY: 0,
        enableTransition: false,
      },
      exterActionsMap: ExterActionsMap,
      renameValue: "",
      renameVisible: false,
    };
  },
  computed: {
    isSingle() {
      return this.urlList.length <= 1;
    },
    isFirst() {
      return this.index === 0;
    },
    isLast() {
      return this.index === this.urlList.length - 1;
    },
    currentTitle() {
      return this.urlList[this.index].title || "";
    },
    currentImg() {
      return this.urlList[this.index].url;
    },
    imgStyle() {
      const { scale, deg, offsetX, offsetY, enableTransition } = this.transform;
      const style = {
        transform: `scale(${scale}) rotate(${deg}deg)`,
        transition: enableTransition ? "transform .3s" : "",
        "margin-left": `${offsetX}px`,
        "margin-top": `${offsetY}px`,
      };
      if (this.mode === Mode.CONTAIN) {
        style.maxWidth = style.maxHeight = "100%";
      }
      return style;
    },
    currentIsPDF() {
      return (
        /\.pdf$/.test(this.urlList[this.index].url) ||
        this.urlList[this.index].type === "pdf"
      );
    },
  },
  watch: {
    index: {
      handler: function (val) {
        if (this.currentIsPDF) return;
        this.reset();
        this.onSwitch(val);
      },
    },
    currentImg(val) {
      if (this.currentIsPDF) return;
      this.$nextTick((_) => {
        const $img = this.$refs.img[0];
        if (!$img.complete) {
          this.loading = true;
        }
      });
    },
  },
  methods: {
    hide() {
      this.deviceSupportUninstall();
      this.onClose();
    },
    deviceSupportInstall() {
      this._keyDownHandler = rafThrottle((e) => {
        const keyCode = e.keyCode;
        switch (keyCode) {
          // ESC
          case 27:
            this.hide();
            break;
          // SPACE
          case 32:
            this.toggleMode();
            break;
          // LEFT_ARROW
          case 37:
            this.prev();
            break;
          // UP_ARROW
          case 38:
            this.handleActions("zoomIn");
            break;
          // RIGHT_ARROW
          case 39:
            this.next();
            break;
          // DOWN_ARROW
          case 40:
            this.handleActions("zoomOut");
            break;
        }
      });
      this._mouseWheelHandler = rafThrottle((e) => {
        const delta = e.wheelDelta ? e.wheelDelta : -e.detail;
        if (delta > 0) {
          this.handleActions("zoomIn", {
            zoomRate: 0.015,
            enableTransition: false,
          });
        } else {
          this.handleActions("zoomOut", {
            zoomRate: 0.015,
            enableTransition: false,
          });
        }
      });
      on(document, "keydown", this._keyDownHandler);
      on(document, mousewheelEventName, this._mouseWheelHandler);
    },
    deviceSupportUninstall() {
      off(document, "keydown", this._keyDownHandler);
      off(document, mousewheelEventName, this._mouseWheelHandler);
      this._keyDownHandler = null;
      this._mouseWheelHandler = null;
    },
    handleImgLoad(e) {
      this.loading = false;
      this.$emit("load", e);
    },
    handleImgError(e) {
      this.loading = false;
      e.target.alt = "加载失败";
      this.$emit("error", e);
    },
    handleMouseDown(e) {
      if (this.loading || e.button !== 0) return;

      const { offsetX, offsetY } = this.transform;
      const startX = e.pageX;
      const startY = e.pageY;
      this._dragHandler = rafThrottle((ev) => {
        this.transform.offsetX = offsetX + ev.pageX - startX;
        this.transform.offsetY = offsetY + ev.pageY - startY;
      });
      on(document, "mousemove", this._dragHandler);
      on(document, "mouseup", this.handleMouseUp);

      e.preventDefault();
    },
    handleMouseUp(e) {
      off(document, "mousemove", this._dragHandler);
      off(document, "mouseup", this.handleMouseUp);
    },
    handleMaskClick() {
      if (this.maskClosable) {
        this.hide();
      }
    },
    reset() {
      this.transform = {
        scale: 1,
        deg: 0,
        offsetX: 0,
        offsetY: 0,
        enableTransition: false,
      };
    },
    toggleMode() {
      if (this.loading) return;

      const modeNames = Object.keys(Mode);
      const modeValues = Object.values(Mode);
      const index = modeValues.indexOf(this.mode);
      const nextIndex = (index + 1) % modeNames.length;
      this.mode = Mode[modeNames[nextIndex]];
      this.reset();
    },
    prev() {
      if (this.isFirst && !this.infinite) return;
      const len = this.urlList.length;
      this.index = (this.index - 1 + len) % len;
    },
    next() {
      if (this.isLast && !this.infinite) return;
      const len = this.urlList.length;
      this.index = (this.index + 1) % len;
    },
    handleActions(action, options = {}) {
      if (this.loading) return;
      const { zoomRate, rotateDeg, enableTransition } = {
        zoomRate: 0.2,
        rotateDeg: 90,
        enableTransition: true,
        ...options,
      };
      const { transform } = this;
      switch (action) {
        case "zoomOut":
          if (transform.scale > 0.2) {
            transform.scale = parseFloat(
              (transform.scale - zoomRate).toFixed(3)
            );
          }
          break;
        case "zoomIn":
          transform.scale = parseFloat((transform.scale + zoomRate).toFixed(3));
          break;
        case "clocelise":
          transform.deg += rotateDeg;
          break;
        case "anticlocelise":
          transform.deg -= rotateDeg;
          break;
      }
      transform.enableTransition = enableTransition;
    },
    handleExterClick(action) {
      switch (action) {
        case "download":
          this.$emit("download-callback", this.index);
          break;
        case "replace":
          this.$emit("replace-callback", this.index);
          break;
      }
    },
    handleRename(status) {
      this.$emit("rename-callback", this.index, status, this.renameValue);
      this.renameVisible = false;
    },
    emitAction(action) {
      this.$emit("action", "pdf", action);
    },
  },
  mounted() {
    this.deviceSupportInstall();
    if (this.appendToBody) {
      document.body.appendChild(this.$el);
    }
    // add tabindex then wrapper can be focusable via Javascript
    // focus wrapper so arrow key can't cause inner scroll behavior underneath
    this.$refs["el-image-viewer__wrapper"].focus();
  },
  unmounted() {
    // if appendToBody is true, remove DOM node after destroy
    if (this.appendToBody && this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el);
    }
  },
};
</script>


<style lang="scss" scoped>
.el-image-viewer__wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.el-image-viewer__btn {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0.8;
  cursor: pointer;
  box-sizing: border-box;
  user-select: none;
}

.el-image-viewer__canvas {
  width: 100%;
  height: calc(100% - 44px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-image-viewer__actions {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 44px;
  background-color: #000;
  z-index: 1;

  .el-image-viewer__pages {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    color: #fff;
    line-height: 44px;
  }

  .el-image-viewer__title {
    padding: 0 20px;
    height: 100%;
    line-height: 44px;
    color: #fff;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .el-image-viewer__actions__inner {
    height: 100%;
    text-align: justify;
    cursor: default;
    font-size: 20px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: flex-end;

    &>i {
      margin-right: 20px;
      cursor: pointer;
    }
  }
}

.el-image-viewer__exter {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  height: 44px;
  background-color: #fff;
  border-radius: 8px 8px 0 0;
  padding: 0 5px;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

.el-image-viewer__exter-item {
  display: flex;
  align-items: center;
  height: 100%;
  margin: 0 15px;
  cursor: pointer;
  font-size: 12px;

  &>i {
    color: #009688;
    margin-right: 5px;
    font-size: 14px;
  }
}

.el-image-viewer__prev {
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  font-size: 24px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.6);
  border-color: #fff;
  left: 40px;
}

.el-image-viewer__next {
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  font-size: 24px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.6);
  border-color: #fff;
  right: 40px;
  text-indent: 2px;
}

.el-image-viewer__mask {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0.7;
  background: #000;
}

.el-image-viewer__pdf {
  position: relative;
  width: 100%;
  height: calc(100% - 44px);
}
</style>