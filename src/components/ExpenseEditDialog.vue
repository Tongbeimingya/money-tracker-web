<template>
  <Teleport to="body">
    <div v-if="expense" class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <h3>编辑记录 ✏️</h3>

        <div class="edit-category">
          <span class="edit-category-icon">{{ category?.icon || '💰' }}</span>
          <span class="edit-category-name">{{ category?.name || '未分类' }}</span>
        </div>

        <div class="form-group">
          <label>金额</label>
          <input
            v-model="amount"
            type="number"
            inputmode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>日期</label>
          <div class="quick-row">
            <button
              class="quick-btn"
              :class="{ active: dateValue === today }"
              @click="dateValue = today"
            >
              今天
            </button>
            <button
              class="quick-btn"
              :class="{ active: dateValue === yesterday }"
              @click="dateValue = yesterday"
            >
              昨天
            </button>
          </div>
          <input v-model="dateValue" type="date" :max="today" class="form-input" />
        </div>

        <div class="form-group">
          <label>备注</label>
          <input v-model="note" type="text" placeholder="选填" class="form-input" />
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="$emit('close')">取消</button>
          <button class="confirm-btn" :disabled="!valid" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  toDateInputValue,
  offsetDayValue,
  dateValueToTimestamp
} from '../utils/date'

const props = defineProps({
  expense: {
    type: Object,
    default: null
  },
  category: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const amount = ref('')
const note = ref('')
const dateValue = ref('')

const today = offsetDayValue(0)
const yesterday = offsetDayValue(1)

// 每次打开都按当前记录重置表单
watch(() => props.expense, (expense) => {
  if (!expense) return
  amount.value = String(expense.amount)
  note.value = expense.note || ''
  dateValue.value = toDateInputValue(expense.date)
}, { immediate: true })

const valid = computed(() => {
  const num = parseFloat(amount.value)
  return !!dateValue.value && !isNaN(num) && num > 0
})

const handleSave = () => {
  if (!props.expense || !valid.value) return

  emit('save', {
    amount: parseFloat(amount.value),
    note: note.value.trim(),
    // 只换年月日，时分秒沿用原来那笔记录的时间，免得排序被打乱
    date: dateValueToTimestamp(dateValue.value, props.expense.date)
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: var(--spacing-md);
}

.modal-content {
  background: #FFFFFF;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.edit-category {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.edit-category-icon {
  font-size: 20px;
}

.edit-category-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--separator);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: var(--accent-blue);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.quick-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.quick-btn {
  flex: 1;
  padding: var(--spacing-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-sm);
}

.quick-btn.active {
  color: var(--accent-blue);
  border-color: var(--accent-blue);
  background: rgba(0, 122, 255, 0.1);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.cancel-btn {
  flex: 1;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.confirm-btn {
  flex: 1;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  background: var(--accent-blue);
  color: #FFFFFF;
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
