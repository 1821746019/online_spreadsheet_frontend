import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import oxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  module.exports = {
    parse: 'babel-eslint',
    parserOptions: {
      "ecmaVersion": 7,
      "sourceType": "module"
    }
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...oxlint.configs['flat/recommended'],
  skipFormatting,
]

