<template>
  <div class="right-select" :style="{ width: isshowRight ? '200px' : '60px' }">
    <div v-show="isshowRight">
      <div class="serInput">
        <el-input
          v-model.trim="productName"
          placeholder="请输入应用名称"
          @input="findProductName"
        >
          <i slot="prefix" class="el-icon-search"></i>
        </el-input>
      </div>
      <div class="product">
        <div
          v-for="(item, index) in productList"
          :key="index"
          class="product-namelist"
        >
          <div>
            <div class="product-list-title">
              <span>
                <svg-icon
                  :iconClass="item.name"
                  style="margin-right: 5px"
                ></svg-icon>
                {{ item.name }}
              </span>
              <i
                @click="showChildren(item)"
                :class="
                  item.isShowChildren
                    ? 'el-icon-arrow-down'
                    : 'el-icon-arrow-up'
                "
              ></i>
            </div>
            <div v-show="item.isShowChildren">
              <div
                v-for="(child, childIndex) in item.children"
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
          </div>
        </div>
      </div>
      <div class="right-btn">
        <i class="el-icon-s-fold" @click="showRight"></i>
      </div>
    </div>
    <div class="right-show" v-show="!isshowRight">
      <i class="el-icon-s-unfold" @click="showRight"></i>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import { productListAll } from "../staticData/data.js";
export default {
  name: "LeftSelect",
  data() {
    return {
      productName: "",
      productListAll, // 产品名称
      isshowRight: true,
      activebgName: "提单",
      productList: [],
      product: [],
    };
  },
  computed: {
    ...mapState(["productData"]),
  },
  mounted() {
    this.messageIframeProduct(this.productData);
  },
  watch: {
    // productData: {
    //   handler(val) {
    //     this.messageIframeProduct(val)
    //   }
    // }
  },
  methods: {
    messageIframeProduct(data) {
      const { tradeDocumentAnalysis } = data;
      // if (tradeDocumentAnalysis) {
      this.$nextTick(() => {
        // this.productList = this.filterProducts(
        //   productListAll,
        //   tradeDocumentAnalysis
        // )
        this.productList = productListAll;
        this.activebgName = this.productList[0].children[0].name;
        this.product = this.productList;
        this.productNameClick(this.productList[0].children[0]);
      });
      // }
    },
    // 过滤出有这个权限的应用
    filterProducts(productListAll, filterArray) {
      return productListAll
        .map((category) => {
          const filteredChildren = category.children.filter((child) => {
            return filterArray.some((filterItem) => {
              return child.staticName === filterItem.staticName;
            });
          });

          return {
            ...category,
            children: filteredChildren,
          };
        })
        .filter((category) => category.children.length > 0);
    },
    ...mapMutations(["setProductObj"]),
    productNameClick(item, index) {
      this.activebgName = item.name;
      this.setProductObj(item);
      this.$parent.setProductName(item);
    },
    showChildren(item) {
      item.isShowChildren = !item.isShowChildren;
    },
    showRight() {
      this.isshowRight = !this.isshowRight;
      this.$parent.setisshowRight(this.isshowRight);
    },
    findProductName(val) {
      if (val !== "") {
        this.productList = this.mapTree(val, this.product);
      } else {
        this.productList = this.product;
      }
    },
    mapTree(value, arr) {
      const newarr = [];
      arr.forEach((element) => {
        // 不区分大小写
        if (element.name.toLowerCase().indexOf(value.toLowerCase()) > -1) {
          // 判断条件
          element.openStatus = true;
          newarr.push(element);
        } else {
          if (element.children && element.children.length > 0) {
            const redata = this.mapTree(value, element.children);
            if (redata && redata.length > 0) {
              const obj = {
                ...element,
                children: redata,
              };
              obj.openStatus = true;
              newarr.push(obj);
            }
          }
        }
      });
      return newarr;
    },
  },
};
</script>

<style lang="stylus" scoped>
.right-select {
  margin-right: 6px;

  .serInput {
    padding-bottom: 10px;

    .el-input {
      ::v-deep .el-input__inner {
        border-radius: 0px !important;
        border: none;
        border-bottom: 1px solid #BFE0FF;
      }
      ::v-deep .el-input__prefix{
        top:10px;
      }
    }

    .el-icon-search {
      color: #009688;
    }
  }

  .product {
    overflow: auto;
    height: calc(100vh - 220px);

    .product-namelist {
      font-size: 14px;
      padding: 8px 4px;
      border-bottom: 1px solid #D8E1FF;

      &:last-child {
        border-bottom: none;
      }

      &:first-child {
        padding-top: 0px;
      }

      .product-list-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        line-height: 30px;

        i {
          cursor: pointer;
        }
      }

      .product-list-name {
        line-height: 30px;
        cursor: pointer;

        >div {
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
  }

  .right-btn {
    height: 60px;
    border-top: 1px solid #D8E1FF;
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .el-icon-s-fold {
      font-size: 20px;
      color: #8492A6;
      cursor: pointer;
    }
  }

  .right-show {
    position: absolute;
    left: 0px;
    bottom: 27px;
    background: #009688;
    padding: 6px 12px 6px 6px;
    border-radius: 0 16px 16px 0;

    .el-icon-s-unfold {
      font-size: 20px;
      color: #FFF;
      cursor: pointer;
    }
  }
}
</style>
