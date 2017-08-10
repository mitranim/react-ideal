'use strict'

// Must be run from ../cloned/react16

const pt = require('path')

function main() {
  const bundleConfig = require(pt.join(__dirname, '../cloned/react16/scripts/rollup/bundles'))
  bundleConfig.bundles = customBundles
  require(pt.join(__dirname, '../cloned/react16/scripts/rollup/build'))
}

const customBundles = [
  {
    label: 'react-internals',
    name: 'react-internals',
    babelOpts: {
      exclude: 'node_modules/**',
      presets: [],
      plugins: [],
    },
    bundleTypes: ['NODE_DEV', 'NODE_PROD'],
    config: {
      destDir: pt.join(__dirname, '../build/react16') + '/',
      globals: {react: 'React'},
      moduleName: 'react-internals',
      sourceMap: false,
      exports: 'named',
    },
    entry: pt.join(__dirname, '../scripts/react-internals'),
    externals: ['react', 'prop-types/checkPropTypes'],
    paths: [
      'src/renderers/shared/**/*.js',
      'src/shared/**/*.js',
    ],
  },
]

if (require.main === module) main()
