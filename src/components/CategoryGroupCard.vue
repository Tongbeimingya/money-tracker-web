<template>
  <div class="group-card" @click="$emit('click')">
    <div class="group-header">
      <div class="group-icon" :style="{ backgroundColor: group.color }">
        {{ group.icon }}
      </div>
      <div class="group-info">
        <h3 class="group-name">{{ group.name }}</h3>
        <p class="group-stats">
          {{ subCategoriesCount }} 个分类 · ¥{{ displayBudget.toFixed(2) }} 预算
        </p>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{
            width: progressPercent + '%',
            backgroundColor: progressColor
          }"
        />
      </div>
      <div class="progress-text">
        <span class="spent-amount">¥{{ totalSpent.toFixed(2) }}</span>
        <span class="separator">/</span>
        <span class="budget-amount">¥{{ displayBudget.toFixed(2) }}</span>
      </div>
    </div>

    <button
      v-if="showDelete"
      class="delete-btn"
      @click.stop="$emit('delete')"
      title="删除大分类"
    >
      ×
    </button>

    <button
      v-if="showEdit"
      class="edit-btn"
      @click.stop="$emit('edit')"
      title="编辑大分类"
    >
      ✏️
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  subCategoriesCount: {
    type: Number,
    default: 0
  },
  totalBudget: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  showEdit: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click', 'delete', 'edit'])

// 优先使用大分类自己的budget，如果没有则使用子分类预算之和
const displayBudget = computed(() => {
  return (props.group.budget && props.group.budget > 0) ? props.group.budget : props.totalBudget
})

const progressPercent = computed(() => {
  if (displayBudget.value === 0) return 0
  return Math.min((props.totalSpent / displayBudget.value) * 100, 100)
})

const progressColor = computed(() => {
  const percent = progressPercent.value
  if (percent >= 90) return '#FF3B30' // iOS 红色
  if (percent >= 70) return '#FF9500' // iOS 橙色
  return '#34C759' // iOS 绿色
})
</script>

<style scoped>
.group-card {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.2s;
}

.group-card:hover {
  background: var(--bg-secondary);
  border-color: var(--text-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.group-card:active {
  transform: translateY(0);
}

.group-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.group-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-stats {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.progress-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: all 0.3s ease;
}

.progress-text {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  font-size: 15px;
}

.spent-amount {
  font-weight: 600;
  color: var(--text-primary);
}

.separator {
  color: var(--text-tertiary);
}

.budget-amount {
  color: var(--text-secondary);
}

.delete-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.group-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #FF3B30;
  color: white;
  transform: scale(1.1);
}

.delete-btn:active {
  transform: scale(0.95);
}

.edit-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: calc(var(--spacing-sm) + 36px);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.group-card:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  background: #007AFF;
  color: white;
  transform: scale(1.1);
}

.edit-btn:active {
  transform: scale(0.95);
}
</style>
