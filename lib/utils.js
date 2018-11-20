'use strict';
/**
 * utils
 *
 */

const fs = require('fs');
const path = require('path');
const osenv = require('osenv');
const request = require('request-promise');
const spawn = require('cross-spawn');
const ora = require('ora');
const inquirer = require('inquirer');

const log = require('./log');
const {
  PROJ_NAME,
  HOME_DIR_LOG,
  PLUGIN_PREFIX,
  NOTFOUNDVERSION,
  WORKFLOW_CONFIG_FILE,
  ERR: { PLUGIN_UPDATE_ERR, NO_PLUGIN_ERR },
} = require('./config');

const baseDir = path.join(osenv.home(), `.${PROJ_NAME}`);
const cfgFile = path.join(baseDir, 'config.json');
const pkgFile = path.join(baseDir, 'package.json');
const nodeModulesDir = path.join(baseDir, 'node_modules');

const pluginNameReg = new RegExp(`^${PLUGIN_PREFIX}|^@[^/]+\\/${PLUGIN_PREFIX}`);

function getBaseJSONFile(file) {
  let obj;
  try {
    obj = JSON.parse(fs.readFileSync(file));
  } catch (e) {
    obj = {};
  }

  return obj;
}

function getPkg() {
  return getBaseJSONFile(pkgFile);
}

function getCfg() {
  return getBaseJSONFile(cfgFile);
}

function setCfg(cfg) {
  fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 4));
}

function getPkgJsonFromRegistry(name, version, registry) {
  return new Promise((resolve, reject) => {
    const { HTTP_PROXY } = getCfg();
    const options = {
      url: `${registry}/${name}/${version}`,
      method: 'GET',
      proxy: HTTP_PROXY,
    };

    // log.debug(`getPkgJsonFromRegistry: ${HTTP_PROXY} ${JSON.stringify(options)}`);
    request(options)
      .then(response => {
        resolve(JSON.parse(response));
      })
      .catch(err => {
        reject(err);
      });
  });
}

function execNpmCommand(cmd, modules, isGlobal, where) {
  const { registry, proxy } = getCfg();

  return new Promise((resolve, reject) => {
    const args = [cmd].concat(modules).concat(['--color=always', '--save']);

    if (isGlobal) {
      args.push('-g');
    }

    if (registry) {
      args.push(`--registry=${registry}`);
    }

    if (proxy) {
      args.push(`--proxy=${proxy}`);
    }

    log.debug(`execNpmCommand: ${JSON.stringify(args)}`);

    const npm = spawn('npm', args, { cwd: where });

    let output = '';
    npm.stdout
      .on('data', data => {
        output += data;
      })
      .pipe(process.stdout);

    npm.stderr
      .on('data', data => {
        output += data;
      })
      .pipe(process.stderr);

    npm.on('close', code => {
      if (!code) {
        resolve({ code: 0, data: output });
      } else {
        reject({ code: code, data: output });
      }
    });
  });
}

function getPluginName(p) {
  if (pluginNameReg.test(p)) {
    return p;
  } else {
    return `${PLUGIN_PREFIX}${p}`;
  }
}

function getLocalPluginVersion(plugin) {
  const pluginPkgPath = path.join(nodeModulesDir, plugin, 'package.json');
  let pluginPkg;

  try {
    pluginPkg = require(pluginPkgPath);
  } catch (e) {
    // log.error(`get local plugin version error: ${JSON.stringify(e)}`);
    return NOTFOUNDVERSION;
  }

  return pluginPkg.version;
}

function getLocalPluginList(type = '') {
  const { dependencies = {} } = getPkg();

  return Object.keys(dependencies)
    .map(name => {
      return {
        name,
        pkg: getBaseJSONFile(path.join(nodeModulesDir, name, 'package.json')),
      };
    })
    .filter(({ pkg: { version, keywords } }) => {
      if (!version || !keywords || !keywords.includes(type)) {
        return false;
      }

      return true;
    });
}

function installPlugin(plugin) {
  const loading = ora(`Install ${plugin}`).start();
  return execNpmCommand('install', plugin, false, baseDir).then(
    () => {
      loading.succeed();
      log.info(`成功安装插件: ${plugin}`);

      return {
        isSucc: true,
      };
    },
    result => {
      const errMsg = `安装插件失败，插件列表: ${plugin},错误码: ${result.code}, 错误日志: ${result.data}`;

      loading.fail(errMsg);

      return {
        isSucc: false,
        errMsg,
      };
    }
  );
}

function checkUpdatePlugin(plugin) {
  const localVersion = getLocalPluginVersion(plugin);

  if (localVersion === NOTFOUNDVERSION) {
    // 插件还没装
    log.info(`检测到您本地没有安装 ${plugin} 插件, 即将为您安装...`);
    return installPlugin(plugin).then(({ isSucc, errMsg }) => {
      if (isSucc) {
        return {
          isNew: true,
        };
      } else {
        log.fatal(errMsg);
        return Promise.reject(PLUGIN_UPDATE_ERR);
      }
    });
  } else {
    const config = getCfg();
    const registry = config && config.registry;

    return getPkgJsonFromRegistry(plugin, 'latest', registry).then(
      json => {
        const latestVersion = json.version;

        if (latestVersion !== localVersion) {
          log.info(`检测到 ${plugin} 插件版本需要更新, 即将为您更新...`);
          return installPlugin(plugin).then(({ errMsg }) => {
            if (errMsg) {
              log.err(errMsg);
            }

            return {
              isNew: !errMsg,
            };
          });
        } else {
          return {
            isNew: true,
          };
        }
      },
      err => {
        log.error(`获取 ${plugin} 最新版本失败: ${JSON.stringify(err)}`);
        return {
          isNew: true,
        };
      }
    );
  }
}

function toLoadLocalPlugin({ type, promptMsg }) {
  const list = getLocalPluginList(type);

  if (!list.length) {
    log.info('检测到您本地没有安装任何相关插件，请先安装相关插件');
    return Promise.reject(NO_PLUGIN_ERR);
  }

  return inquirer.prompt([
    {
      type: 'list',
      name: 'plugin',
      message: promptMsg,
      choices: list.map(({ name, pkg: { description = '' } }) => {
        return {
          name: `${name}: ${description}`,
          value: name,
        };
      }),
    },
  ]);
}

function findProjectRoot() {
  let currDir = process.cwd();

  while (!fs.existsSync(path.join(currDir, WORKFLOW_CONFIG_FILE))) {
    currDir = path.join(currDir, '../');

    // unix跟目录为/， win32系统根目录为 C:\\格式的
    if (currDir === '/' || /^[a-zA-Z]:\\$/.test(currDir)) {
      return false;
    }
  }

  process.chdir(currDir);

  return true;
}

module.exports = {
  baseDir,
  logDir: path.join(baseDir, HOME_DIR_LOG),
  pkgFile,
  nodeModulesDir,
  cfgFile,

  getPkg,
  getCfg,
  setCfg,
  getPkgJsonFromRegistry,
  execNpmCommand,
  getPluginName,
  getLocalPluginVersion,
  getLocalPluginList,
  installPlugin,
  checkUpdatePlugin,
  toLoadLocalPlugin,
  findProjectRoot,
};
