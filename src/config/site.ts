export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: 'Daily Reports',
  description: 'Make beautiful websites regardless of your design experience.',
  sideItems: [
    {
      label: '概览',
      href: '/',
    },
    {
      label: '报告',
      href: '/report',
    },
    {
      label: '记录',
      href: '/record',
    },
    {
      label: '数据源',
      href: '/source/',
    },
    {
      label: '工作流',
      href: '/workflow',
    },
    {
      label: '设置',
      href: '/settings',
    },
  ],
  links: {
    github: 'https://github.com/hairyf/damn-daily-reports',
  },
}
