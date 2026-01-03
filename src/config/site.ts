export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: 'Daily Reports',
  description: 'Make beautiful websites regardless of your design experience.',
  sideItems: [
    {
      label: 'Overview',
      href: '/',
    },
    {
      label: 'Reports',
      href: '/reports',
    },
    {
      label: 'Database',
      href: '/database',
    },
    {
      label: 'Soruce',
      href: '/source/',
    },
    {
      label: 'Automation',
      href: '/n8n',
    },
    {
      label: 'Settings',
      href: '/settings',
    },
  ],
  links: {
    github: 'https://github.com/hairyf/damn-daily-reports',
  },
}
