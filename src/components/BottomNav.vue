<template>
  <nav class="bottom-nav">
    <button
      v-for="item in navItems"
      :key="item.name"
      class="nav-item"
      :class="{ active: modelValue === item.name }"
      @click="$emit('update:modelValue', item.name)"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'home'
  }
})

defineEmits(['update:modelValue'])

const navItems = [
  { name: 'home', icon: '🏠', label: '首页' },
  { name: 'expense', icon: '✏️', label: '记账' },
  { name: 'statistics', icon: '📊', label: '统计' },
  { name: 'settings', icon: '⚙️', label: '设置' }
]
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  background: rgba(242, 242, 247, 0.94);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-top: 1px solid var(--separator);
  display: flex;
  justify-content: space-around;
  padding: var(--spacing-sm) 0;
  box-shadow: 0 -1px 0 var(--separator);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xs);
  background: transparent;
  color: var(--text-tertiary);
  transition: all 0.2s ease;
}

.nav-item.active {
  color: var(--accent-blue);
}

.nav-icon {
  font-size: 24px;
  transition: transform 0.3s ease;
}

.nav-item.active .nav-icon {
  transform: scale(1.05);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: -0.2px;
}
</style>
