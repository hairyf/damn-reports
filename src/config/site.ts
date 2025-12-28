export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: 'Vite + HeroUI',
  description: 'Make beautiful websites regardless of your design experience.',
  navItems: [
    {
      label: 'Overview',
      href: '/',
    },
    {
      label: 'Database',
      href: '/database',
    },
    {
      label: 'Soruce',
      href: '/source',
    },
    {
      label: 'Automation',
      href: '/automation',
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
