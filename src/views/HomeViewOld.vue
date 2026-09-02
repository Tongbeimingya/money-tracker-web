<template>
  <div class="home-view">
    <!-- 月度预算总览卡片 -->
    <div class="budget-overview" v-if="currentBudget">
      <div class="overview-header">
        <h2>{{ currentYearMonth }} 💰</h2>
        <button class="add-income-btn" @click="showIncomeDialog = true">
          + 到账
        </button>
      </div>

      <div class="overview-content">
        <div class="stat-item">
          <span class="stat-label">目标金额</span>
          <span class="stat-value">¥{{ currentBudget.totalTarget || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已到账</span>
          <span class="stat-value">¥{{ currentBudget.totalReceived || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已花费</span>
          <span class="stat-value danger">¥{{ totalSpent }}</span>
        </div>
        <div class="stat-item highlight">
          <span class="stat-label">剩余</span>
          <span class="stat-value big">¥{{ remaining }}</span>
        </div>
      </div>

      <!-- 首次使用提示 -->
      <div v-if="currentBudget.totalTarget === 0" class="setup-hint">
        <p>💡 还没设置本月预算哦~</p>
        <button class="setup-btn" @click="showBudgetDialog = true">
          立即设置
        </button>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="categories-section">
      <div class="section-header">
        <h3>分类预算</h3>
        <button class="add-btn" @click="showCategoryDialog = true">
          + 添加分类
        </button>
      </div>

      <div v-if="currentCategories.length === 0" class="empty-categories">
        <EmptyState
          emoji="📝"
          title="还没有分类"
          description="添加分类来管理你的支出吧~"
        >
          <button class="primary-btn" @click="showCategoryDialog = true">
            添加第一个分类
          </button>
        </EmptyState>
      </div>

      <div v-else class="categories-grid">
        <CategoryCard
          v-for="category in currentCategories"
          :key="category.id"
          :icon="category.icon"
          :name="category.name"
          :budget="category.budget"
          :spent="getCategorySpent(category.id)"
          :color="category.color"
          @click="viewCategory(category)"
        />
      </div>
    </div>

    <!-- 设置预算对话框 -->
    <Teleport to="body">
      <div v-if="showBudgetDialog" class="modal-overlay" @click="showBudgetDialog = false">
        <div class="modal-content" @click.stop>
          <h3>设置本月预算目标</h3>
          <input
            v-model.number="budgetInput"
            type="number"
            placeholder="请输入金额"
            class="amount-input"
          />
          <div class="modal-actions">
            <button class="cancel-btn" @click="showBudgetDialog = false">取消</button>
            <button class="confirm-btn" @click="confirmBudget">确定</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 添加收入对话框 -->
    <Teleport to="body">
      <div v-if="showIncomeDialog" class="modal-overlay" @click="showIncomeDialog = false">
        <div class="modal-content" @click.stop>
          <h3>记录到账</h3>
          <input
            v-model.number="incomeAmount"
            type="number"
            placeholder="到账金额"
            class="amount-input"
          />
          <input
            v-model="incomeNote"
            type="text"
            placeholder="备注（如：第一周生活费）"
            class="note-input"
          />
          <div class="modal-actions">
            <button class="cancel-btn" @click="showIncomeDialog = false">取消</button>
            <button class="confirm-btn" @click="confirmIncome">确定</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 添加分类对话框 -->
    <Teleport to="body">
      <div v-if="showCategoryDialog" class="modal-overlay" @click="showCategoryDialog = false">
        <div class="modal-content" @click.stop>
          <h3>添加分类</h3>

          <div class="form-group">
            <label>选择图标</label>
            <div class="icon-grid">
              <button
                v-for="icon in availableIcons"
                :key="icon"
                class="icon-btn"
                :class="{ selected: categoryIcon === icon }"
                @click="categoryIcon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>选择颜色</label>
            <div class="color-grid">
              <button
                v-for="color in availableColors"
                :key="color"
                class="color-btn"
                :class="{ selected: categoryColor === color }"
                :style="{ background: color }"
                @click="categoryColor = color"
              ></button>
            </div>
          </div>

          <input
            v-model="categoryName"
            type="text"
            placeholder="分类名称（如：餐饮）"
            class="text-input"
          />
          <input
            v-model.number="categoryBudget"
            type="number"
            placeholder="分配预算"
            class="amount-input"
          />

          <div class="modal-actions">
            <button class="cancel-btn" @click="showCategoryDialog = false">取消</button>
            <button class="confirm-btn" @click="confirmCategory">确定</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage'
import CategoryCard from '../components/CategoryCard.vue'
import EmptyState from '../components/EmptyState.vue'

const {
  currentYearMonth,
  currentBudget,
  currentCategories,
  totalSpent,
  totalAllocated,
  loadData,
  setBudgetTarget,
  addIncome,
  addCategory,
  getCategorySpent
} = useStorage()

const emit = defineEmits(['viewCategory'])

// 对话框状态
const showBudgetDialog = ref(false)
const showIncomeDialog = ref(false)
const showCategoryDialog = ref(false)

// 表单数据
const budgetInput = ref(0)
const incomeAmount = ref(0)
const incomeNote = ref('')
const categoryName = ref('')
const categoryBudget = ref(0)
const categoryIcon = ref('💰')
const categoryColor = ref('#FFB6C1')

// 可选图标
const availableIcons = ['🍜', '🚌', '🎮', '🛒', '🏠', '💊', '📚', '👕', '✈️', '🎬']

// 可选颜色
const availableColors = ['#FFB6C1', '#E6E6FA', '#98FF98', '#FFDAB9', '#87CEEB']

// 计算剩余金额
const remaining = computed(() => {
  if (!currentBudget.value) return 0
  return currentBudget.value.totalReceived - totalSpent.value
})

// 确认设置预算
const confirmBudget = () => {
  if (budgetInput.value > 0) {
    setBudgetTarget(budgetInput.value)
    showBudgetDialog.value = false
    budgetInput.value = 0
  }
}

// 确认添加收入
const confirmIncome = () => {
  if (incomeAmount.value > 0) {
    addIncome(incomeAmount.value, incomeNote.value)
    showIncomeDialog.value = false
    incomeAmount.value = 0
    incomeNote.value = ''
  }
}

// 确认添加分类
const confirmCategory = () => {
  if (categoryName.value && categoryBudget.value > 0) {
    addCategory(categoryName.value, categoryBudget.value, categoryIcon.value, categoryColor.value)
    showCategoryDialog.value = false
    categoryName.value = ''
    categoryBudget.value = 0
    categoryIcon.value = '💰'
    categoryColor.value = '#FFB6C1'
  }
}

// 查看分类详情
const viewCategory = (category) => {
  emit('viewCategory', category)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-view {
  padding: var(--spacing-md);
  padding-bottom: 100px;
}

.budget-overview {
  background: var(--gradient-purple);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.overview-header h2 {
  font-size: 20px;
  color: var(--text-white);
}

.add-income-btn {
  background: rgba(255, 255, 255, 0.3);
  color: var(--text-white);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
}

.overview-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item.highlight {
  grid-column: span 2;
  background: rgba(255, 255, 255, 0.2);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-white);
}

.stat-value.big {
  font-size: 28px;
}

.stat-value.danger {
  color: var(--coral);
}

.setup-hint {
  margin-top: var(--spacing-md);
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.setup-hint p {
  color: var(--text-white);
  margin-bottom: var(--spacing-sm);
}

.setup-btn {
  background: var(--text-white);
  color: var(--lavender-dark);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.categories-section {
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-header h3 {
  font-size: 18px;
  color: var(--text-primary);
}

.add-btn {
  background: var(--gradient-pink);
  color: var(--text-white);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
}

.categories-grid {
  display: grid;
  gap: var(--spacing-md);
}

.primary-btn {
  margin-top: var(--spacing-md);
  background: var(--gradient-pink);
  color: var(--text-white);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.modal-content h3 {
  font-size: 18px;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-sm);
}

.icon-btn {
  aspect-ratio: 1;
  font-size: 24px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.icon-btn.selected {
  background: var(--gradient-pink);
  transform: scale(1.1);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-sm);
}

.color-btn {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid transparent;
  transition: all 0.3s ease;
}

.color-btn.selected {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.text-input,
.amount-input,
.note-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--bg-primary);
  border-radius: var(--radius-md);
  font-size: 16px;
  margin-bottom: var(--spacing-md);
  transition: border-color 0.3s ease;
}

.text-input:focus,
.amount-input:focus,
.note-input:focus {
  border-color: var(--pink);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
}

.cancel-btn {
  background: var(--bg-primary);
  color: var(--text-secondary);
}

.confirm-btn {
  background: var(--gradient-pink);
  color: var(--text-white);
}
</style>
