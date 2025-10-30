import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import path from 'path';
import fs from 'fs-extra';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
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
      const mouseTrackerSrc = path.join(nativeSourcePath, 'mouse-tracker');
      const mouseTrackerDest = path.join(nativeDestPath, 'mouse-tracker');

      // Clean the destination first to remove any existing files
      if (await fs.pathExists(nativeDestPath)) {
        await fs.remove(nativeDestPath);
      }
      await fs.ensureDir(windowHelperDest);
      await fs.ensureDir(mouseTrackerDest);

      // Copy only the files we need (not node_modules)
      const filesToCopy = ['index.js', 'index.d.ts', 'package.json', 'build'];

      // Copy window-helper
      for (const file of filesToCopy) {
        const srcPath = path.join(windowHelperSrc, file);
        const destPath = path.join(windowHelperDest, file);
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
          console.log(`  Copied window-helper/${file}`);
        }
      }

      // Copy mouse-tracker
      for (const file of filesToCopy) {
        const srcPath = path.join(mouseTrackerSrc, file);
        const destPath = path.join(mouseTrackerDest, file);
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
          console.log(`  Copied mouse-tracker/${file}`);
        }
      }

      console.log(`Copied native modules from ${nativeSourcePath} to ${nativeDestPath}`);

      // Copy FFmpeg and FFprobe installers
      console.log('Copying FFmpeg and FFprobe binaries...');
      const ffmpegSrc = path.join(process.cwd(), 'node_modules', '@ffmpeg-installer');
      const ffprobeSrc = path.join(process.cwd(), 'node_modules', '@ffprobe-installer');
      const ffmpegDest = path.join(resourcesPath, '@ffmpeg-installer');
      const ffprobeDest = path.join(resourcesPath, '@ffprobe-installer');

      if (await fs.pathExists(ffmpegSrc)) {
        await fs.copy(ffmpegSrc, ffmpegDest);
        console.log(`  Copied @ffmpeg-installer to Resources`);
      }

      if (await fs.pathExists(ffprobeSrc)) {
        await fs.copy(ffprobeSrc, ffprobeDest);
        console.log(`  Copied @ffprobe-installer to Resources`);
      }
    },
    postMake: async (forgeConfig, makeResults) => {
      // The native modules were already copied in postPackage hook,
      // so we don't need to do anything here for the zip maker
      console.log('postMake: Native modules already included via postPackage hook');
    },
  },
};

export default config;
