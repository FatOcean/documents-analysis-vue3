import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'TaskList',
    component: () => import('../views/TaskList.vue')
  },
  {
    path: '/category',
    name: 'TaskCategory',
    component: () => import('../views/TaskCategory.vue')
  },
  {
    path: '/result',
    name: 'ParseResult',
    component: () => import('../views/ParseResult.vue')
  },
  {
    path: '/document-parsing',
    name: 'DocumentParsing',
    component: () => import('../views/tradeDocumentAnalysis/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
