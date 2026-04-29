import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  ignores: [
    'packages',
  ],
  rules: {
    'antfu/no-top-level-await': 'off',
  },
})
