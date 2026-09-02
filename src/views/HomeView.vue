<template>
  <div class="home-view">
    <!-- 周期信息提示 -->
    <div v-if="currentPeriod" class="period-banner">
      <div class="period-info">
        <span class="period-badge">{{ currentPeriod.type === 'month' ? '月度' : '自定义' }}</span>
        <span class="period-name">{{ currentPeriod.name }}</span>
      </div>
      <div v-if="currentPeriod.status === 'active'" class="period-days">
        <span class="days-count">{{ periodDaysRunning }}</span>
        <span class="days-label">天</span>
      </div>
    </div>

    <!-- 月度预算卡片 -->
    <div class="budget-card">
      <div class="budget-header">
        <h2 class="budget-title">{{ currentYearMonth }} 月度预算</h2>
        <button class="settings-btn" @click="showBudgetDialog = true">
          ⚙️
        </button>
      </div>

      <BudgetProgress
        :total-target="currentBudget?.totalTarget || 0"
        :total-received="totalAllocated"
        :total-spent="totalSpent"
      />
    </div>

    <!-- 大分类列表 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">分类管理</h3>
        <div class="header-actions">
          <button class="add-btn" @click="showAddCategoryDialog = true">
            + 添加分类
          </button>
          <button class="add-btn" @click="showAddGroupDialog = true">
            + 添加大分类
          </button>
        </div>
      </div>

      <!-- 大分类（可展开） -->
      <div v-if="currentCategoryGroups.length > 0" class="groups-section">
        <div v-for="group in currentCategoryGroups" :key="group.id" class="group-item">
          <div class="group-header" @click="toggleGroup(group.id)">
            <div class="group-title-row">
              <span class="group-icon">{{ group.icon }}</span>
              <span class="group-name">{{ group.name }}</span>
              <span class="expand-icon">{{ expandedGroups.has(group.id) ? '▼' : '▶' }}</span>
            </div>
            <div class="group-actions" @click.stop>
              <button class="icon-btn edit-btn-inline" @click="startEditGroup(group)" title="编辑">✏️</button>
              <button class="icon-btn delete-btn-inline" @click="confirmDeleteGroup(group)" title="删除">×</button>
            </div>
          </div>

          <!-- 进度条：只在收起时显示 -->
          <div v-if="!expandedGroups.has(group.id)" class="group-progress">
            <BudgetProgress
              :total-target="group.budget || 0"
              :total-received="getGroupTotalBudget(group.id)"
              :total-spent="getGroupTotalSpent(group.id)"
            />
          </div>

          <!-- 展开显示小分类 -->
          <div v-if="expandedGroups.has(group.id)" class="group-categories">
            <div v-if="getCategoriesByGroup(group.id).length === 0" class="empty-hint">
              <span>还没有小分类</span>
              <button class="add-btn-sm" @click="startAddSubCategory(group)">+ 添加</button>
            </div>
            <div v-else class="categories-grid">
              <CategoryCard
                v-for="category in getCategoriesByGroup(group.id)"
                :key="category.id"
                :icon="category.icon"
                :name="category.name"
                :budget="category.budget"
                :spent="getCategorySpent(category.id)"
                :color="category.color"
                @click="viewCategory(category)"
                @edit="startEditCategory(category)"
                @delete="confirmDeleteCategory(category)"
              />
            </div>
            <button class="add-more-btn" @click="startAddSubCategory(group)">+ 添加小分类</button>
          </div>
        </div>
      </div>

      <!-- 无分类的小分类 -->
      <div v-if="uncategorizedCategories.length > 0" class="uncategorized-section">
        <div class="subsection-header">
          <h4 class="subsection-title">未分组</h4>
        </div>
        <div class="categories-grid">
          <CategoryCard
            v-for="category in uncategorizedCategories"
            :key="category.id"
            :icon="category.icon"
            :name="category.name"
            :budget="category.budget"
            :spent="getCategorySpent(category.id)"
            :color="category.color"
            @click="viewCategory(category)"
            @edit="startEditCategory(category)"
            @delete="confirmDeleteCategory(category)"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="currentCategoryGroups.length === 0 && uncategorizedCategories.length === 0" class="empty-state">
        <EmptyState
          icon="📁"
          message="还没有分类"
          hint="点击上方按钮添加第一个分类"
        />
      </div>
    </div>

    <!-- 添加大分类对话框 -->
    <teleport to="body">
      <div v-if="showAddGroupDialog" class="dialog-overlay" @click="showAddGroupDialog = false">
        <div class="dialog" @click.stop>
          <h3 class="dialog-title">添加大分类</h3>

          <div class="form-group">
            <label>分类名称</label>
            <input
              v-model="newGroup.name"
              type="text"
              placeholder="例如：刚性支出、弹性支出"
              class="input"
            />
          </div>

          <div class="form-group">
            <label>选择图标</label>
            <IconPicker v-model="newGroup.icon" />
          </div>

          <div class="form-group">
            <label>选择颜色</label>
            <ColorPicker v-model="newGroup.color" />
          </div>

          <div class="form-group">
            <label>预算金额（可选）</label>
            <input
              v-model.number="newGroup.budget"
              type="number"
              placeholder="0"
              class="input"
              min="0"
              step="0.01"
            />
            <p class="form-hint">设置大分类的总预算目标</p>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showAddGroupDialog = false">
              取消
            </button>
            <button class="btn btn-primary" @click="handleAddGroup">
              添加
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 添加分类对话框 -->
    <teleport to="body">
      <div v-if="showAddCategoryDialog" class="dialog-overlay" @click="showAddCategoryDialog = false">
        <div class="dialog" @click.stop>
          <h3 class="dialog-title">添加分类</h3>

          <div class="form-group">
            <label>分类名称</label>
            <input
              v-model="newCategory.name"
              type="text"
              placeholder="例如：午餐、交通"
              class="input"
            />
          </div>

          <div class="form-group">
            <label>预算金额</label>
            <input
              v-model.number="newCategory.budget"
              type="number"
              placeholder="0"
              class="input"
              min="0"
              step="0.01"
            />
          </div>

          <div class="form-group">
            <label>选择图标</label>
            <IconPicker v-model="newCategory.icon" />
          </div>

          <div class="form-group">
            <label>选择颜色</label>
            <ColorPicker v-model="newCategory.color" />
          </div>

          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showAddCategoryDialog = false">
              取消
            </button>
            <button class="btn btn-primary" @click="handleAddCategory">
              添加
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 设置月度预算对话框 -->
    <teleport to="body">
      <div v-if="showBudgetDialog" class="dialog-overlay" @click="showBudgetDialog = false">
        <div class="dialog" @click.stop>
          <h3 class="dialog-title">设置月度预算</h3>

          <div class="form-group">
            <label>本月生活费目标</label>
            <input
              v-model.number="budgetTarget"
              type="number"
              placeholder="0"
              class="input"
              min="0"
              step="0.01"
            />
          </div>

          <div class="budget-info-section">
            <div class="info-row">
              <span class="info-label">已分配预算</span>
              <span class="info-value">¥{{ totalAllocated.toFixed(2) }}</span>
            </div>
            <p class="form-hint">已分配金额由所有小分类预算自动计算</p>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showBudgetDialog = false">
              取消
            </button>
            <button class="btn btn-primary" @click="handleSetBudget">
              保存
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 查看大分类详情对话框 -->
    <teleport to="body">
      <div v-if="showGroupDetailDialog" class="dialog-overlay" @click="showGroupDetailDialog = false">
        <div class="dialog dialog-large" @click.stop>
          <div class="dialog-header">
            <h3 class="dialog-title">{{ selectedGroup?.name }}</h3>
            <button class="close-btn" @click="showGroupDetailDialog = false">×</button>
          </div>

          <div class="section-header">
            <h4 class="section-subtitle">小分类</h4>
            <button class="add-btn-sm" @click="showAddSubCategoryDialog = true">
              + 添加
            </button>
          </div>

          <div v-if="groupSubCategories.length === 0" class="empty-state-sm">
            <EmptyState
              icon="📝"
              message="还没有小分类"
              hint="点击上方按钮添加"
            />
          </div>

          <div v-else class="categories-list">
            <CategoryCard
              v-for="category in groupSubCategories"
              :key="category.id"
              :icon="category.icon"
              :name="category.name"
              :budget="category.budget"
              :spent="getCategorySpent(category.id)"
              :color="category.color"
              @click="viewCategory(category)"
              @edit="startEditCategory(category)"
              @delete="confirmDeleteCategory(category)"
            />
          </div>
        </div>
      </div>
    </teleport>

    <!-- 添加子分类对话框 -->
    <teleport to="body">
      <div v-if="showAddSubCategoryDialog" class="dialog-overlay" @click="showAddSubCategoryDialog = false">
        <div class="dialog" @click.stop>
          <h3 class="dialog-title">添加小分类到「{{ selectedGroup?.name }}」</h3>

          <div class="form-group">
            <label>分类名称</label>
            <input
              v-model="newSubCategory.name"
              type="text"
              placeholder="例如：午餐、交通"
              class="input"
            />
          </div>

          <div class="form-group">
            <label>预算金额</label>
            <input
              v-model.number="newSubCategory.budget"
              type="number"
              placeholder="0"
              class="input"
              min="0"
              step="0.01"
            />
          </div>

          <div class="form-group">
            <label>选择图标</label>
            <IconPicker v-model="newSubCategory.icon" />
          </div>

          <div class="form-group">
            <label>选择颜色</label>
            <ColorPicker v-model="newSubCategory.color" />
          </div>

          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showAddSubCategoryDialog = false">
              取消
            </button>
            <button class="btn btn-primary" @click="handleAddSubCategory">
              添加
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 编辑大分类对话框 -->
    <teleport to="body">
      <div v-if="showEditGroupDialog" class="dialog-overlay" @click="showEditGroupDialog = false">
        <div class="dialog" @click.stop>
          <h3 class="dialog-title">编辑大分类</h3>

          <div class="form-group">
            <label>分类名称</label>
            <input
              v-model="editingGroup.name"
              type="text"
              placeholder="例如：刚性支出、弹性支出"
              class="input"
            />
          </div>

          <div class="form-group">
            <label>选择图标</label>
            <IconPicker v-model="editingGroup.icon" />
          </div>

          <div class="form-group">
            <label>选择颜色</label>
            <ColorPicker v-model="editingGroup.color" />
          </div>

          <div class="form-group">
            <label>预算金额（可选）</label>
            <input
              v-model.number="editingGroup.budget"
              type="number"
              placeholder="0"
              class="input"
              min="0"
              step="0.01"
            />
            <p class="form-hint">设置大分类的总预算目标</p>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showEditGroupDialog = false">
              取消
            </button>
            <button class="btn btn-primary" @click="handleUpdateGroup">
              保存
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 编辑小分类对话框 -->
    <teleport to="body">
      <div v-if="showEditCategoryDialog" class="dialog-overlay" @click="showEditCategoryDialog = false">
        <div class="dialog" @click.stop>
          <h3 class="dialog-title">编辑分类</h3>

          <div class="form-group">
            <label>分类名称</label>
            <input
              v-model="editingCategory.name"
              type="text"
              placeholder="例如：午餐、交通"
              class="input"
            />
          </div>

          <div class="form-group">
            <label>预算金额</label>
            <input
              v-model.number="editingCategory.budget"
              type="number"
              placeholder="0"
              class="input"
              min="0"
              step="0.01"
            />
          </div>

          <div class="form-group">
            <label>选择图标</label>
            <IconPicker v-model="editingCategory.icon" />
          </div>

          <div class="form-group">
            <label>选择颜色</label>
            <ColorPicker v-model="editingCategory.color" />
          </div>

          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showEditCategoryDialog = false">
              取消
            </button>
            <button class="btn btn-primary" @click="handleUpdateCategory">
              保存
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage'
import BudgetProgress from '../components/BudgetProgress.vue'
import CategoryCard from '../components/CategoryCard.vue'
import CategoryGroupCard from '../components/CategoryGroupCard.vue'
import EmptyState from '../components/EmptyState.vue'
import IconPicker from '../components/IconPicker.vue'
import ColorPicker from '../components/ColorPicker.vue'

const emit = defineEmits(['viewCategory'])
const storage = useStorage()

const {
  currentYearMonth,
  currentBudget,
  currentCategoryGroups,
  currentCategories,
  currentPeriod,
  totalSpent,
  totalTarget,
  totalAllocated,
  loadData,
  setBudgetTarget,
  addCategoryGroup,
  updateCategoryGroup,
  deleteCategoryGroup,
  getCategoriesByGroup,
  getGroupTotalBudget,
  getGroupTotalSpent,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategorySpent,
  addIncome,
} = storage

// 对话框状态
const showBudgetDialog = ref(false)
const showAddGroupDialog = ref(false)
const showAddCategoryDialog = ref(false)
const showGroupDetailDialog = ref(false)
const showAddSubCategoryDialog = ref(false)
const showEditGroupDialog = ref(false)
const showEditCategoryDialog = ref(false)

// 展开的大分类
const expandedGroups = ref(new Set())

// 选中的大分类
const selectedGroup = ref(null)

// 预算设置
const budgetTarget = ref(0)

// 新大分类数据
const newGroup = ref({
  name: '',
  icon: '📁',
  color: '#8E8E93',
  budget: 0
})

// 新分类数据
const newCategory = ref({
  name: '',
  budget: 0,
  icon: '📝',
  color: '#8E8E93'
})

// 新子分类数据
const newSubCategory = ref({
  name: '',
  budget: 0,
  icon: '📝',
  color: '#8E8E93'
})

// 编辑大分类数据
const editingGroup = ref({
  id: '',
  name: '',
  icon: '📁',
  color: '#8E8E93',
  budget: 0
})

// 编辑小分类数据
const editingCategory = ref({
  id: '',
  name: '',
  budget: 0,
  icon: '📝',
  color: '#8E8E93'
})

// 未分组的分类
const uncategorizedCategories = computed(() => {
  return currentCategories.value.filter(c => !c.groupId)
})

// 选中大分类的子分类
const groupSubCategories = computed(() => {
  if (!selectedGroup.value) return []
  return getCategoriesByGroup(selectedGroup.value.id)
})

// 周期运行天数
const periodDaysRunning = computed(() => {
  if (!currentPeriod.value) return 0
  const days = Math.floor((Date.now() - currentPeriod.value.startDate) / (1000 * 60 * 60 * 24))
  return days
})

// 切换大分类展开/收起
const toggleGroup = (groupId) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

// 开始添加子分类
const startAddSubCategory = (group) => {
  selectedGroup.value = group
  showAddSubCategoryDialog.value = true
}

// 查看大分类
const viewGroup = (group) => {
  selectedGroup.value = group
  showGroupDetailDialog.value = true
}

// 查看分类
const viewCategory = (category) => {
  emit('viewCategory', category)
}

// 确认删除大分类
const confirmDeleteGroup = (group) => {
  if (confirm(`确定要删除大分类「${group.name}」吗？这将同时删除该分类下的所有小分类和支出记录。`)) {
    deleteCategoryGroup(group.id)
  }
}

// 确认删除分类
const confirmDeleteCategory = (category) => {
  if (confirm(`确定要删除分类「${category.name}」吗？这将同时删除该分类下的所有支出记录。`)) {
    deleteCategory(category.id)
  }
}

// 设置月度预算
const handleSetBudget = () => {
  if (budgetTarget.value < 0) {
    alert('金额不能为负数')
    return
  }

  setBudgetTarget(budgetTarget.value)
  showBudgetDialog.value = false
}

// 添加大分类
const handleAddGroup = () => {
  if (!newGroup.value.name.trim()) {
    alert('请输入分类名称')
    return
  }

  addCategoryGroup(newGroup.value.name, newGroup.value.icon, newGroup.value.color, newGroup.value.budget)

  // 重置表单
  newGroup.value = {
    name: '',
    icon: '📁',
    color: '#8E8E93',
    budget: 0
  }

  showAddGroupDialog.value = false
}

// 添加分类
const handleAddCategory = () => {
  if (!newCategory.value.name.trim()) {
    alert('请输入分类名称')
    return
  }

  if (newCategory.value.budget < 0) {
    alert('预算金额不能为负数')
    return
  }

  addCategory(
    newCategory.value.name,
    newCategory.value.budget,
    newCategory.value.icon,
    newCategory.value.color,
    null // 无大分类
  )

  // 重置表单
  newCategory.value = {
    name: '',
    budget: 0,
    icon: '📝',
    color: '#8E8E93'
  }

  showAddCategoryDialog.value = false
}

// 添加子分类
const handleAddSubCategory = () => {
  if (!newSubCategory.value.name.trim()) {
    alert('请输入分类名称')
    return
  }

  if (newSubCategory.value.budget < 0) {
    alert('预算金额不能为负数')
    return
  }

  addCategory(
    newSubCategory.value.name,
    newSubCategory.value.budget,
    newSubCategory.value.icon,
    newSubCategory.value.color,
    selectedGroup.value.id
  )

  // 重置表单
  newSubCategory.value = {
    name: '',
    budget: 0,
    icon: '📝',
    color: '#8E8E93'
  }

  showAddSubCategoryDialog.value = false
}

// 开始编辑大分类
const startEditGroup = (group) => {
  editingGroup.value = {
    id: group.id,
    name: group.name,
    icon: group.icon,
    color: group.color,
    budget: group.budget || 0
  }
  showEditGroupDialog.value = true
}

// 更新大分类
const handleUpdateGroup = () => {
  if (!editingGroup.value.name.trim()) {
    alert('请输入分类名称')
    return
  }

  updateCategoryGroup(editingGroup.value.id, {
    name: editingGroup.value.name,
    icon: editingGroup.value.icon,
    color: editingGroup.value.color,
    budget: editingGroup.value.budget
  })

  showEditGroupDialog.value = false
}

// 开始编辑小分类
const startEditCategory = (category) => {
  editingCategory.value = {
    id: category.id,
    name: category.name,
    budget: category.budget,
    icon: category.icon,
    color: category.color
  }
  showEditCategoryDialog.value = true
}

// 更新小分类
const handleUpdateCategory = () => {
  if (!editingCategory.value.name.trim()) {
    alert('请输入分类名称')
    return
  }

  if (editingCategory.value.budget < 0) {
    alert('预算金额不能为负数')
    return
  }

  updateCategory(editingCategory.value.id, {
    name: editingCategory.value.name,
    budget: editingCategory.value.budget,
    icon: editingCategory.value.icon,
    color: editingCategory.value.color
  })

  showEditCategoryDialog.value = false
}

onMounted(async () => {
  await loadData()

  // 初始化预算输入框
  if (currentBudget.value) {
    budgetTarget.value = currentBudget.value.totalTarget
  }

  // 首次使用提示
  if (!currentBudget.value?.totalTarget && currentCategoryGroups.value.length === 0) {
    showBudgetDialog.value = true
  }
})
</script>

<style scoped>
.home-view {
  padding: var(--spacing-lg);
  padding-bottom: 80px;
  max-width: 1200px;
  margin: 0 auto;
}

.period-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.period-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.period-badge {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(10px);
}

.period-name {
  font-size: 15px;
  font-weight: 600;
  color: white;
}

.period-days {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.days-count {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.days-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.budget-card {
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-light);
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.budget-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.settings-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--bg-tertiary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: var(--separator);
  transform: scale(1.05);
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.section-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.add-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent-blue);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.add-btn:active {
  transform: translateY(0);
}

.add-btn-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent-blue);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn-sm:hover {
  opacity: 0.9;
}

.groups-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.group-item {
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: background 0.2s;
}

.group-header:hover {
  background: var(--bg-tertiary);
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.group-icon {
  font-size: 24px;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.expand-icon {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: auto;
}

.group-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.edit-btn-inline {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.edit-btn-inline:hover {
  background: #007AFF;
  color: white;
}

.delete-btn-inline {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.delete-btn-inline:hover {
  background: #FF3B30;
  color: white;
}

.group-progress {
  padding: 0 var(--spacing-lg) var(--spacing-md);
}

.group-categories {
  padding: var(--spacing-lg);
  background: var(--bg-tertiary);
  border-top: 1px solid var(--separator);
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  color: var(--text-tertiary);
  font-size: 14px;
}

.categories-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.add-more-btn {
  width: 100%;
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  border: 1px dashed var(--separator);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-more-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: rgba(0, 122, 255, 0.05);
}

.uncategorized-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--separator);
}

.subsection-header {
  margin-bottom: var(--spacing-lg);
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.categories-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.empty-state {
  padding: var(--spacing-2xl) 0;
}

.empty-state-sm {
  padding: var(--spacing-xl) 0;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.dialog {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-heavy);
}

.dialog-large {
  max-width: 700px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xl) 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--separator);
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-xl);
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--separator);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--accent-blue);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-hint {
  margin-top: var(--spacing-xs);
  font-size: 12px;
  color: var(--text-tertiary);
}

.budget-info-section {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-blue);
}

.dialog-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.btn {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-blue);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--separator);
}

.btn:active {
  transform: scale(0.98);
}
</style>
