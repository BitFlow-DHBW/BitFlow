import tseslint from 'typescript-eslint'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'src/**/*.d.ts', 'src/**/*.test.{ts,tsx}', 'src/test/**']),
  {
    files: ['src/**/*.{ts,tsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
    rules: {
      complexity: ['warn', { max: 10 }],
    },
  },
])
