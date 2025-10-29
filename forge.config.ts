import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import path from 'path';
import fs from 'fs-extra';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: [
      './native'
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
  hooks: {
    postPackage: async (forgeConfig, options) => {
      console.log('Running postPackage hook to copy native modules...');
      const nativeSourcePath = path.join(process.cwd(), 'native');
      const resourcesPath = path.join(options.outputPaths[0], 'clip-forge.app', 'Contents', 'Resources');
      const nativeDestPath = path.join(resourcesPath, 'native');

      // Copy only essential files from native directory (excluding node_modules)
      const windowHelperSrc = path.join(nativeSourcePath, 'window-helper');
      const windowHelperDest = path.join(nativeDestPath, 'window-helper');

      // Clean the destination first to remove any existing files
      if (await fs.pathExists(nativeDestPath)) {
        await fs.remove(nativeDestPath);
      }
      await fs.ensureDir(windowHelperDest);

      // Copy only the files we need (not node_modules)
      const filesToCopy = ['index.js', 'index.d.ts', 'package.json', 'build'];
      for (const file of filesToCopy) {
        const srcPath = path.join(windowHelperSrc, file);
        const destPath = path.join(windowHelperDest, file);
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
          console.log(`  Copied ${file}`);
        }
      }

      console.log(`Copied native modules from ${nativeSourcePath} to ${nativeDestPath}`);
    },
    postMake: async (forgeConfig, makeResults) => {
      // The native modules were already copied in postPackage hook,
      // so we don't need to do anything here for the zip maker
      console.log('postMake: Native modules already included via postPackage hook');
    },
  },
};

export default config;
