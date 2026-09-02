import { ref, computed } from 'vue'

const STORAGE_KEY = 'money_tracker_data'

// 生成UUID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取当前年月（用于兼容旧数据）
function getCurrentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// 创建默认周期
function createDefaultPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  return {
    id: generateId(),
    type: 'month',
    name: `${year}年${month + 1}月`,
    startDate: new Date(year, month, 1).getTime(),
    endDate: null,  // 进行中
    status: 'active',
    totalTarget: 0,
    totalReceived: 0,
    createdAt: Date.now()
  }
}

// 初始化默认数据
function initDefaultData() {
  const period = createDefaultPeriod()
  return {
    periods: [period],
    currentPeriodId: period.id,
    categoryGroups: [],
    categories: [],
    expenseRecords: [],
    incomeRecords: []
  }
}

export function useStorage() {
  const data = ref(null)
  const currentYearMonth = ref(getCurrentYearMonth())

  // 加载数据
  const loadData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        data.value = JSON.parse(stored)

        // 数据迁移：从旧的monthlyBudgets结构迁移到新的periods结构
        if (data.value.monthlyBudgets && !data.value.periods) {
          console.log('迁移旧数据到新的周期结构...')
          migrateOldData()
        }

        // 确保有categoryGroups字段
        if (!data.value.categoryGroups) {
          data.value.categoryGroups = []
        }

        // 确保有当前活跃的周期
        if (!data.value.currentPeriodId || !getCurrentPeriod()) {
          const activePeriod = data.value.periods?.find(p => p.status === 'active')
          if (activePeriod) {
            data.value.currentPeriodId = activePeriod.id
          } else {
            // 创建新周期
            const newPeriod = createDefaultPeriod()
            if (!data.value.periods) data.value.periods = []
            data.value.periods.push(newPeriod)
            data.value.currentPeriodId = newPeriod.id
          }
        }

        saveData()
      } else {
        data.value = initDefaultData()
        saveData()
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      data.value = initDefaultData()
    }
  }

  // 迁移旧数据
  const migrateOldData = () => {
    const oldData = data.value
    const periods = []

    // 将每个月份的预算转换为周期
    if (oldData.monthlyBudgets) {
      Object.entries(oldData.monthlyBudgets).forEach(([yearMonth, budget]) => {
        const [year, month] = yearMonth.split('-').map(Number)
        const period = {
          id: `period_${yearMonth}`,
          type: 'month',
          name: `${year}年${month}月`,
          startDate: new Date(year, month - 1, 1).getTime(),
          endDate: null,
          status: yearMonth === getCurrentYearMonth() ? 'active' : 'completed',
          totalTarget: budget.totalTarget || 0,
          totalReceived: budget.totalReceived || 0,
          createdAt: budget.createdAt || Date.now()
        }
        periods.push(period)

        // 更新分类和大分类的budgetId为periodId
        if (oldData.categories) {
          oldData.categories.forEach(cat => {
            if (cat.budgetId === yearMonth) {
              cat.budgetId = period.id
            }
          })
        }
        if (oldData.categoryGroups) {
          oldData.categoryGroups.forEach(group => {
            if (group.budgetId === yearMonth) {
              group.budgetId = period.id
            }
          })
        }
        if (oldData.incomeRecords) {
          oldData.incomeRecords.forEach(income => {
            if (income.budgetId === yearMonth) {
              income.budgetId = period.id
            }
          })
        }
      })
    }

    data.value.periods = periods
    data.value.currentPeriodId = periods.find(p => p.status === 'active')?.id || periods[0]?.id
    delete data.value.monthlyBudgets
  }

  // 保存数据
  const saveData = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value))
    } catch (error) {
      console.error('保存数据失败:', error)
    }
  }

  // 获取当前周期
  const getCurrentPeriod = () => {
    if (!data.value || !data.value.currentPeriodId) return null
    return data.value.periods?.find(p => p.id === data.value.currentPeriodId) || null
  }

  // 获取当前周期（computed）
  const currentPeriod = computed(() => getCurrentPeriod())

  // 兼容旧代码：currentBudget映射到currentPeriod
  const currentBudget = computed(() => currentPeriod.value)

  // 获取当前周期的大分类
  const currentCategoryGroups = computed(() => {
    if (!data.value || !currentPeriod.value) return []
    return data.value.categoryGroups
      .filter(g => g.budgetId === currentPeriod.value.id)
      .sort((a, b) => a.order - b.order)
  })

  // 获取当前周期的分类
  const currentCategories = computed(() => {
    if (!data.value || !currentPeriod.value) return []
    return data.value.categories
      .filter(c => c.budgetId === currentPeriod.value.id)
      .sort((a, b) => a.order - b.order)
  })

  // 获取当前周期的支出记录
  const currentExpenses = computed(() => {
    if (!data.value) return []
    const categoryIds = currentCategories.value.map(c => c.id)
    return data.value.expenseRecords
      .filter(e => categoryIds.includes(e.categoryId))
      .sort((a, b) => b.date - a.date)
  })

  // 获取当前周期的收入记录
  const currentIncomes = computed(() => {
    if (!data.value || !currentPeriod.value) return []
    return data.value.incomeRecords
      .filter(i => i.budgetId === currentPeriod.value.id)
      .sort((a, b) => b.date - a.date)
  })

  // ===== 周期管理 =====

  // 创建新周期
  const createPeriod = ({ type, name, startDate, totalTarget = 0 }) => {
    if (!data.value) return null

    const period = {
      id: generateId(),
      type,
      name,
      startDate,
      endDate: null,
      status: 'active',
      totalTarget,
      totalReceived: 0,
      createdAt: Date.now()
    }

    data.value.periods.push(period)
    data.value.currentPeriodId = period.id
    saveData()
    return period
  }

  // 结束当前周期
  const endCurrentPeriod = () => {
    if (!data.value || !currentPeriod.value) return null

    // 生成周期总结
    const summary = generatePeriodSummary(currentPeriod.value.id)

    currentPeriod.value.endDate = Date.now()
    currentPeriod.value.status = 'completed'
    currentPeriod.value.summary = summary
    saveData()

    return summary
  }

  // 生成周期总结
  const generatePeriodSummary = (periodId) => {
    if (!data.value) return null

    const period = data.value.periods.find(p => p.id === periodId)
    if (!period) return null

    // 获取该周期的所有支出
    const periodExpenses = data.value.expenseRecords.filter(
      e => data.value.categories.find(c => c.id === e.categoryId)?.budgetId === periodId
    )

    // 计算总支出
    const totalExpense = periodExpenses.reduce((sum, e) => sum + e.amount, 0)

    // 按分类统计
    const categoryStats = {}
    periodExpenses.forEach(expense => {
      const category = data.value.categories.find(c => c.id === expense.categoryId)
      if (category) {
        if (!categoryStats[category.id]) {
          categoryStats[category.id] = {
            name: category.name,
            icon: category.icon,
            amount: 0,
            count: 0
          }
        }
        categoryStats[category.id].amount += expense.amount
        categoryStats[category.id].count += 1
      }
    })

    // 按大分类统计
    const groupStats = {}
    periodExpenses.forEach(expense => {
      const category = data.value.categories.find(c => c.id === expense.categoryId)
      if (category && category.groupId) {
        const group = data.value.categoryGroups.find(g => g.id === category.groupId)
        if (group) {
          if (!groupStats[group.id]) {
            groupStats[group.id] = {
              name: group.name,
              icon: group.icon,
              amount: 0,
              count: 0
            }
          }
          groupStats[group.id].amount += expense.amount
          groupStats[group.id].count += 1
        }
      }
    })

    // 计算每日平均
    const days = period.endDate
      ? Math.ceil((period.endDate - period.startDate) / (1000 * 60 * 60 * 24))
      : Math.ceil((Date.now() - period.startDate) / (1000 * 60 * 60 * 24))
    const dailyAverage = days > 0 ? totalExpense / days : 0

    // 找出最大支出分类
    const topCategory = Object.values(categoryStats)
      .sort((a, b) => b.amount - a.amount)[0] || null

    // 计算预算使用率
    const budgetUsageRate = period.totalReceived > 0
      ? (totalExpense / period.totalReceived * 100).toFixed(1)
      : 0

    return {
      periodId,
      periodName: period.name,
      startDate: period.startDate,
      endDate: period.endDate || Date.now(),
      days,
      totalTarget: period.totalTarget,
      totalReceived: period.totalReceived,
      totalExpense,
      remaining: period.totalReceived - totalExpense,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      budgetUsageRate,
      expenseCount: periodExpenses.length,
      categoryStats: Object.values(categoryStats).sort((a, b) => b.amount - a.amount),
      groupStats: Object.values(groupStats).sort((a, b) => b.amount - a.amount),
      topCategory,
      generatedAt: Date.now()
    }
  }

  // 切换周期
  const switchPeriod = (periodId) => {
    if (!data.value) return
    const period = data.value.periods.find(p => p.id === periodId)
    if (period) {
      data.value.currentPeriodId = periodId
      saveData()
    }
  }

  // 重新激活已结束的周期
  const reactivatePeriod = (periodId) => {
    if (!data.value) return
    const period = data.value.periods.find(p => p.id === periodId)
    if (period && period.status === 'completed') {
      period.status = 'active'
      period.endDate = null
      period.summary = null
      data.value.currentPeriodId = periodId
      saveData()
    }
  }

  // 删除周期（包括相关的分类和支出）
  const deletePeriod = (periodId) => {
    if (!data.value) return false

    // 不能删除当前活跃的周期
    if (data.value.currentPeriodId === periodId) {
      return false
    }

    // 删除该周期的所有分类
    const categoryIds = data.value.categories
      .filter(c => c.budgetId === periodId)
      .map(c => c.id)

    // 删除该周期的所有支出
    data.value.expenseRecords = data.value.expenseRecords.filter(
      e => !categoryIds.includes(e.categoryId)
    )

    // 删除分类
    data.value.categories = data.value.categories.filter(
      c => c.budgetId !== periodId
    )

    // 删除周期
    data.value.periods = data.value.periods.filter(p => p.id !== periodId)

    saveData()
    return true
  }

  // 获取所有周期
  const allPeriods = computed(() => {
    return data.value?.periods || []
  })

  // 获取活跃周期
  const activePeriod = computed(() => {
    return data.value?.periods.find(p => p.status === 'active') || null
  })

  // ===== 预算管理 =====

  // 设置周期预算目标
  const setBudgetTarget = (target) => {
    if (data.value && currentPeriod.value) {
      currentPeriod.value.totalTarget = target
      saveData()
    }
  }

  // 添加收入记录
  const addIncome = (amount, note = '') => {
    if (!data.value || !currentPeriod.value) return
    const income = {
      id: generateId(),
      budgetId: currentPeriod.value.id,
      amount,
      note,
      date: Date.now()
    }
    data.value.incomeRecords.push(income)
    currentPeriod.value.totalReceived += amount
    saveData()
    return income
  }

  // ===== 大分类管理 =====

  // 添加大分类
  const addCategoryGroup = (name, icon, color, budget = 0) => {
    if (!data.value || !currentPeriod.value) return
    const group = {
      id: generateId(),
      budgetId: currentPeriod.value.id,
      name,
      icon,
      color,
      budget,
      order: currentCategoryGroups.value.length,
      createdAt: Date.now()
    }
    data.value.categoryGroups.push(group)
    saveData()
    return group
  }

  // 删除大分类（同时删除该大分类下的所有小分类和支出）
  const deleteCategoryGroup = (groupId) => {
    if (!data.value) return
    // 找到该大分类下的所有小分类
    const categoryIds = data.value.categories
      .filter(c => c.groupId === groupId)
      .map(c => c.id)

    // 删除所有相关支出
    data.value.expenseRecords = data.value.expenseRecords.filter(
      e => !categoryIds.includes(e.categoryId)
    )

    // 删除所有小分类
    data.value.categories = data.value.categories.filter(c => c.groupId !== groupId)

    // 删除大分类
    const groupIndex = data.value.categoryGroups.findIndex(g => g.id === groupId)
    if (groupIndex !== -1) {
      data.value.categoryGroups.splice(groupIndex, 1)
    }

    saveData()
  }

  // 编辑大分类
  const updateCategoryGroup = (groupId, { name, icon, color, budget }) => {
    if (!data.value) return
    const group = data.value.categoryGroups.find(g => g.id === groupId)
    if (group) {
      if (name !== undefined) group.name = name
      if (icon !== undefined) group.icon = icon
      if (color !== undefined) group.color = color
      if (budget !== undefined) group.budget = budget
      saveData()
      return group
    }
  }

  // 获取大分类下的小分类
  const getCategoriesByGroup = (groupId) => {
    if (!data.value) return []
    return data.value.categories
      .filter(c => c.groupId === groupId)
      .sort((a, b) => a.order - b.order)
  }

  // 计算大分类的总预算
  const getGroupTotalBudget = (groupId) => {
    if (!data.value) return 0
    return data.value.categories
      .filter(c => c.groupId === groupId)
      .reduce((sum, c) => sum + c.budget, 0)
  }

  // 计算大分类的总支出（当前周期）
  const getGroupTotalSpent = (groupId) => {
    if (!data.value) return 0
    const categoryIds = getCategoriesByGroup(groupId).map(c => c.id)
    return currentExpenses.value
      .filter(e => categoryIds.includes(e.categoryId))
      .reduce((sum, e) => sum + e.amount, 0)
  }

  // ===== 小分类管理 =====

  // 添加分类
  const addCategory = (name, budget, icon, color, groupId = null) => {
    if (!data.value || !currentPeriod.value) return
    const category = {
      id: generateId(),
      budgetId: currentPeriod.value.id,
      groupId,
      name,
      budget,
      icon,
      color,
      order: currentCategories.value.length
    }
    data.value.categories.push(category)
    saveData()
    return category
  }

  // 编辑小分类
  const updateCategory = (categoryId, { name, budget, icon, color, groupId }) => {
    if (!data.value) return
    const category = data.value.categories.find(c => c.id === categoryId)
    if (category) {
      if (name !== undefined) category.name = name
      if (budget !== undefined) category.budget = budget
      if (icon !== undefined) category.icon = icon
      if (color !== undefined) category.color = color
      if (groupId !== undefined) category.groupId = groupId
      saveData()
      return category
    }
  }

  // 删除分类（同时删除该分类下的所有支出）
  const deleteCategory = (categoryId) => {
    if (!data.value) return
    const catIndex = data.value.categories.findIndex(c => c.id === categoryId)
    if (catIndex !== -1) {
      data.value.categories.splice(catIndex, 1)
    }
    data.value.expenseRecords = data.value.expenseRecords.filter(
      e => e.categoryId !== categoryId
    )
    saveData()
  }

  // 计算分类已花费金额（当前周期）
  const getCategorySpent = (categoryId) => {
    if (!data.value) return 0
    return currentExpenses.value
      .filter(e => e.categoryId === categoryId)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  // ===== 支出管理 =====

  // 添加支出记录
  const addExpense = (categoryId, amount, note = '') => {
    if (!data.value) return
    const expense = {
      id: generateId(),
      categoryId,
      amount,
      note,
      date: Date.now()
    }
    data.value.expenseRecords.push(expense)
    saveData()
    return expense
  }

  // 编辑支出记录
  const updateExpense = (expenseId, { amount, note }) => {
    if (!data.value) return
    const expense = data.value.expenseRecords.find(e => e.id === expenseId)
    if (expense) {
      if (amount !== undefined) expense.amount = amount
      if (note !== undefined) expense.note = note
      saveData()
      return expense
    }
  }

  // 删除支出记录
  const deleteExpense = (expenseId) => {
    if (!data.value) return
    const index = data.value.expenseRecords.findIndex(e => e.id === expenseId)
    if (index !== -1) {
      data.value.expenseRecords.splice(index, 1)
      saveData()
    }
  }

  // ===== 统计计算 =====

  // 计算总支出
  const totalSpent = computed(() => {
    return currentExpenses.value.reduce((sum, e) => sum + e.amount, 0)
  })

  // 计算本月目标（所有大分类预算之和）
  const totalTarget = computed(() => {
    return currentCategoryGroups.value.reduce((sum, g) => sum + (g.budget || 0), 0)
  })

  // 计算已分配预算（所有小分类预算之和）
  const totalAllocated = computed(() => {
    return currentCategories.value.reduce((sum, c) => sum + (c.budget || 0), 0)
  })

  // 计算可用余额
  const availableBalance = computed(() => {
    if (!currentPeriod.value) return 0
    return currentPeriod.value.totalReceived - totalAllocated.value - totalSpent.value
  })

  return {
    data,
    currentYearMonth,  // 兼容旧代码
    currentPeriod,
    currentBudget,  // 兼容旧代码，映射到currentPeriod
    currentCategoryGroups,
    currentCategories,
    currentExpenses,
    currentIncomes,
    totalSpent,
    totalTarget,
    totalAllocated,
    availableBalance,
    allPeriods,
    activePeriod,
    loadData,
    saveData,
    createPeriod,
    endCurrentPeriod,
    switchPeriod,
    setBudgetTarget,
    addIncome,
    addCategoryGroup,
    deleteCategoryGroup,
    updateCategoryGroup,
    getCategoriesByGroup,
    getGroupTotalBudget,
    getGroupTotalSpent,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategorySpent,
    addExpense,
    updateExpense,
    deleteExpense,
    currentPeriod,
    allPeriods,
    reactivatePeriod,
    deletePeriod
  }
}
