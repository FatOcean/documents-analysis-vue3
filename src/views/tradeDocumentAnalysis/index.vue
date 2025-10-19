<template>
  <div class="document-parsing">
    <el-page-header @back="goBack" content="贸易单证解析" bottom-line>
    </el-page-header>
    <div class="document-box">
      <leftselect style="flex-shrink: 0; flex-grow: 0" :documentData="data" @productSelect="productSelect"></leftselect>
      <vat :documentData="documentData"></vat>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import leftselect from "./components/leftselect.vue";
import {data} from "./staticData/data/vat.js";
import vat from "./vat/index.vue"; 
const goBack = () => {
  router.back();
};
const router = useRouter(); 
const documentData = ref(data[0]);

const productSelect = (item) => {
  console.log(item, "item");
}
</script>
<style lang="scss" scoped>
@import './index.scss';

.document-box {
  display: flex;
}
</style>
