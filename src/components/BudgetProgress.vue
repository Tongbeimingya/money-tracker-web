<template>
  <div class="budget-progress">
    <!-- 预算总览信息 -->
    <div class="budget-summary">
      <div class="budget-item">
        <span class="item-label">本月目标</span>
        <span class="item-value">¥{{ totalTarget.toFixed(2) }}</span>
      </div>
      <div class="budget-item">
        <span class="item-label">已分配</span>
        <span class="item-value accent">¥{{ totalReceived.toFixed(2) }}</span>
      </div>
      <div class="budget-item">
        <span class="item-label">已花费</span>
        <span class="item-value spent">¥{{ totalSpent.toFixed(2) }}</span>
      </div>
      <div class="budget-item">
        <span class="item-label">剩余可用</span>
        <span class="item-value remaining" :style="{ color: remainingColor }">¥{{ remaining.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 使用率进度条 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">使用率（已花费 / 本月目标）</span>
        <span class="progress-percentage">{{ usagePercentage.toFixed(1) }}%</span>
      </div>
      <div class="progress-bar-container">
        <div
          class="progress-bar"
          :style="progressStyle"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalTarget: { type: Number, default: 0 },
  totalReceived: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
})

// 剩余可用金额 = 本月目标 - 已花费
const remaining = computed(() => {
  return props.totalTarget - props.totalSpent
})

// 使用率 = 已花费 / 本月目标
const usagePercentage = computed(() => {
  if (!props.totalTarget || props.totalTarget === 0) return 0
  return Math.min((props.totalSpent / props.totalTarget) * 100, 100)
})

// 剩余金额的颜色
const remainingColor = computed(() => {
  if (remaining.value < 0) return '#FF3B30'
  if (remaining.value < props.totalTarget * 0.2) return '#FF9500'
  return '#34C759'
})

// 进度条样式
const progressStyle = computed(() => {
  const percent = usagePercentage.value
  let gradient
  if (percent >= 100) {
    gradient = 'linear-gradient(90deg, #FF3B30 0%, #FF6B6B 100%)'
  } else if (percent >= 80) {
    gradient = 'linear-gradient(90deg, #FF9500 0%, #FFB340 100%)'
  } else {
    gradient = 'linear-gradient(90deg, #34C759 0%, #5DD97C 100%)'
  }

  return {
    width: `${percent}%`,
    background: gradient
  }
})
</script>

<style scoped>
.budget-progress {
  width: 100%;
}

.budget-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.item-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.item-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.item-value.accent {
  color: var(--accent-blue);
}

.item-value.spent {
  color: var(--text-secondary);
}

.item-value.remaining {
  font-size: 18px;
  font-weight: 700;
}

.progress-section {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.progress-label {
  font-size: 13px;
  color: var(--text-tertiary);
}

.progress-percentage {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
