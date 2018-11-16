'use strict';
/**
 * init
 *
 * init command
 *
 */

const path = require('path');

const inquirer = require('inquirer');
const ora = require('ora');
const yeoman = require('yeoman-environment');

const log = require('../log');
const {
  baseDir,
  nodeModulesDir,
  getCfg,
  getPkgJsonFromRegistry,
  getPluginName,
  execNpmCommand,
  getLocalPluginVersion,
  getLocalPluginList,
} = require('../utils');
const { PLUGIN_TYPE_INIT, NOTFOUNDVERSION, INIT_NO_PLUGIN_ERR, INIT_INSTALL_ERR, INIT_YO_ERR } = require('../config');

const yeomanEnv = yeoman.createEnv();

function run(plugin) {
  const genPath = path.join(nodeModulesDir, plugin, 'generators/app');
  const namespace = `workflow:init:${plugin}`;

  yeomanEnv.register(genPath, namespace);
  return new Promise(resolve => {
    yeomanEnv.run(namespace, {}, err => {
      if (err) {
        log.fatal(`run yo error: ${JSON.stringify(err)}`);
        resolve(INIT_YO_ERR);
      } else {
        resolve(0);
      }
    });
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

function toInitByPlugin(plugin) {
  const localVersion = getLocalPluginVersion(plugin);

  if (localVersion === NOTFOUNDVERSION) {
    // 插件还没装
    log.info(`检测到您本地没有安装 ${plugin} 插件, 即将为您安装...`);
    return installPlugin(plugin).then(({ isSucc, errMsg }) => {
      if (isSucc) {
        return run(plugin);
      } else {
        log.fatal(errMsg);
        return INIT_INSTALL_ERR;
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

            return run(plugin);
          });
        } else {
          return run(plugin);
        }
      },
      err => {
        log.error(`获取 ${plugin} 最新版本失败: ${JSON.stringify(err)}`);
        return run(plugin);
      }
    );
  }
}

function toInitByLocalList() {
  const list = getLocalPluginList(PLUGIN_TYPE_INIT);

  if (!list.length) {
    log.info('检测到您本地没有安装任何相关插件，请先安装相关插件');
    return Promise.resolve(INIT_NO_PLUGIN_ERR);
  }

  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'plugin',
        message: '您想要选择哪个插件进行初始化？',
        choices: list.map(({ name, pkg: { description = '' } }) => {
          return {
            name: `${name}: ${description}`,
            value: name,
          };
        }),
      },
    ])
    .then(({ plugin }) => {
      return toInitByPlugin(plugin);
    });
}

function init(plugin) {
  if (plugin instanceof Array) {
    plugin = plugin[0];
  }

  if (typeof plugin !== 'string') {
    plugin = null;
  }

  if (plugin) {
    return toInitByPlugin(getPluginName(plugin));
  } else {
    return toInitByLocalList();
  }
}

module.exports = init;
