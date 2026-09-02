<template>
  <div class="bar-chart">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span class="chart-total">¥{{ total.toFixed(0) }}</span>
    </div>

    <div class="chart-container">
      <div class="y-axis">
        <span class="y-label" v-for="label in yLabels" :key="label">¥{{ label }}</span>
      </div>

      <div class="bars-container">
        <div
          v-for="(item, index) in dataWithPercentage"
          :key="index"
          class="bar-wrapper"
        >
          <div class="bar-column">
            <span class="bar-value-top" v-if="item.value > 0">¥{{ item.value }}</span>
            <div
              class="bar"
              :style="{
                height: `${item.percentage}%`,
                background: getBarColor(item.value)
              }"
            >
            </div>
          </div>
          <span class="bar-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    // [{label: '1日', value: 100}]
  },
  title: {
    type: String,
    default: '支出趋势'
  }
})

const total = computed(() => {
  return props.data.reduce((sum, item) => sum + item.value, 0)
})

const maxValue = computed(() => {
  const max = Math.max(...props.data.map(item => item.value))
  return max > 0 ? max : 100
})

const yLabels = computed(() => {
  const max = maxValue.value
  const step = Math.ceil(max / 4)
  return [max, Math.floor(max * 0.75), Math.floor(max * 0.5), Math.floor(max * 0.25), 0].reverse()
})

const dataWithPercentage = computed(() => {
  return props.data.map(item => ({
    ...item,
    percentage: maxValue.value > 0 ? (item.value / maxValue.value) * 100 : 0
  }))
})

const getBarColor = (value) => {
  if (value === 0) return '#E5E5EA'
  if (value > maxValue.value * 0.7) return 'linear-gradient(180deg, #FF3B30 0%, #FF6B6B 100%)'
  if (value > maxValue.value * 0.4) return 'linear-gradient(180deg, #FF9500 0%, #FFB340 100%)'
  return 'linear-gradient(180deg, #34C759 0%, #5DD97C 100%)'
}
</script>

<style scoped>
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.chart-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.chart-container {
  display: flex;
  gap: var(--spacing-sm);
  height: 220px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 0 10px 0;
  min-width: 50px;
}

.y-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.bars-container {
  flex: 1;
  display: flex;
  gap: 6px;
  align-items: flex-end;
  padding: 20px 0 10px 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.bar-wrapper {
  flex: 1;
  min-width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.bar-column {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

.bar-value-top {
  position: absolute;
  top: -18px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.bar {
  width: 100%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bar-label {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
</style>
