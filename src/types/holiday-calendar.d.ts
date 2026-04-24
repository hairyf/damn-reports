declare module 'holiday-calendar' {
  export default class HolidayCalendar {
    constructor(options?: { dataLoader?: (path: string) => Promise<object>, baseUrl?: string })
    isWorkday(region: string, date: string): Promise<boolean>
  }
}
