<template>
  <div class="category-card" @click="$emit('click')">
    <div class="card-header">
      <div class="icon-wrapper" :style="{ background: color }">
        <span class="icon">{{ icon }}</span>
      </div>
      <div class="category-info">
        <h3 class="category-name">{{ name }}</h3>
        <p class="budget-text">预算 ¥{{ budget }}</p>
      </div>
    </div>
    <div class="card-body">
      <BudgetProgress
        :total-target="budget"
        :total-received="budget"
        :total-spent="spent"
      />
    </div>

    <button
      v-if="showDelete"
      class="delete-btn"
      @click.stop="$emit('delete')"
      title="删除分类"
    >
      ×
    </button>

    <button
      v-if="showEdit"
      class="edit-btn"
      @click.stop="$emit('edit')"
      title="编辑分类"
    >
      ✏️
    </button>
  </div>
</template>

<script setup>
import BudgetProgress from './BudgetProgress.vue'

defineProps({
  icon: {
    type: String,
    default: '💰'
  },
  name: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  spent: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#FFB6C1'
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
</script>

<style scoped>
.category-card {
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.category-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
}

.category-card:active {
  transform: translateY(0);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 1;
}

.icon {
  font-size: 22px;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  letter-spacing: -0.2px;
}

.budget-text {
  font-size: 13px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.card-body {
  margin-top: var(--spacing-sm);
}

.category-card {
  position: relative;
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

.category-card:hover .delete-btn {
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

.category-card:hover .edit-btn {
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
