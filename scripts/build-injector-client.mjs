// 构建 dsh-super-injector 的 client bundle（复刻其 tsdown 配置，用 dsh-whale 根的 esbuild）
import { build } from 'esbuild'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const inj = resolve(root, 'upstream/dsh-routing-suite/injector')

await build({
  entryPoints: [resolve(inj, 'src/client/index.ts')],
  outfile: resolve(inj, 'lib/client.js'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  sourcemap: true,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  external: [
    'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
    'cordis',
    '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-runtime/client',
  ],
  banner: { js: 'var module = { exports: {} }; var exports = module.exports; window.__ModuleLoader__.load({ id: "@dsh-external/dsh-super-injector", factory: (require) => {' },
  footer: { js: 'return module.exports; } });' },
})
console.log('injector client.js built OK')
