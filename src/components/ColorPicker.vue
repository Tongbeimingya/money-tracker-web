<template>
  <div class="color-picker">
    <div class="color-presets">
      <button
        v-for="color in displayedColors"
        :key="color.value"
        :class="['color-swatch', { selected: modelValue === color.value }]"
        :style="{ backgroundColor: color.value }"
        @click="selectColor(color.value)"
        :title="color.name"
      >
        <span v-if="modelValue === color.value" class="check-mark">✓</span>
      </button>
    </div>

    <!-- 展开/收起按钮 -->
    <div v-if="presetColors.length > 16" class="expand-section">
      <button class="expand-btn" @click="toggleExpand">
        <span v-if="!isExpanded">显示全部颜色 ({{ presetColors.length }})</span>
        <span v-else>收起</span>
        <span class="expand-icon">{{ isExpanded ? '▲' : '▼' }}</span>
      </button>
    </div>

    <div class="custom-color-section">
      <label class="section-label">自定义颜色</label>
      <div class="custom-color-input">
        <input
          type="color"
          :value="modelValue"
          @input="handleColorInput"
          class="native-color-picker"
        />
        <input
          type="text"
          :value="modelValue"
          @input="handleTextInput"
          @blur="validateHexInput"
          placeholder="#000000"
          class="hex-input"
          maxlength="7"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const isExpanded = ref(false)

// iOS风格预设颜色 - 低饱和度、柔和色调
const presetColors = [
  // 中性色系
  { name: '石墨灰', value: '#3C3C43' },
  { name: '深灰', value: '#48484A' },
  { name: '中灰', value: '#636366' },
  { name: '浅灰', value: '#8E8E93' },
  { name: '银灰', value: '#AEAEB2' },
  { name: '云灰', value: '#C7C7CC' },
  { name: '米白', value: '#F2F2F7' },
  { name: '奶白', value: '#FAFAFA' },

  // 暖色系
  { name: '砖红', value: '#C5554A' },
  { name: '珊瑚红', value: '#D77A70' },
  { name: '玫瑰粉', value: '#D4A5A5' },
  { name: '蜜桃', value: '#E8B4A0' },
  { name: '杏仁', value: '#E5CDB5' },
  { name: '奶茶', value: '#D4C4B0' },
  { name: '焦糖', value: '#B89B7F' },
  { name: '咖啡', value: '#9B7E63' },

  // 橙黄色系
  { name: '南瓜橙', value: '#C8946E' },
  { name: '柿子橙', value: '#D4956C' },
  { name: '橘橙', value: '#D89C6E' },
  { name: '杏黄', value: '#D4AE7A' },
  { name: '姜黄', value: '#C8B17C' },
  { name: '麦色', value: '#C4B390' },
  { name: '亚麻', value: '#D4C9A9' },
  { name: '米黄', value: '#E5DCC3' },

  // 绿色系
  { name: '橄榄绿', value: '#8B9380' },
  { name: '鼠尾草', value: '#9BA592' },
  { name: '薄荷绿', value: '#A3BCB0' },
  { name: '雾绿', value: '#B4C7BD' },
  { name: '海沫绿', value: '#B5D3CB' },
  { name: '青瓷', value: '#9DB5B2' },
  { name: '松石', value: '#7FA99B' },
  { name: '苔藓', value: '#6B8A7A' },

  // 蓝色系
  { name: '钢蓝', value: '#6B7B8C' },
  { name: '雾蓝', value: '#8996A3' },
  { name: '天青', value: '#94A7B8' },
  { name: '浅蓝灰', value: '#A7B9C8' },
  { name: '冰蓝', value: '#B8CBDB' },
  { name: '粉蓝', value: '#C3D5E4' },
  { name: '宝石蓝', value: '#5B7FA3' },
  { name: '深海蓝', value: '#4A6785' },

  // 紫色系
  { name: '紫灰', value: '#8B7E91' },
  { name: '丁香', value: '#9D91A3' },
  { name: '薰衣草', value: '#AFA3B8' },
  { name: '藤紫', value: '#B8A3BD' },
  { name: '梅子', value: '#9B7B8F' },
  { name: '茄紫', value: '#7E6679' },
  { name: '葡萄紫', value: '#6B5568' },
  { name: '深紫', value: '#5C4A5A' },

  // 粉色系
  { name: '藕粉', value: '#D4B5BC' },
  { name: '樱花粉', value: '#E5C7D0' },
  { name: '奶粉', value: '#E8D5DB' },
  { name: '裸粉', value: '#D9BFC2' },
  { name: '烟粉', value: '#C9AFB5' },
  { name: '豆沙', value: '#B89FA5' },
  { name: '玫瑰褐', value: '#9B7E84' },
  { name: '酒红', value: '#8A6570' },

  // 棕色系
  { name: '驼色', value: '#B8A390' },
  { name: '卡其', value: '#AE9D85' },
  { name: '可可', value: '#9B8878' },
  { name: '核桃', value: '#8A7868' },
  { name: '栗棕', value: '#7A6758' },
  { name: '深棕', value: '#6B5B4F' },
  { name: '巧克力', value: '#5C4F45' },
  { name: '深咖', value: '#4A3F38' },
]

// 显示的颜色（折叠时只显示前16个）
const displayedColors = computed(() => {
  if (!isExpanded.value) {
    return presetColors.slice(0, 16)
  }
  return presetColors
})

const selectColor = (color) => {
  emit('update:modelValue', color)
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const handleColorInput = (e) => {
  emit('update:modelValue', e.target.value.toUpperCase())
}

const handleTextInput = (e) => {
  let value = e.target.value.trim()
  // 自动添加 # 前缀
  if (value && !value.startsWith('#')) {
    value = '#' + value
  }
  emit('update:modelValue', value.toUpperCase())
}

const validateHexInput = (e) => {
  const value = e.target.value.trim()
  const hexRegex = /^#[0-9A-F]{6}$/i
  if (!hexRegex.test(value)) {
    // 如果不是有效的hex颜色，恢复为之前的值
    emit('update:modelValue', props.modelValue)
  }
}
</script>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.color-presets {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: var(--spacing-sm);
}

.color-swatch {
  aspect-ratio: 1;
  border: 2px solid var(--separator);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-swatch.selected {
  border-color: var(--accent-blue);
  border-width: 3px;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(13, 110, 253, 0.3);
}

.check-mark {
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.custom-color-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-color-input {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.native-color-picker {
  width: 60px;
  height: 44px;
  border: 2px solid var(--separator);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.native-color-picker:hover {
  border-color: var(--accent-blue);
  transform: scale(1.05);
}

.hex-input {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 15px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  outline: none;
  transition: all 0.2s;
}

.hex-input:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.hex-input::placeholder {
  color: var(--text-tertiary);
}

.expand-section {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-sm);
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.expand-icon {
  font-size: 10px;
  transition: transform 0.2s;
}
</style>
