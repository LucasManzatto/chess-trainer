import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

const features = ['ChessBoardV2', 'games', 'openings', 'openings_v2']

function featureZones() {
  return features.map(feature => ({
    target: `./src/features/${feature}`,
    from: features
      .filter(f => f !== feature)
      .map(f => `./src/features/${f}`),
  }))
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      { ...reactRefresh.configs.vite, rules: { 'react-refresh/only-export-components': ['warn', { allowExportNames: ['Route'] }] } },
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // app cannot be imported by features
            { target: './src/features', from: './src/app' },

            // shared modules cannot import from features or app
            // TODO: remove features/engine exception once components/ChessBoard moves to features/board
            {
              target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
              from: ['./src/features/ChessBoardV2', './src/features/games', './src/features/openings', './src/features/openings_v2'],
            },

            // features cannot cross-import each other
            ...featureZones(),
          ],
        },
      ],
    },
  },
])
