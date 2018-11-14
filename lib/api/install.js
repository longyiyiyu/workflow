'use strict';
/**
 * install
 *
 * install command
 *
 */

const path = require('path');

const ora = require('ora');

const log = require('../log');
const {
  baseDir,
  pkgFile,
  getCfg,
  getPkgJsonFromRegistry,
  getPluginName,
  nodeModulesDir,
  execNpmCommand,
} = require('../utils');

const NOTFOUNDVERSION = -1;
const NOTNEEDUPDATE = -1;

function getLocalPluginVersion(plugin) {
  const pluginPkgPath = path.join(nodeModulesDir, plugin, 'package.json');
  let pluginPkg;

  try {
    pluginPkg = require(pluginPkgPath);
  } catch (e) {
    log.error(`get local plugin version error: ${JSON.stringify(e)}`);
    return NOTFOUNDVERSION;
  }

  return pluginPkg.version;
}

function checkPlugins(plugins) {
  if (!plugins.length) {
    return Promise.resolve([]);
  }

  const config = getCfg();
  const registry = config && config.registry;

  return Promise.all(
    plugins.map(p => {
      const localVersion = getLocalPluginVersion(p);

      if (localVersion === NOTFOUNDVERSION) {
        return Promise.resolve(p);
      } else {
        return getPkgJsonFromRegistry(p, 'latest', registry).then(
          json => {
            const latestVersion = json.version;

            if (latestVersion !== localVersion) {
              return p;
            } else {
              return NOTNEEDUPDATE;
            }
          },
          err => {
            log.error(`获取 ${p} 最新版本失败: ${JSON.stringify(err)}`);
            return p;
          }
        );
      }
    })
  ).then(
    list => {
      return list.filter(p => {
        return p !== NOTNEEDUPDATE;
      });
    },
    err => {
      log.error(`获取需要更新的插件列表失败: ${JSON.stringify(err)}`);
      return [];
    }
  );
}

function install(plugins) {
  const { dependencies = {} } = require(pkgFile);
  const notInstalled = [];
  const hasInstalled = [];

  plugins.forEach(p => {
    const name = getPluginName(p);

    if (dependencies[name]) {
      hasInstalled.push(name);
    } else {
      notInstalled.push(name);
    }
  });

  return checkPlugins(hasInstalled)
    .then(list => {
      const needUpdateList = list.concat(notInstalled);

      if (!needUpdateList.length) {
        log.info('检测到您本地安装的已经是最新的插件，无需重复安装');
        return needUpdateList;
      }

      const pluginListString = needUpdateList.join(' ');
      const loading = ora(`Install ${pluginListString}`).start();
      return execNpmCommand('install', needUpdateList, false, baseDir).then(
        () => {
          loading.succeed();
          log.info(`成功安装插件: ${pluginListString}`);

          return needUpdateList;
        },
        result => {
          const errMsg = `安装插件失败，插件列表: ${pluginListString},错误码: ${result.code}, 错误日志: ${result.data}`;

          loading.fail(errMsg);
          log.error(errMsg);

          return []; // 安装失败，返回空列表
        }
      );
    })
    .catch(err => {
      log.error(`安装插件遇到未知错误: ${JSON.stringify(err)}`);
      return [];
    });
}

module.exports = install;
