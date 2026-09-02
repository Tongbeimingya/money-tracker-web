<template>
  <div class="empty-state">
    <div class="emoji">{{ emoji }}</div>
    <h3 class="title">{{ title }}</h3>
    <p class="description">{{ description }}</p>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  emoji: {
    type: String,
    default: '🌸'
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: '快来添加第一条记录吧~'
  }
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
}

.emoji {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
