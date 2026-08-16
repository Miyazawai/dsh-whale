// 构建 @dsh-whale/model-preset-link（host + client 全用 esbuild，不查类型）
import { build } from 'esbuild'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const pkg = resolve(root, 'plugins/model-preset-link')

// host：ESM，cordis/@deepseek-ai/* 外部（loader 运行时提供）
await build({
  entryPoints: [resolve(pkg, 'src/index.ts')],
  outfile: resolve(pkg, 'lib/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  sourcemap: true,
  external: ['cordis', '@deepseek-ai/*'],
})
console.log('host lib built (esbuild)')

// client：browser CJS + ModuleLoader banner
await build({
  entryPoints: [resolve(pkg, 'src/client/index.ts')],
  outfile: resolve(pkg, 'lib/client.js'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  sourcemap: true,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  external: [
    'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
    'cordis',
    '@deepseek-ai/dsh-client-runtime/client',
    '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-ui-settings',
  ],
  banner: { js: 'var module = { exports: {} }; var exports = module.exports; window.__ModuleLoader__.load({ id: "@dsh-whale/model-preset-link", factory: (require) => {' },
  footer: { js: 'return module.exports; } });' },
})
console.log('client bundle built (esbuild)')
