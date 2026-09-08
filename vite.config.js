import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { picksDataPlugin } from './vite-plugin-picks-data.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dataDir = env.VITE_DATA_DIR || 'data';

  // GitHub Pages project site lives under /<repo-name>/. Repo is "pick-em-bros".
  const basePath = env.BASE_PATH || (mode === 'production' ? '/pick-em-bros/' : '/');

  return {
    base: basePath,
    plugins: [vue(), picksDataPlugin(dataDir)],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  };
});
