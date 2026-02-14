/**
 * 国内工作日（含调休补班）的下次执行时间计算
 * 基于 holiday-calendar 的国务院节假日数据
 */
/// <reference path="../types/holiday-calendar.d.ts" />
import HolidayCalendar from 'holiday-calendar'

const REGION_TZ: Record<string, string> = {
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
}
const calendar = new HolidayCalendar()

function getTz(region: string): string {
  return REGION_TZ[region] ?? 'Asia/Shanghai'
}

/** 在指定时区将时间戳格式化为 YYYY-MM-DD */
function toDateStrInTz(ms: number, tz: string): string {
  return new Date(ms).toLocaleDateString('sv-SE', { timeZone: tz })
}

/** 将 日期(YYYY-MM-DD) + 时间(HH:mm) 转为指定时区对应时刻的 UTC 时间戳 */
function toTimestampInTz(dateStr: string, time: string, tz: string): number {
  // 简化：仅支持 UTC+8 (CN) 和 UTC+9 (JP)
  const offset = tz.includes('Tokyo') ? 9 : 8
  const [h, m = 0] = time.split(':').map(Number)
  const [y, mo, day] = dateStr.split('-').map(Number)
  let utcHour = h - offset
  let dayOffset = 0
  if (utcHour < 0) {
    utcHour += 24
    dayOffset = -1
  }
  else if (utcHour >= 24) {
    utcHour -= 24
    dayOffset = 1
  }
  return Date.UTC(y, mo - 1, day + dayOffset, utcHour, m, 0, 0)
}

/**
 * 计算下次工作日指定时刻的时间戳
 * @param region 地区码，如 'CN'、'JP'
 * @param time "HH:mm" 格式，如 "18:00"
 * @param nowMs 当前时间戳
 */
export async function computeNextWorkdayRunAtMs(
  region: string,
  time: string,
  nowMs: number,
): Promise<number | undefined> {
  const [hour, minute] = time.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute))
    return undefined

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const tz = getTz(region)
  const nowDateStr = toDateStrInTz(nowMs, tz)

  // 今天目标时刻的时间戳
  const todayTargetMs = toTimestampInTz(nowDateStr, timeStr, tz)

  // 若此刻尚未到今天目标时间，且今天是工作日，则返回今天
  if (nowMs < todayTargetMs) {
    const isWorkday = await calendar.isWorkday(region, nowDateStr)
    if (isWorkday)
      return todayTargetMs
  }

  // 下一天日期 YYYY-MM-DD
  function nextDay(dateStr: string): string {
    const [y, mo, day] = dateStr.split('-').map(Number)
    const d = new Date(Date.UTC(y, mo - 1, day + 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }

  // 从明天起逐日查找下一个工作日
  let dateStr = nextDay(nowDateStr)
  for (let i = 0; i < 366; i++) {
    const isWorkday = await calendar.isWorkday(region, dateStr)
    if (isWorkday)
      return toTimestampInTz(dateStr, timeStr, tz)
    dateStr = nextDay(dateStr)
  }

  return undefined
}
