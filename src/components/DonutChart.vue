<template>
  <div class="donut-chart">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <g :transform="`translate(${size / 2}, ${size / 2})`">
        <!-- 背景圆环 -->
        <circle
          :r="radius"
          fill="none"
          stroke="#E8E8E8"
          :stroke-width="strokeWidth"
        />

        <!-- 数据段 -->
        <g v-for="(segment, index) in segments" :key="index">
          <circle
            :r="radius"
            fill="none"
            :stroke="segment.color"
            :stroke-width="strokeWidth"
            :stroke-dasharray="getDashArray(segment.percentage)"
            :stroke-dashoffset="getOffset(index)"
            transform="rotate(-90)"
            class="chart-segment"
            stroke-linecap="round"
          />
        </g>

        <!-- 中心文字 -->
        <text
          text-anchor="middle"
          dy="0.3em"
          class="center-label"
          fill="#333333"
        >
          {{ centerLabel }}
        </text>
      </g>
    </svg>

    <!-- 图例 -->
    <div class="legend">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="legend-item"
      >
        <span class="legend-color" :style="{ background: item.color }"></span>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">¥{{ item.value }}</span>
        <span class="legend-percentage">{{ item.percentage }}%</span>
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
    default: () => []
  },
  size: {
    type: Number,
    default: 280
  },
  strokeWidth: {
    type: Number,
    default: 40
  },
  centerLabel: {
    type: String,
    default: ''
  }
})

const radius = computed(() => {
  return (props.size - props.strokeWidth) / 2
})

const circumference = computed(() => {
  return 2 * Math.PI * radius.value
})

const segments = computed(() => {
  return props.data.map(item => ({
    ...item,
    dashLength: (item.percentage / 100) * circumference.value
  }))
})

const getDashArray = (percentage) => {
  const dashLength = (percentage / 100) * circumference.value
  return `${dashLength} ${circumference.value}`
}

const getOffset = (index) => {
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += segments.value[i].dashLength
  }
  return -offset
}
</script>

<style scoped>
.donut-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

svg {
  display: block;
}

.chart-segment {
  transition: stroke-width 0.3s ease;
}

.center-label {
  font-size: 18px;
  font-weight: 700;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
  max-width: 400px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.legend-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.legend-percentage {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}
</style>
