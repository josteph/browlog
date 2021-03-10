const ts = require('typescript');

function getTSConfig(configPath = 'tsconfig.json') {
  const tsConfigFile = ts.findConfigFile(process.cwd(), ts.sys.fileExists, configPath);

  if (!tsConfigFile) {
    throw new Error(`tsconfig.json does not exist in the current directory: ${process.cwd()}`);
  }

  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);

  if (configFile.error) {
    throw new Error(`Cannot read TS configuration file from ${process.cwd()}: ${configFile.error}`);
  }

  const tsConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd());

  return { tsConfig, tsConfigFile };
}

module.exports = getTSConfig;
