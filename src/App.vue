<template>
  <div id="app">
    <BottomNav v-model="currentView" />

    <Transition name="fade" mode="out-in">
      <component :is="currentComponent" :selected-category-id="selectedCategoryId" @viewCategory="handleViewCategory" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BottomNav from './components/BottomNav.vue'
import HomeView from './views/HomeView.vue'
import ExpenseView from './views/ExpenseView.vue'
import StatisticsView from './views/StatisticsView.vue'
import SettingsView from './views/SettingsView.vue'

const currentView = ref('home')
const selectedCategoryId = ref(null)

const currentComponent = computed(() => {
  switch (currentView.value) {
    case 'home':
      return HomeView
    case 'expense':
      return ExpenseView
    case 'statistics':
      return StatisticsView
    case 'settings':
      return SettingsView
    default:
      return HomeView
  }
})

const handleViewCategory = (category) => {
  // 保存选中的分类ID
  selectedCategoryId.value = category.id
  // 切换到记账页面
  currentView.value = 'expense'
}
</script>

<style>
/* 全局样式已在 main.css 中定义 */
</style>
