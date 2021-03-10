const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('esbuild');

const tscBinary = require.resolve('.bin/tsc');
const getTSConfig = require('./utils/tsConfig');

(async () => {
  const timer = Date.now();

  const { tsConfig, tsConfigFile } = getTSConfig();

  /**
   * Builder is interface for esbuild's build API. 
   * 
   * The main purpose that it will convert ES2015+ code
   * into backwards compatible version of JavaScript in current and older environments.
   *
   * @async
   * @returns {void}
   */
  const builder = async () => {
    const startTimer = Date.now();

    try {
      await esbuild.build({
        color: true,
        entryPoints: tsConfig.fileNames,
        outdir: 'dist',
        format: 'esm',
        target: 'es2015',
        minify: false,
        tsconfig: tsConfigFile,
        logLevel: 'error',
        sourcemap: true,
      });

      const endTimer = Date.now() - startTimer;

      console.log(`✅ Successfully built with esbuild in ${Math.floor(endTimer)}ms.\n`);
    } catch (error) {
      console.error(error);
    }
  };

  const tsTransformer = () => {
    const startTimer = Date.now();

    try {
      execSync(`${tscBinary} --emitDeclarationOnly --skipLibCheck --declarationDir ./dist`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      console.log(`✅ Types successfully transformed.`);
    } catch (error) {
      console.error(`❌ Error happened during transforming types\n`);
      console.error(error);
    } finally {
      const endTimer = Date.now() - startTimer;
      console.log(`ℹ️  Generating types finished in ${Math.floor(endTimer)}ms.\n`);
    }
  };

  const run = async () => {
    await builder();

    tsTransformer();
  };

  await run();

  const endTimer = Date.now() - timer;
  console.log(`ℹ️  All build processes finished in ${endTimer}ms\n`);
})();
