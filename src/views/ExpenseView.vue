<template>
  <div class="expense-view">
    <div class="expense-header">
      <h2>记一笔 ✏️</h2>
    </div>

    <!-- 选择分类 -->
    <div v-if="currentCategories.length === 0" class="no-categories">
      <EmptyState
        emoji="😊"
        title="还没有分类"
        description="请先在首页添加分类，然后就可以记账啦~"
      />
    </div>

    <div v-else class="expense-form">
      <!-- 分类选择器 -->
      <div class="category-selector">
        <h3>选择分类</h3>
        <div class="category-chips">
          <button
            v-for="category in currentCategories"
            :key="category.id"
            class="category-chip"
            :class="{ selected: selectedCategory?.id === category.id }"
            :style="{
              background: selectedCategory?.id === category.id ? category.color : 'transparent',
              borderColor: category.color
            }"
            @click="selectedCategory = category"
          >
            <span class="chip-icon">{{ category.icon }}</span>
            <span class="chip-name">{{ category.name }}</span>
          </button>
        </div>
      </div>

      <!-- 金额输入 -->
      <div class="amount-section">
        <div class="amount-display">
          <span class="currency">¥</span>
          <span class="amount">{{ displayAmount }}</span>
        </div>
        <div class="number-keyboard">
          <button
            v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫']"
            :key="num"
            class="key-btn"
            :class="{ backspace: num === '⌫', dot: num === '.' }"
            @click="handleKeyPress(num)"
          >
            {{ num }}
          </button>
        </div>
      </div>

      <!-- 备注输入 -->
      <div class="note-section">
        <input
          v-model="note"
          type="text"
          placeholder="添加备注（今天吃了什么呀~）"
          class="note-input"
        />
      </div>

      <!-- 确认按钮 -->
      <button
        class="confirm-btn"
        :disabled="!selectedCategory || !amount || amount === '0'"
        @click="confirmExpense"
      >
        确认记账
      </button>
    </div>

    <!-- 最近记录 -->
    <div v-if="currentExpenses.length > 0" class="recent-expenses">
      <h3>最近记录</h3>
      <div class="expense-list">
        <div
          v-for="expense in recentExpenses"
          :key="expense.id"
          class="expense-item"
        >
          <div class="expense-info">
            <span class="expense-icon">{{ getCategoryById(expense.categoryId)?.icon }}</span>
            <div class="expense-details">
              <span class="expense-category">{{ getCategoryById(expense.categoryId)?.name }}</span>
              <span class="expense-note" v-if="expense.note">{{ expense.note }}</span>
              <span class="expense-time">{{ formatTime(expense.date) }}</span>
            </div>
          </div>
          <div class="expense-amount-wrapper">
            <span class="expense-amount">¥{{ expense.amount }}</span>
            <button class="delete-btn" @click="handleDelete(expense.id)">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStorage } from '../composables/useStorage'
import EmptyState from '../components/EmptyState.vue'

const props = defineProps({
  selectedCategoryId: {
    type: String,
    default: null
  }
})

const {
  currentCategories,
  currentExpenses,
  loadData,
  addExpense,
  deleteExpense
} = useStorage()

const selectedCategory = ref(null)
const amount = ref('')
const note = ref('')

// 显示金额
const displayAmount = computed(() => {
  return amount.value || '0'
})

// 最近5条记录
const recentExpenses = computed(() => {
  return currentExpenses.value.slice(0, 5)
})

// 根据ID获取分类
const getCategoryById = (categoryId) => {
  return currentCategories.value.find(c => c.id === categoryId)
}

// 处理数字键盘
const handleKeyPress = (key) => {
  if (key === '⌫') {
    amount.value = amount.value.slice(0, -1)
  } else if (key === '.') {
    if (!amount.value.includes('.')) {
      amount.value += '.'
    }
  } else {
    // 限制小数点后两位
    if (amount.value.includes('.')) {
      const [integer, decimal] = amount.value.split('.')
      if (decimal.length < 2) {
        amount.value += key
      }
    } else {
      amount.value += key
    }
  }
}

// 确认记账
const confirmExpense = () => {
  if (!selectedCategory.value || !amount.value || amount.value === '0') return

  const numAmount = parseFloat(amount.value)
  if (isNaN(numAmount) || numAmount <= 0) return

  addExpense(selectedCategory.value.id, numAmount, note.value)

  // 重置表单
  amount.value = ''
  note.value = ''

  // 显示成功提示
  alert('记账成功！💰')
}

// 删除记录
const handleDelete = (expenseId) => {
  if (confirm('确定要删除这条记录吗？')) {
    deleteExpense(expenseId)
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`

  return `${date.getMonth() + 1}/${date.getDate()}`
}

onMounted(async () => {
  await loadData()

  // 如果有传入的categoryId，预选该分类
  if (props.selectedCategoryId) {
    const category = currentCategories.value.find(c => c.id === props.selectedCategoryId)
    if (category) {
      selectedCategory.value = category
      return
    }
  }

  // 否则默认选中第一个分类
  if (currentCategories.value.length > 0) {
    selectedCategory.value = currentCategories.value[0]
  }
})

// 监听selectedCategoryId变化
watch(() => props.selectedCategoryId, (newId) => {
  if (newId) {
    const category = currentCategories.value.find(c => c.id === newId)
    if (category) {
      selectedCategory.value = category
    }
  }
})
</script>

<style scoped>
.expense-view {
  padding: var(--spacing-md);
  padding-bottom: 100px;
}

.expense-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.expense-header h2 {
  font-size: 24px;
  color: var(--text-primary);
}

.expense-form {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.category-selector {
  margin-bottom: var(--spacing-lg);
}

.category-selector h3 {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.category-chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.category-chip.selected {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
  transform: scale(1.02);
}

.chip-icon {
  font-size: 18px;
}

.chip-name {
  font-size: 14px;
  font-weight: 500;
}

.amount-section {
  margin-bottom: var(--spacing-lg);
}

.amount-display {
  text-align: center;
  padding: var(--spacing-lg) 0;
  margin-bottom: var(--spacing-md);
}

.currency {
  font-size: 32px;
  color: var(--text-secondary);
  margin-right: var(--spacing-xs);
}

.amount {
  font-size: 48px;
  font-weight: 600;
  color: var(--text-primary);
}

.number-keyboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  max-width: 300px;
  margin: 0 auto;
}

.key-btn {
  aspect-ratio: 1;
  font-size: 24px;
  font-weight: 500;
  background: var(--bg-tertiary);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.key-btn:hover {
  background: var(--separator);
}

.key-btn:active {
  background: var(--separator);
  transform: scale(0.95);
}

.key-btn.backspace {
  background: var(--accent-red);
  color: white;
}

.note-section {
  margin-bottom: var(--spacing-lg);
}

.note-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--separator);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.note-input:focus {
  border-color: var(--accent-blue);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.confirm-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--accent-blue);
  color: white;
  font-size: 17px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.confirm-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.recent-expenses {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.recent-expenses h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.expense-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--separator);
}

.expense-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.expense-icon {
  font-size: 24px;
}

.expense-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.expense-category {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.expense-note {
  font-size: 12px;
  color: var(--text-secondary);
}

.expense-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.expense-amount-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.expense-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.delete-btn {
  background: transparent;
  font-size: 18px;
  padding: var(--spacing-xs);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.delete-btn:hover {
  opacity: 1;
}
</style>
