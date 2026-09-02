<template>
  <div class="statistics-view">
    <div class="stats-header">
      <h2>统计报表 📊</h2>
      <div class="month-selector">
        <span>{{ currentYearMonth }}</span>
      </div>
    </div>

    <!-- 月度概览 -->
    <div class="overview-card">
      <div class="overview-header">
        <h3>本周期概览</h3>
        <button
          v-if="currentPeriod?.summary"
          class="summary-btn"
          @click="showPeriodSummary = true"
        >
          查看总结
        </button>
      </div>
      <div class="overview-grid">
        <div class="overview-item">
          <span class="overview-label">已分配</span>
          <span class="overview-value income">¥{{ currentBudget?.totalReceived || 0 }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">已花费</span>
          <span class="overview-value expense">¥{{ totalSpent }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">剩余</span>
          <span class="overview-value remaining">¥{{ remaining }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">使用率</span>
          <span class="overview-value">{{ usageRate }}%</span>
        </div>
      </div>
    </div>

    <!-- 支出趋势图表 -->
    <div v-if="currentExpenses.length > 0" class="chart-card">
      <div class="chart-header">
        <h3>支出趋势</h3>
        <div class="time-range-selector">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            :class="['range-btn', { active: chartTimeRange === range.value }]"
            @click="chartTimeRange = range.value"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
      <BarChart :data="trendChartData" :title="trendChartTitle" />
    </div>

    <!-- 分类占比图表 -->
    <div v-if="chartData.length > 0" class="chart-card">
      <h3>分类占比</h3>
      <DonutChart :data="chartData" center-label="总支出" />
    </div>

    <!-- 分类统计 -->
    <div v-if="currentCategories.length > 0" class="category-stats-card">
      <h3>分类支出</h3>

      <!-- 按大分类分组 -->
      <div v-if="currentCategoryGroups.length > 0" class="groups-stats">
        <div v-for="group in currentCategoryGroups" :key="group.id" class="group-stat-item">
          <div class="group-stat-header" @click="toggleGroup(group.id)">
            <div class="group-stat-info">
              <span class="group-stat-icon">{{ group.icon }}</span>
              <span class="group-stat-name">{{ group.name }}</span>
              <span class="expand-icon">{{ expandedGroups.has(group.id) ? '▼' : '▶' }}</span>
            </div>
            <div class="group-stat-amounts">
              <span class="group-stat-spent">¥{{ getGroupTotalSpent(group.id) }}</span>
              <span class="group-stat-percentage">{{ getGroupPercentage(group.id) }}%</span>
            </div>
          </div>

          <!-- 大分类进度条：只在收起时显示 -->
          <div v-if="!expandedGroups.has(group.id)" class="group-stat-progress">
            <BudgetProgress
              :total-target="getGroupTotalBudget(group.id)"
              :total-received="getGroupTotalBudget(group.id)"
              :total-spent="getGroupTotalSpent(group.id)"
            />
          </div>

          <!-- 展开显示小分类统计（精简版） -->
          <div v-if="expandedGroups.has(group.id)" class="group-categories-stats-simple">
            <div
              v-for="stat in getGroupCategoryStats(group.id)"
              :key="stat.category.id"
              class="category-stat-simple"
            >
              <span class="stat-icon-simple" :style="{ background: stat.category.color }">
                {{ stat.category.icon }}
              </span>
              <span class="stat-name-simple">{{ stat.category.name }}</span>
              <div class="stat-amounts-simple">
                <span class="stat-spent-simple">¥{{ stat.spent }}</span>
                <span class="stat-percentage-simple">{{ stat.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 未分组的小分类 -->
      <div v-if="uncategorizedStats.length > 0" class="uncategorized-stats">
        <h4 class="uncategorized-title">未分组</h4>
        <div class="category-stats-simple-list">
          <div
            v-for="stat in uncategorizedStats"
            :key="stat.category.id"
            class="category-stat-simple"
          >
            <span class="stat-icon-simple" :style="{ background: stat.category.color }">
              {{ stat.category.icon }}
            </span>
            <span class="stat-name-simple">{{ stat.category.name }}</span>
            <div class="stat-amounts-simple">
              <span class="stat-spent-simple">¥{{ stat.spent }}</span>
              <span class="stat-percentage-simple">{{ stat.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近支出记录 -->
    <div v-if="currentExpenses.length > 0" class="recent-records-card">
      <h3>最近支出</h3>
      <div class="records-list">
        <div
          v-for="expense in recentExpenses"
          :key="expense.id"
          class="record-item"
        >
          <div class="record-left">
            <span class="record-icon" :style="{ background: getCategoryById(expense.categoryId)?.color }">
              {{ getCategoryById(expense.categoryId)?.icon }}
            </span>
            <div class="record-info">
              <span class="record-category">{{ getCategoryById(expense.categoryId)?.name }}</span>
              <span class="record-note" v-if="expense.note">{{ expense.note }}</span>
              <span class="record-date">{{ formatDate(expense.date) }}</span>
            </div>
          </div>
          <span class="record-amount">-¥{{ expense.amount }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="currentCategories.length === 0" class="empty-stats">
      <EmptyState
        emoji="📈"
        title="还没有数据"
        description="添加分类并记账后，这里会显示统计信息~"
      />
    </div>

    <!-- 周期总结对话框 -->
    <Teleport to="body">
      <div v-if="showPeriodSummary && currentPeriod?.summary" class="modal-overlay" @click="showPeriodSummary = false">
        <div class="modal-content large summary-modal" @click.stop>
          <h3>📊 周期总结报告</h3>

          <div class="summary-header">
            <h4>{{ currentPeriod.summary.periodName }}</h4>
            <p class="summary-date">
              {{ formatDate(currentPeriod.summary.startDate) }} ~ {{ formatDate(currentPeriod.summary.endDate) }}
              （{{ currentPeriod.summary.days }} 天）
            </p>
          </div>

          <div class="summary-stats">
            <div class="summary-stat-item">
              <span class="stat-label">预算目标</span>
              <span class="stat-value">¥{{ currentPeriod.summary.totalTarget }}</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">已分配</span>
              <span class="stat-value income">¥{{ currentPeriod.summary.totalReceived }}</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">总支出</span>
              <span class="stat-value expense">¥{{ currentPeriod.summary.totalExpense }}</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">剩余</span>
              <span class="stat-value" :class="{ positive: currentPeriod.summary.remaining >= 0, negative: currentPeriod.summary.remaining < 0 }">
                ¥{{ currentPeriod.summary.remaining }}
              </span>
            </div>
          </div>

          <div class="summary-metrics">
            <div class="metric-card">
              <span class="metric-label">日均支出</span>
              <span class="metric-value">¥{{ currentPeriod.summary.dailyAverage }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">预算使用率</span>
              <span class="metric-value">{{ currentPeriod.summary.budgetUsageRate }}%</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">记账次数</span>
              <span class="metric-value">{{ currentPeriod.summary.expenseCount }} 笔</span>
            </div>
          </div>

          <div v-if="currentPeriod.summary.topCategory" class="summary-highlight">
            <span class="highlight-icon">🏆</span>
            <span class="highlight-text">
              最大支出分类：<strong>{{ currentPeriod.summary.topCategory.name }}</strong>
              ¥{{ currentPeriod.summary.topCategory.amount }}
            </span>
          </div>

          <div v-if="currentPeriod.summary.categoryStats.length > 0" class="summary-section">
            <h5>分类支出排行</h5>
            <div class="stats-list">
              <div
                v-for="(stat, index) in currentPeriod.summary.categoryStats.slice(0, 5)"
                :key="index"
                class="stat-row"
              >
                <span class="stat-rank">{{ index + 1 }}</span>
                <span class="stat-icon">{{ stat.icon }}</span>
                <span class="stat-name">{{ stat.name }}</span>
                <span class="stat-amount">¥{{ stat.amount }}</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="confirm-btn" @click="showPeriodSummary = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage'
import BudgetProgress from '../components/BudgetProgress.vue'
import EmptyState from '../components/EmptyState.vue'
import DonutChart from '../components/DonutChart.vue'
import BarChart from '../components/BarChart.vue'

const {
  currentYearMonth,
  currentBudget,
  currentCategories,
  currentCategoryGroups,
  currentExpenses,
  currentPeriod,
  totalSpent,
  loadData,
  getCategorySpent,
  getCategoriesByGroup,
  getGroupTotalBudget,
  getGroupTotalSpent
} = useStorage()

// 展开的大分类
const expandedGroups = ref(new Set())

// 显示周期总结
const showPeriodSummary = ref(false)

// 时间范围选择
const chartTimeRange = ref('day')
const timeRanges = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'period', label: '周期' },
  { value: 'month', label: '月' }
]

// 剩余金额
const remaining = computed(() => {
  if (!currentBudget.value) return 0
  return currentBudget.value.totalReceived - totalSpent.value
})

// 使用率
const usageRate = computed(() => {
  if (!currentBudget.value || currentBudget.value.totalReceived === 0) return 0
  return Math.round((totalSpent.value / currentBudget.value.totalReceived) * 100)
})

// 切换大分类展开/收起
const toggleGroup = (groupId) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

// 获取大分类的百分比
const getGroupPercentage = (groupId) => {
  if (totalSpent.value === 0) return 0
  const groupSpent = getGroupTotalSpent(groupId)
  return Math.round((groupSpent / totalSpent.value) * 100)
}

// 获取大分类下的小分类统计
const getGroupCategoryStats = (groupId) => {
  const categories = getCategoriesByGroup(groupId)
  return categories.map(category => {
    const spent = getCategorySpent(category.id)
    const percentage = totalSpent.value > 0
      ? Math.round((spent / totalSpent.value) * 100)
      : 0
    return {
      category,
      spent,
      percentage
    }
  }).sort((a, b) => b.spent - a.spent)
}

// 未分组的小分类统计
const uncategorizedStats = computed(() => {
  const uncategorized = currentCategories.value.filter(c => !c.groupId)
  return uncategorized.map(category => {
    const spent = getCategorySpent(category.id)
    const percentage = totalSpent.value > 0
      ? Math.round((spent / totalSpent.value) * 100)
      : 0
    return {
      category,
      spent,
      percentage
    }
  }).sort((a, b) => b.spent - a.spent)
})

// 分类统计（已废弃，保留用于兼容）
const categoryStats = computed(() => {
  return currentCategories.value.map(category => {
    const spent = getCategorySpent(category.id)
    const percentage = totalSpent.value > 0
      ? Math.round((spent / totalSpent.value) * 100)
      : 0

    return {
      category,
      spent,
      percentage
    }
  }).sort((a, b) => b.spent - a.spent)
})

// 最近10条支出记录
const recentExpenses = computed(() => {
  return currentExpenses.value.slice(0, 10)
})

// 根据ID获取分类
const getCategoryById = (categoryId) => {
  return currentCategories.value.find(c => c.id === categoryId)
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}月${day}日 ${hours}:${minutes}`
}

// 环形图数据：分类占比
const chartData = computed(() => {
  const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55']
  return currentCategories.value
    .map((category, index) => {
      const spent = getCategorySpent(category.id)
      const percentage = totalSpent.value > 0 ? Math.round((spent / totalSpent.value) * 100) : 0
      return {
        label: category.name,
        value: spent,
        color: category.color || colors[index % colors.length],
        percentage
      }
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8) // 只显示前8个
})

// 柱状图数据：每日支出
const dailyExpenseData = computed(() => {
  // 获取本月的天数
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 初始化每日数据
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
    label: `${i + 1}日`,
    value: 0
  }))

  // 统计每日支出
  currentExpenses.value.forEach(expense => {
    const expenseDate = new Date(expense.date)
    if (expenseDate.getMonth() === month && expenseDate.getFullYear() === year) {
      const day = expenseDate.getDate() - 1
      dailyData[day].value += expense.amount
    }
  })

  return dailyData
})

// 周支出数据
const weeklyExpenseData = computed(() => {
  const now = new Date()
  const currentWeek = getWeekNumber(now)
  const year = now.getFullYear()

  // 获取本月有多少周
  const firstDay = new Date(year, now.getMonth(), 1)
  const lastDay = new Date(year, now.getMonth() + 1, 0)
  const firstWeek = getWeekNumber(firstDay)
  const lastWeek = getWeekNumber(lastDay)

  const weekCount = lastWeek - firstWeek + 1
  const weeklyData = Array.from({ length: weekCount }, (_, i) => ({
    label: `第${firstWeek + i}周`,
    value: 0
  }))

  currentExpenses.value.forEach(expense => {
    const expenseDate = new Date(expense.date)
    if (expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === year) {
      const week = getWeekNumber(expenseDate)
      const index = week - firstWeek
      if (index >= 0 && index < weekCount) {
        weeklyData[index].value += expense.amount
      }
    }
  })

  return weeklyData
})

// 周期支出数据（如果有周期的话）
const periodExpenseData = computed(() => {
  if (!currentPeriod.value) return []

  const startDate = new Date(currentPeriod.value.startDate)
  const endDate = currentPeriod.value.endDate
    ? new Date(currentPeriod.value.endDate)
    : new Date()

  // 计算周期天数
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

  // 如果周期少于15天，按天显示；否则按周显示
  if (days <= 15) {
    const periodData = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      return {
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        value: 0
      }
    })

    currentExpenses.value.forEach(expense => {
      const expenseDate = new Date(expense.date)
      if (expenseDate >= startDate && expenseDate <= endDate) {
        const dayIndex = Math.floor((expenseDate - startDate) / (1000 * 60 * 60 * 24))
        if (dayIndex >= 0 && dayIndex < days) {
          periodData[dayIndex].value += expense.amount
        }
      }
    })

    return periodData
  } else {
    // 按周显示
    const weeks = Math.ceil(days / 7)
    const periodData = Array.from({ length: weeks }, (_, i) => ({
      label: `第${i + 1}周`,
      value: 0
    }))

    currentExpenses.value.forEach(expense => {
      const expenseDate = new Date(expense.date)
      if (expenseDate >= startDate && expenseDate <= endDate) {
        const dayIndex = Math.floor((expenseDate - startDate) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(dayIndex / 7)
        if (weekIndex >= 0 && weekIndex < weeks) {
          periodData[weekIndex].value += expense.amount
        }
      }
    })

    return periodData
  }
})

// 月支出数据（最近6个月）
const monthlyExpenseData = computed(() => {
  const now = new Date()
  const monthlyData = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()

    monthlyData.push({
      label: `${month + 1}月`,
      value: 0
    })
  }

  currentExpenses.value.forEach(expense => {
    const expenseDate = new Date(expense.date)
    const year = expenseDate.getFullYear()
    const month = expenseDate.getMonth()

    const targetDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    if (expenseDate >= targetDate) {
      const monthDiff = (year - targetDate.getFullYear()) * 12 + (month - targetDate.getMonth())
      if (monthDiff >= 0 && monthDiff < 6) {
        monthlyData[monthDiff].value += expense.amount
      }
    }
  })

  return monthlyData
})

// 根据选择的时间范围返回对应的图表数据
const trendChartData = computed(() => {
  switch (chartTimeRange.value) {
    case 'day':
      return dailyExpenseData.value
    case 'week':
      return weeklyExpenseData.value
    case 'period':
      return periodExpenseData.value
    case 'month':
      return monthlyExpenseData.value
    default:
      return dailyExpenseData.value
  }
})

// 图表标题
const trendChartTitle = computed(() => {
  switch (chartTimeRange.value) {
    case 'day':
      return '每日支出'
    case 'week':
      return '每周支出'
    case 'period':
      return '周期支出'
    case 'month':
      return '每月支出'
    default:
      return '支出趋势'
  }
})

// 计算周数（ISO周）
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.statistics-view {
  padding: var(--spacing-md);
  padding-bottom: 100px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.stats-header h2 {
  font-size: 24px;
  color: var(--text-primary);
}

.month-selector {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-blue);
}

.overview-card {
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.overview-card h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  margin: 0;
}

.summary-btn {
  padding: 6px 12px;
  background: var(--accent-blue);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  transition: opacity 0.2s;
}

.summary-btn:hover {
  opacity: 0.8;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overview-label {
  font-size: 13px;
  color: var(--text-tertiary);
}

.overview-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.overview-value.income {
  color: var(--accent-green);
}

.overview-value.expense {
  color: var(--text-primary);
}

.overview-value.remaining {
  color: var(--accent-blue);
}

.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.chart-card h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  margin: 0;
}

.time-range-selector {
  display: flex;
  gap: var(--spacing-xs);
  background: var(--bg-primary);
  padding: 4px;
  border-radius: var(--radius-md);
}

.range-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.range-btn.active {
  background: var(--gradient-pink);
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.category-stats-card {
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.category-stats-card h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.3px;
}

.category-stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.groups-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.group-stat-item {
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.group-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  cursor: pointer;
  transition: background 0.2s;
}

.group-stat-header:hover {
  background: var(--bg-tertiary);
}

.group-stat-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.group-stat-icon {
  font-size: 24px;
}

.group-stat-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.expand-icon {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: var(--spacing-sm);
}

.group-stat-amounts {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.group-stat-spent {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.group-stat-percentage {
  font-size: 13px;
  color: var(--text-tertiary);
}

.group-stat-progress {
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.group-categories-stats-simple {
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-top: 1px solid var(--separator);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.category-stat-simple {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.category-stat-simple:hover {
  background: var(--bg-primary);
}

.stat-icon-simple {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.stat-name-simple {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.stat-amounts-simple {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-spent-simple {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-percentage-simple {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  min-width: 36px;
  text-align: right;
}

.category-stats-simple-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.group-categories-stats {
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-top: 1px solid var(--separator);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-stat-item-sub {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stat-header-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.uncategorized-stats {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--separator);
}

.uncategorized-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md) 0;
}

.category-stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 1;
}

.stat-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.stat-amounts {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-spent {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-percentage {
  font-size: 12px;
  color: var(--text-tertiary);
}

.recent-records-card {
  background: var(--bg-secondary);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.recent-records-card h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.3px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--separator);
}

.record-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  opacity: 1;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-category {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.record-note {
  font-size: 13px;
  color: var(--text-secondary);
}

.record-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.record-amount {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
}

/* 模态框样式 */
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
  z-index: 1000;
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

.modal-content.large {
  max-width: 600px;
}

.modal-content h3 {
  font-size: 18px;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.summary-modal .summary-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--bg-primary);
}

.summary-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.summary-date {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.summary-stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.summary-stat-item .stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.summary-stat-item .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-stat-item .stat-value.income {
  color: var(--accent-green);
}

.summary-stat-item .stat-value.expense {
  color: var(--red);
}

.summary-stat-item .stat-value.positive {
  color: var(--accent-green);
}

.summary-stat-item .stat-value.negative {
  color: var(--red);
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.metric-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent-blue);
}

.summary-highlight {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.highlight-icon {
  font-size: 24px;
}

.highlight-text {
  font-size: 14px;
  color: var(--text-primary);
}

.highlight-text strong {
  color: var(--accent-orange);
  font-weight: 700;
}

.summary-section {
  margin-bottom: var(--spacing-lg);
}

.summary-section h5 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.stat-row .stat-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-blue);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 50%;
}

.stat-row .stat-icon {
  font-size: 18px;
}

.stat-row .stat-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.stat-row .stat-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--red);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.confirm-btn {
  flex: 1;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  background: var(--gradient-pink);
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

</style>
