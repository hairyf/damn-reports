import { openUrl } from '@tauri-apps/plugin-opener'

export type SiteConfig = typeof siteConfig
export const siteConfig = {
  name: 'Damn Reports',
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
      onClick: () => {
        const params = new URLSearchParams([
          ['email', store.n8n.email || N8N_LOGIN_DATA.emailOrLdapLoginId],
          ['password', store.n8n.password || N8N_LOGIN_DATA.password],
          ['hideUI', 'true'], // 通过 URL 参数告诉 n8n 隐藏 UI 元素
        ])
        openUrl(`http://localhost:5678/workflow/${store.n8n.workflow}?${params.toString()}`)
      },
    },
    {
      label: '设置',
      href: '/setting',
    },
  ],
  links: {
    github: 'https://github.com/hairyf/damn-daily-reports',
  },
}
