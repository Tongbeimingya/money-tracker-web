/**
 * 金额格式化工具
 *
 * 为什么需要它：JS 的浮点数相加有误差，比如 25.65 + 0 会变成 25.650000000000002，
 * 直接渲染到界面上就会溢出、串行、难看。所有要显示的钱，都先过一遍这里。
 */

// 四舍五入到两位小数（返回数字）
export function roundMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

// 金额 → 字符串，固定两位小数。用于所有金额展示
export function formatMoney(value) {
  return roundMoney(value).toFixed(2)
}

// 金额 → 字符串，去掉多余的小数 0。用在空间紧张的地方（图表坐标轴、柱子顶部标签）
export function formatMoneyCompact(value) {
  return String(roundMoney(value))
}
