<template>
  <div class="bar-chart">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span class="chart-total">¥{{ formatMoney(total) }}</span>
    </div>

    <div class="chart-body">
      <!-- Y 轴刻度 -->
      <div class="y-axis">
        <span
          v-for="(label, index) in yLabels"
          :key="index"
          class="y-label"
          :style="{ top: `${index * 25}%` }"
        >
          ¥{{ label }}
        </span>
      </div>

      <!-- 绘图区（柱子多的时候横向滚动） -->
      <div class="plot-scroll">
        <div class="plot-content" :style="{ minWidth: `${contentMinWidth}px` }">
          <div class="plot-inner">
            <div class="grid-lines" aria-hidden="true">
              <span
                v-for="n in 5"
                :key="n"
                class="grid-line"
                :style="{ top: `${(n - 1) * 25}%` }"
              ></span>
            </div>

            <div class="bars">
              <div
                v-for="(item, index) in dataWithPercentage"
                :key="index"
                class="bar-slot"
                :style="{ '--bar-h': `${item.percentage}%` }"
                :title="`${item.label} ¥${formatMoney(item.value)}`"
              >
                <span v-if="item.value > 0" class="bar-value">
                  {{ formatMoneyCompact(item.value) }}
                </span>
                <div
                  class="bar"
                  :style="{ background: getBarColor(item.value) }"
                ></div>
              </div>
            </div>
          </div>

          <div class="labels-row">
            <span
              v-for="(item, index) in data"
              :key="index"
              class="bar-label"
            >
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatMoney, formatMoneyCompact } from '../utils/format'

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

const GAP = 6

const total = computed(() => {
  return props.data.reduce((sum, item) => sum + item.value, 0)
})

const maxValue = computed(() => {
  const max = Math.max(...props.data.map(item => item.value))
  return max > 0 ? max : 0
})

// 从最大值到 0，均分 4 档
const yLabels = computed(() => {
  const max = maxValue.value
  return [1, 0.75, 0.5, 0.25, 0].map(ratio => formatMoneyCompact(max * ratio))
})

const dataWithPercentage = computed(() => {
  const max = maxValue.value
  return props.data.map(item => ({
    ...item,
    percentage: max > 0 ? (item.value / max) * 100 : 0
  }))
})

// 每个槽位的宽度按"最长金额标签"算，保证柱子顶上的数字不会互相压住
const slotWidth = computed(() => {
  const longest = props.data.reduce(
    (max, item) => Math.max(max, formatMoneyCompact(item.value).length),
    1
  )
  return Math.max(28, longest * 6 + 12)
})

const contentMinWidth = computed(() => {
  const count = props.data.length
  if (count === 0) return 0
  return count * slotWidth.value + (count - 1) * GAP
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

.chart-body {
  display: flex;
  gap: var(--spacing-sm);
  /* --plot-h：绘图区高度；--plot-pad-top：顶部留白，给最高那根柱子顶上的金额标签用 */
  --plot-h: 180px;
  --plot-pad-top: 18px;
}

.y-axis {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: var(--plot-h);
  margin-top: var(--plot-pad-top);
}

.y-label {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  font-size: 11px;
  line-height: 1;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.plot-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.plot-content {
  display: flex;
  flex-direction: column;
}

/* 关键：这里必须是"确定高度"，柱子的百分比高度才有参照物 */
.plot-inner {
  position: relative;
  height: var(--plot-h);
  margin-top: var(--plot-pad-top);
}

.grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--separator);
}

.bars {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 6px;
}

.bar-slot {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
}

.bar {
  width: 68%;
  height: var(--bar-h);
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.bar-value {
  position: absolute;
  left: 50%;
  bottom: calc(var(--bar-h) + 4px);
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-secondary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.labels-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.bar-label {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
</style>
