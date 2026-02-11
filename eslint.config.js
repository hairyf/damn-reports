import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  rules: {
    'react/no-array-index-key': 'off',
    'format/prettier': 'off',
  },
  ignores: ['tauri', 'packages/ui'],
})
