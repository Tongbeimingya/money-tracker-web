<template>
  <div class="settings-view">
    <div class="settings-header">
      <h2>设置 ⚙️</h2>
    </div>

    <!-- 记账周期管理 -->
    <div class="settings-section">
      <h3>记账周期</h3>

      <!-- 当前周期信息 -->
      <div v-if="currentPeriod" class="current-period-card">
        <div class="period-header">
          <span class="period-badge">{{ currentPeriod.type === 'month' ? '月度' : '自定义' }}</span>
          <span class="period-name">{{ currentPeriod.name }}</span>
        </div>
        <div class="period-stats">
          <div class="period-stat">
            <span class="stat-label">开始时间</span>
            <span class="stat-value">{{ formatDate(currentPeriod.startDate) }}</span>
          </div>
          <div class="period-stat">
            <span class="stat-label">状态</span>
            <span class="stat-value" :class="{ active: currentPeriod.status === 'active' }">
              {{ currentPeriod.status === 'active' ? '进行中' : '已结束' }}
            </span>
          </div>
          <div v-if="currentPeriod.status === 'active' && currentPeriod.endDate === null" class="period-stat">
            <span class="stat-label">已运行</span>
            <span class="stat-value">{{ getDaysRunning(currentPeriod.startDate) }} 天</span>
          </div>
        </div>

        <!-- 周期操作按钮 -->
        <div class="period-actions">
          <button
            v-if="currentPeriod.status === 'active'"
            class="action-btn end-btn"
            @click="showEndPeriodDialog = true"
          >
            结束当前周期
          </button>
          <button class="action-btn" @click="showNewPeriodDialog = true">
            开始新周期
          </button>
        </div>
      </div>

      <!-- 历史周期列表 -->
      <div v-if="completedPeriods.length > 0" class="history-periods">
        <h4>历史周期</h4>
        <div class="period-list">
          <div
            v-for="period in completedPeriods"
            :key="period.id"
            class="period-item"
          >
            <div class="period-item-info" @click="switchToPeriod(period.id)">
              <span class="period-item-name">{{ period.name }}</span>
              <span class="period-item-date">{{ formatDateRange(period.startDate, period.endDate) }}</span>
            </div>
            <div class="period-item-actions">
              <button
                v-if="period.summary"
                class="icon-action-btn"
                @click="viewPeriodSummary(period)"
                title="查看总结"
              >
                📊
              </button>
              <button
                class="icon-action-btn reactivate"
                @click="handleReactivatePeriod(period)"
                title="重新激活"
              >
                🔄
              </button>
              <button
                class="icon-action-btn delete"
                @click="handleDeletePeriod(period)"
                title="删除周期"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预算设置 -->
    <div class="settings-section">
      <h3>预算目标</h3>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">本周期预算目标</span>
          <span class="setting-desc">设置这个周期的生活费总额</span>
        </div>
        <div class="setting-action">
          <button class="setting-btn" @click="openBudgetDialog">
            ¥{{ currentPeriod?.totalTarget || 0 }}
          </button>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-section">
      <h3>数据管理</h3>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">导出数据</span>
          <span class="setting-desc">导出所有记账数据为JSON文件</span>
        </div>
        <div class="setting-action">
          <button class="setting-btn" @click="exportData">导出</button>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">导入数据</span>
          <span class="setting-desc">从JSON文件导入记账数据（会覆盖现有数据）</span>
        </div>
        <div class="setting-action">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileSelect"
          />
          <button class="setting-btn" @click="$refs.fileInput.click()">导入</button>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">清空数据</span>
          <span class="setting-desc">删除所有记账数据（谨慎操作）</span>
        </div>
        <div class="setting-action">
          <button class="setting-btn danger" @click="clearData">清空</button>
        </div>
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-section">
      <h3>关于</h3>
      <div class="about-content">
        <p class="about-item">💰 小钱包记账本</p>
        <p class="about-item">🌸 可爱简约的记账小程序</p>
        <p class="about-item">💝 让记账变得更简单</p>
      </div>
    </div>

    <!-- 修改预算对话框 -->
    <Teleport to="body">
      <div v-if="showBudgetDialog" class="modal-overlay" @click="showBudgetDialog = false">
        <div class="modal-content" @click.stop>
          <h3>修改预算目标</h3>
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

    <!-- 新建周期对话框 -->
    <Teleport to="body">
      <div v-if="showNewPeriodDialog" class="modal-overlay" @click="showNewPeriodDialog = false">
        <div class="modal-content large" @click.stop>
          <h3>开始新周期</h3>

          <div class="form-group">
            <label>周期类型</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" value="month" v-model="newPeriod.type" />
                <span>月度周期</span>
              </label>
              <label class="radio-option">
                <input type="radio" value="custom" v-model="newPeriod.type" />
                <span>自定义周期</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>周期名称</label>
            <input
              v-model="newPeriod.name"
              type="text"
              placeholder="例如：2024年1月 或 第1次记账"
              class="text-input"
            />
          </div>

          <div class="form-group">
            <label>开始时间</label>
            <div class="date-input-group">
              <input
                v-model="newPeriod.startDate"
                type="datetime-local"
                class="text-input"
              />
              <button class="quick-btn" @click="setStartNow">立即开始</button>
            </div>
          </div>

          <div class="form-group">
            <label>预算目标（可选）</label>
            <input
              v-model.number="newPeriod.totalTarget"
              type="number"
              placeholder="例如：3000"
              class="text-input"
            />
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="showNewPeriodDialog = false">取消</button>
            <button class="confirm-btn" @click="confirmNewPeriod">开始记账</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 结束周期对话框 -->
    <Teleport to="body">
      <div v-if="showEndPeriodDialog" class="modal-overlay" @click="showEndPeriodDialog = false">
        <div class="modal-content" @click.stop>
          <h3>结束当前周期</h3>
          <p class="dialog-message">确定要结束当前记账周期吗？结束后将生成统计报告并归档。</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showEndPeriodDialog = false">取消</button>
            <button class="confirm-btn danger" @click="confirmEndPeriod">确认结束</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 周期总结对话框 -->
    <Teleport to="body">
      <div v-if="showSummaryDialog && periodSummary" class="modal-overlay" @click="showSummaryDialog = false">
        <div class="modal-content large summary-modal" @click.stop>
          <h3>📊 周期总结报告</h3>

          <div class="summary-header">
            <h4>{{ periodSummary.periodName }}</h4>
            <p class="summary-date">
              {{ formatDate(periodSummary.startDate) }} ~ {{ formatDate(periodSummary.endDate) }}
              （{{ periodSummary.days }} 天）
            </p>
          </div>

          <div class="summary-stats">
            <div class="summary-stat-item">
              <span class="stat-label">预算目标</span>
              <span class="stat-value">¥{{ periodSummary.totalTarget }}</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">已分配</span>
              <span class="stat-value income">¥{{ periodSummary.totalReceived }}</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">总支出</span>
              <span class="stat-value expense">¥{{ periodSummary.totalExpense }}</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">剩余</span>
              <span class="stat-value" :class="{ positive: periodSummary.remaining >= 0, negative: periodSummary.remaining < 0 }">
                ¥{{ periodSummary.remaining }}
              </span>
            </div>
          </div>

          <div class="summary-metrics">
            <div class="metric-card">
              <span class="metric-label">日均支出</span>
              <span class="metric-value">¥{{ periodSummary.dailyAverage }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">预算使用率</span>
              <span class="metric-value">{{ periodSummary.budgetUsageRate }}%</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">记账次数</span>
              <span class="metric-value">{{ periodSummary.expenseCount }} 笔</span>
            </div>
          </div>

          <div v-if="periodSummary.topCategory" class="summary-highlight">
            <span class="highlight-icon">🏆</span>
            <span class="highlight-text">
              最大支出分类：<strong>{{ periodSummary.topCategory.name }}</strong>
              ¥{{ periodSummary.topCategory.amount }}
            </span>
          </div>

          <div v-if="periodSummary.categoryStats.length > 0" class="summary-section">
            <h5>分类支出排行</h5>
            <div class="stats-list">
              <div
                v-for="(stat, index) in periodSummary.categoryStats.slice(0, 5)"
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
            <button class="confirm-btn" @click="showSummaryDialog = false">好的</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage'

const {
  currentPeriod,
  allPeriods,
  data,
  loadData,
  setBudgetTarget,
  createPeriod,
  endCurrentPeriod,
  switchPeriod,
  reactivatePeriod,
  deletePeriod
} = useStorage()

const showBudgetDialog = ref(false)
const showNewPeriodDialog = ref(false)
const showEndPeriodDialog = ref(false)
const showSummaryDialog = ref(false)
const budgetInput = ref(0)
const periodSummary = ref(null)

// 新周期表单
const newPeriod = ref({
  type: 'custom',
  name: '',
  startDate: '',
  totalTarget: 0
})

// 已完成的周期
const completedPeriods = computed(() => {
  return allPeriods.value.filter(p => p.status === 'completed').reverse()
})

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 格式化日期范围
const formatDateRange = (start, end) => {
  const startStr = formatDate(start)
  const endStr = end ? formatDate(end) : '进行中'
  return `${startStr} ~ ${endStr}`
}

// 计算运行天数
const getDaysRunning = (startDate) => {
  const days = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24))
  return days
}

// 设置立即开始
const setStartNow = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  newPeriod.value.startDate = `${year}-${month}-${day}T${hours}:${minutes}`
}

// 打开预算对话框
const openBudgetDialog = () => {
  budgetInput.value = currentPeriod.value?.totalTarget || 0
  showBudgetDialog.value = true
}

// 确认修改预算
const confirmBudget = () => {
  if (budgetInput.value >= 0) {
    setBudgetTarget(budgetInput.value)
    showBudgetDialog.value = false
    budgetInput.value = 0
  }
}

// 确认新建周期
const confirmNewPeriod = () => {
  if (!newPeriod.value.name.trim()) {
    alert('请输入周期名称')
    return
  }
  if (!newPeriod.value.startDate) {
    alert('请选择开始时间')
    return
  }

  // 如果当前有活跃周期，先结束它
  if (currentPeriod.value && currentPeriod.value.status === 'active') {
    endCurrentPeriod()
  }

  // 创建新周期
  createPeriod({
    type: newPeriod.value.type,
    name: newPeriod.value.name,
    startDate: new Date(newPeriod.value.startDate).getTime(),
    totalTarget: newPeriod.value.totalTarget || 0
  })

  // 重置表单
  newPeriod.value = {
    type: 'custom',
    name: '',
    startDate: '',
    totalTarget: 0
  }

  showNewPeriodDialog.value = false
  alert('新周期已开始！🎉')
}

// 确认结束周期
const confirmEndPeriod = () => {
  const summary = endCurrentPeriod()
  showEndPeriodDialog.value = false

  if (summary) {
    periodSummary.value = summary
    showSummaryDialog.value = true
  } else {
    alert('周期已结束，数据已归档')
  }
}

// 切换到历史周期
const switchToPeriod = (periodId) => {
  if (confirm('切换到这个周期会暂时查看历史数据，确定吗？')) {
    switchPeriod(periodId)
    alert('已切换到历史周期')
  }
}

// 查看周期总结
const viewPeriodSummary = (period) => {
  if (period.summary) {
    periodSummary.value = period.summary
    showSummaryDialog.value = true
  }
}

// 重新激活周期
const handleReactivatePeriod = (period) => {
  if (confirm(`确定要重新激活周期「${period.name}」吗？这将结束当前活跃的周期。`)) {
    // 如果有当前活跃周期，先结束它
    if (currentPeriod.value && currentPeriod.value.status === 'active' && currentPeriod.value.id !== period.id) {
      endCurrentPeriod()
    }
    reactivatePeriod(period.id)
    alert('周期已重新激活！')
  }
}

// 删除周期
const handleDeletePeriod = (period) => {
  if (confirm(`确定要删除周期「${period.name}」吗？这将删除该周期的所有分类和支出记录，此操作不可恢复！`)) {
    if (confirm('再次确认：真的要删除这个周期及其所有数据吗？')) {
      const success = deletePeriod(period.id)
      if (success) {
        alert('周期已删除')
      } else {
        alert('无法删除当前活跃的周期')
      }
    }
  }
}

// 导出数据
const exportData = () => {
  try {
    const dataStr = JSON.stringify(data.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `money-tracker-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('数据导出成功！💾')
  } catch (error) {
    alert('导出失败，请重试')
  }
}

// 文件输入引用
const fileInput = ref(null)

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result)
      importData(importedData)
    } catch (error) {
      alert('文件格式错误，请选择正确的JSON文件')
    }
  }
  reader.readAsText(file)

  // 重置文件输入，允许重复选择同一文件
  event.target.value = ''
}

// 导入数据
const importData = (importedData) => {
  if (!confirm('导入数据会覆盖当前所有数据，确定要继续吗？')) {
    return
  }

  try {
    // 验证数据结构
    if (!importedData || typeof importedData !== 'object') {
      throw new Error('数据格式错误')
    }

    // 保存导入的数据
    localStorage.setItem('money-tracker-data', JSON.stringify(importedData))

    alert('数据导入成功！页面即将刷新...')

    // 刷新页面以重新加载数据
    setTimeout(() => {
      window.location.reload()
    }, 500)
  } catch (error) {
    alert('导入失败：' + error.message)
  }
}

// 清空数据
const clearData = () => {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    if (confirm('再次确认：真的要清空所有数据吗？')) {
      localStorage.clear()
      alert('数据已清空')
      location.reload()
    }
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.settings-view {
  padding: var(--spacing-md);
  padding-bottom: 100px;
}

.settings-header {
  margin-bottom: var(--spacing-lg);
}

.settings-header h2 {
  font-size: 24px;
  color: var(--text-primary);
}

.settings-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.settings-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

/* 当前周期卡片 */
.current-period-card {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.period-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.period-badge {
  padding: 4px 8px;
  background: var(--accent-blue);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.period-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.period-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.period-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.active {
  color: var(--accent-green);
}

.period-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--gradient-pink);
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.4);
}

.action-btn.end-btn {
  background: linear-gradient(135deg, #FF9500, #FFB340);
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

.action-btn.end-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
}

/* 历史周期 */
.history-periods {
  margin-top: var(--spacing-lg);
}

.history-periods h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.period-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.period-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  gap: var(--spacing-sm);
}

.period-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  cursor: pointer;
  transition: opacity 0.2s;
}

.period-item-info:hover {
  opacity: 0.7;
}

.period-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.period-item-date {
  font-size: 11px;
  color: var(--text-tertiary);
}

.period-item-actions {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.icon-action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  font-size: 16px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.icon-action-btn:hover {
  transform: scale(1.1);
}

.icon-action-btn.reactivate {
  background: linear-gradient(135deg, #34C759 0%, #5DD97C 100%);
}

.icon-action-btn.delete {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF4757 100%);
}

.period-item-arrow {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--bg-primary);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.setting-action {
  margin-left: var(--spacing-md);
}

.setting-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--gradient-pink);
  color: var(--text-white);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
}

.setting-btn.danger {
  background: linear-gradient(135deg, #FF6B9D, #FF4757);
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.about-item {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
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
  max-width: 500px;
}

.modal-content h3 {
  font-size: 18px;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.dialog-message {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

/* 表单样式 */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.radio-group {
  display: flex;
  gap: var(--spacing-md);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
}

.radio-option input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.text-input,
.amount-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--bg-primary);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.text-input:focus,
.amount-input:focus {
  border-color: var(--pink);
}

.date-input-group {
  display: flex;
  gap: var(--spacing-xs);
}

.quick-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--accent-blue);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-md);
  white-space: nowrap;
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
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.confirm-btn.danger {
  background: linear-gradient(135deg, #FF6B9D, #FF4757);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
}

/* 周期总结样式 */
.summary-modal {
  max-width: 600px;
}

.summary-header {
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

.stat-rank {
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

.stat-icon {
  font-size: 18px;
}

.stat-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.stat-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--red);
}

</style>
