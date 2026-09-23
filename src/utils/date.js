/**
 * 日期小工具
 *
 * <input type="date"> 认的是 'YYYY-MM-DD' 字符串，存进 localStorage 的却是时间戳，
 * 来回转换统一放这里，免得每个页面各写一份。
 */

const pad = (n) => String(n).padStart(2, '0')

// 时间戳 → 'YYYY-MM-DD'
export function toDateInputValue(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 今天 / N 天前，返回 'YYYY-MM-DD'
export function offsetDayValue(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return toDateInputValue(d.getTime())
}

// 'YYYY-MM-DD' → 时间戳，时分秒沿用参考时间
export function dateValueToTimestamp(dateValue, referenceTs) {
  const [year, month, day] = String(dateValue).split('-').map(Number)
  if (!year || !month || !day) return referenceTs
  const ref = new Date(referenceTs)
  return new Date(
    year,
    month - 1,
    day,
    ref.getHours(),
    ref.getMinutes(),
    ref.getSeconds()
  ).getTime()
}

// 显示用：9月19日 周六
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function formatDayWithWeekday(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`
}
