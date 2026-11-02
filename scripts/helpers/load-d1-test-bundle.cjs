const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire(fs.realpathSync(require.resolve('wrangler/package.json')));

module.exports = async function loadD1TestBundle(source, context) {
  const built = await runtimeRequire('esbuild').build({
    stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'isolated-d1-entry.ts', loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', target: 'es2022', packages: 'external',
    plugins: [{ name: 'isolated-runtime', setup(build) {
      build.onResolve({ filter: /^@opennextjs\/cloudflare$/ }, () => ({ path: 'context', namespace: 'isolated' }));
      build.onLoad({ filter: /.*/, namespace: 'isolated' }, () => ({ contents: context
        ? 'export const getCloudflareContext=()=>__isolatedContext;'
        : 'export function getCloudflareContext(){throw new Error("Test must inject its isolated DB")}' }));
      build.onResolve({ filter: /\.wasm\?module$/ }, args => ({ path: path.resolve(args.resolveDir, args.path.replace('?module', '')), namespace: 'wasm' }));
      build.onLoad({ filter: /.*/, namespace: 'wasm' }, args => ({ contents: `export default new WebAssembly.Module(Buffer.from('${fs.readFileSync(args.path).toString('base64')}','base64'))` }));
    } }],
  });
  const mod = { exports: {} };
  new Function('require', 'exports', 'module', '__isolatedContext', built.outputFiles[0].text)(require, mod.exports, mod, context);
  return mod.exports;
};
