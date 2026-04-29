import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  ignores: [
    'packages',
  ],
  rules: {
    'array-callback-return': 'off',
    'antfu/no-top-level-await': 'off',
    'react/no-array-index-key': 'off',
  },
})
