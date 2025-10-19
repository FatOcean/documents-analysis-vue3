<template>
  <div class="bill-of-lading-wrapper" style="width: 100%">
    <ocr-layout
      @resetId="() => (activeTextId = null)"
      :data="data"
      v-model="page"
      ref="documents"
      :activeTabIndex="activeTabIndex"
      ><div class="search-box">
        <el-input
          placeholder="请输入字段名进行搜索"
          prefix-icon="el-icon-search"
          @input="fieldNameInput"
          v-model="fieldName"
        >
        </el-input>
        <el-checkbox v-model="checkedNull">隐藏空白字段</el-checkbox>
      </div>
      <table cellspacing="0" class="table-data">
        <thead>
          <td colspan="2">字段名</td>
          <td>识别结果</td>
        </thead>
        <tbody v-for="(i, index) in showPageData" :key="index">
          <template v-if="i.groupable">
            <tr>
              <td :rowspan="i.row.length + 1" class="td-title">
                {{ i.keyEn }}<br />{{ i.keyCh }}
              </td>
            </tr>
            <tr
              v-for="(j, jindex) in i.row"
              :key="jindex"
              :class="{
                active:
                  activeTextId === j.sortId &&
                  text.keyCh === j.keyCh &&
                  noParent.keyCh === i.keyCh,
              }"
              @click="(e) => clickHandler(e, j, i)"
            >
              <template>
                <td>{{ j.keyEn }}<br />{{ j.keyCh }}</td>
                <td>
                  {{
                    j.values && j.values.length > 0 && j.values[0].value
                      ? j.values[0].value
                      : ""
                  }}
                </td>
              </template>
            </tr>
          </template>

          <template v-else-if="i.values && i.values.length > 1">
            <tr>
              <td :rowspan="i.values.length + 1" class="td-title" colspan="2">
                {{ i.keyEn }}<br />{{ i.keyCh }}
              </td>
            </tr>
            <tr
              v-for="(j, jindex) in i.values"
              :key="jindex"
              :class="{
                activeValues:
                  activeTextId === j.sortId &&
                  text.keyCh === j.keyCh &&
                  noParent.keyCh === i.keyCh,
              }"
              @click="(e) => clickHandler(e, j, i, 'values')"
            >
              <td style="height: 80px">
                {{ j.value }}
              </td>
            </tr>
          </template>

          <tr
            v-else
            :class="{ active: activeTextId === i.sortId }"
            @click="(e) => clickHandler(e, i)"
          >
            <td colspan="2">{{ i.keyEn }}<br />{{ i.keyCh }}</td>
            <td>
              {{
                i.values && i.values.length > 0 && i.values[0].value
                  ? i.values[0].value
                  : ""
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </ocr-layout>
  </div>
</template>
<script>
import { staticData } from "../staticData";
import ocrLayout from "./ocr-layout.vue";
export default {
  components: {
    ocrLayout,
  },
  // props: {
  //   productName: {
  //     type: String,
  //     default: 'order'
  //   }
  // },
  data() {
    return {
      data: staticData.cross_border_contract,
      activeTextId: "",
      page: [], // 当前页面数据信息
      activeDocumentIndex: 0,
      activeTabIndex: 0,
      text: "",
      fieldName: "",
      checkedNull: false,
      showPageData: [], // 用作展示
      noParent: "",
    };
  },
  watch: {
    // productName() {
    //   this.data = staticData[this.productName]
    //   this.page = this.disposeContent(this.data[0].content)
    //   this.$nextTick(() => {
    //     this.$refs.documents.resetProps()
    //   })
    //   this.fieldName = ''
    //   this.checkedNull = false
    // },
    page: {
      handler(val) {
        this.showPageData = val;
      },
      immediate: true, // 立即执行
    },
    checkedNull() {
      // handler(val) {
      this.fieldNameInput();
      // }
    },
  },
  computed: {
    originLocation() {
      return process.env.NODE_ENV === "development"
        ? "https://beefeather-ng-front.qhhrly.cn//file-handle-web/file/image"
        : `${window.location.origin}/file-handle-web/file/image`;
    },
  },
  created() {
    const content = this.data[0].content;
    this.page = this.disposeContent(content);
  },
  mounted() {},
  methods: {
    // 处理数据
    disposeContent(content) {
      // 找出groupable为true的数组中，row数组中存在values数组下数据为多个的情况
      // 修改原有数据，直接替换掉row数组
      const contents = content;
      contents.forEach((item) => {
        if (item.groupable && item.row) {
          item.row = item.row
            .map((row) => {
              if (row.values && row.values.length > 1) {
                return row.values.map((value, index) => {
                  const newKeyCh = `${row.keyCh}${index + 1}`;
                  return {
                    keyCh: newKeyCh,
                    keyEn: row.keyEn,
                    sortId: row.sortId,
                    values: [value],
                  };
                });
              } else {
                return row;
              }
            })
            .flat(); // 使用 flat() 展开嵌套数组
        }
        if (item.values && item.values.length > 1) {
          item.values.forEach((value, index) => {
            value.sortId = `${item.sortId}-${index}`;
          });
          item.values = item.values.sort((a, b) => {
        // 提取下划线和点号之间的数字部分，并转换为整数
        const matchA = a.imageName.match(/_(\d+)\./);
        const matchB = b.imageName.match(/_(\d+)\./);
        
        // 如果没有匹配到数字，则默认为0
        const indexA = matchA ? parseInt(matchA[1]) : 0;
        const indexB = matchB ? parseInt(matchB[1]) : 0;
        
        // 比较提取的数字部分
        return indexA - indexB;
    });
        }
      });
      return contents;
    },
    clickHandler(e, i, noParent = "xx", values = "xx") {
      let el = e.target.parentNode.firstChild;
      if (el.tagName === "TR") el = el.firstChild;
      if (values === "values") {
        this.noParent = noParent;
        this.text = i;
        e = e || window.event;
        const images = this.data[0].images;
        const imageIndex = images.findIndex((item) => {
          return item.imageName === i.imageName;
        });
        this.$refs.documents.$events.trigger("click-ocr-el", {
          el,
          id: i.sortId,
          text: { values: [{ ...i }] },
          imageIndex: imageIndex === -1 ? 0 : imageIndex,
        });
        this.activeTextId = this.$refs.documents.activeTextId;
      }
      if (!(i.values && i.values.length > 0 && i.values[0].value !== "")) {
        return;
      }
      this.noParent = noParent;
      this.text = i;
      e = e || window.event;
      const images = this.data[0].images;
      const imageIndex = images.findIndex((item) => {
        return item.imageName === i.values[0].imageName;
      });
      this.$refs.documents.$events.trigger("click-ocr-el", {
        el,
        id: i.sortId,
        text: i,
        imageIndex: imageIndex === -1 ? 0 : imageIndex,
      });
      this.activeTextId = this.$refs.documents.activeTextId;
    },
    uploadFileData(res) {
      this.data = res.data;
      this.data.forEach((item) => {
        item.images.forEach((image) => {
          image.imagePath = `${
            this.originLocation
          }?filename=${encodeURIComponent(image.imagePath)}`;
        });
      });
      this.page = this.disposeContent(this.data[0].content);
      this.checkedNull = false;
      this.fieldName = "";
      this.activeTextId = "";
      this.$refs.documents.resetProps();
    },
    handleClick(value) {
      // this.page = this.disposeContent(this.data[value - 1].content)
      this.checkedNull = false;
      this.fieldName = "";
      this.activeTextId = "";
    },
    fieldNameInput() {
      const fieldName = this.fieldName.toLowerCase();
      this.activeTextId = "";
      this.$refs.documents.pathValue = null;
      this.$refs.documents.text = "";
      this.$refs.documents.rectanglePosition = null;
      this.showPageData = this.fuzzySearch(
        fieldName,
        this.page,
        this.checkedNull
      );
      // 对多层级数组再进行操作
      if (this.checkedNull) {
        this.showPageData = this.showPageData
          .map((item) => {
            if (item.row) {
              const filteredRow = item.row.filter((rowItem) => {
                return (
                  rowItem.values &&
                  rowItem.values.length > 0 &&
                  rowItem.values[0].value !== ""
                );
              });

              if (filteredRow.length > 0) {
                return { ...item, row: filteredRow };
              } else {
                return null;
              }
            } else {
              return item;
            }
          })
          .filter(Boolean);
      }
    },
    fuzzySearch(keyword, data, isCheckboxChecked) {
      // 将搜索关键字转换为小写，以进行不区分大小写的搜索
      const lowerKeyword = keyword.toLowerCase();

      // 进行模糊搜索
      const results = data.filter((item) => {
        // 检查 checkbox 是否选中，只有在选中时才判断隐藏空白字段
        // const isHiddenFieldChecked = isCheckboxChecked && item?.values?.length === 0
        const isHiddenFieldChecked =
          isCheckboxChecked &&
          (item?.values?.length === 0 ||
            item?.values?.every((valueObj) => valueObj.value.trim() === ""));
        // 检查 keyEn 和 keyCh 是否包含关键字
        const keyEnMatch = item.keyEn.toLowerCase().includes(lowerKeyword);
        const keyChMatch = item.keyCh.toLowerCase().includes(lowerKeyword);

        // 检查 values 中的 value 是否包含关键字
        const valueMatch = item?.values?.some((valueObj) =>
          valueObj.value.toLowerCase().includes(lowerKeyword)
        );

        // 递归检查 row 中的每个子项
        const rowMatch =
          item.row &&
          item.row.some(
            (rowItem) =>
              this.fuzzySearch(keyword, item.row, isCheckboxChecked).length > 0
          );

        // 返回任何匹配的项
        return (
          (keyEnMatch || keyChMatch || valueMatch || rowMatch) &&
          !isHiddenFieldChecked
        );
      });

      return results;
    },
  },
};
</script>
<style lang="stylus" scoped>
.search-box {
  margin-top: 12px;
  display: flex;
  align-items: center;
  margin-bottom: 4px;

  .el-checkbox__label {
    padding-left: 4px;
    color: #202D40;
  }

  .el-checkbox {
    margin-left: 32px;
  }

  .el-checkbox__input.is-checked+.el-checkbox__label {
    color: #202D40;
  }
}

.table-data {
  width: 100%;
  margin: 12px 0;

  tbody {
    tr {
      td {
        table {
          width: calc(100% + 8px);
          margin-left: -8px;

          p {
            padding-left: 8px;
            border-bottom: 1px solid #e3e8f0;
            white-space: pre-line;

            &:last-child {
              border: none;
            }
          }
        }
      }
    }
  }

  thead {
    background: #F3F4F6;

    td {
      border-top: 1px solid #E3E8F0;
      font-weight: bold;
      color: #202D40;

      &:last-child {
        width: 50%;
        color: #202D40;
        border-right: 1px solid #E3E8F0;
      }
    }
  }

  tr td:last-child {
    width: 50%;
    color: #202D40;
    border-right: 1px solid #E3E8F0;
  }

  .td-title {
    width: 33% !important;
    border-right: none !important;
  }

  tr {
    &:hover {
      background: #f6f9fb;
      cursor: pointer;
    }

    &.commonCursor {
      cursor: default;
      background: none;
    }

    &.active {
      .activeTd {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-right: none;
        border-left: none;
      }

      td:first-child {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-top-left-radius: 4px;
        border-right: none;
        border-bottom-left-radius: 4px;
      }

      td:last-child {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-left: 1px solid #E3E8F0;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }

    &.activeValues {
      .activeTd {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-right: none;
        border-left: none;
      }

      td:first-child {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        border-top-left-radius: 4px;
        border-right: none;
        border-bottom-left-radius: 4px;
      }

      td:last-child {
        background: rgba(8, 135, 255, 0.1);
        border: 1px solid #009688;
        // border-left: 1px solid #E3E8F0;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }
  }

  td {
    line-height: 40px;
    padding-left: 8px;
    padding-right: 8px;
    color: #5F6C80;
    border-bottom: 1px solid #E3E8F0;
    border-left: 1px solid #E3E8F0;
    white-space: pre-line;
  }
}
</style>
