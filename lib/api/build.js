'use strict';
/**
 * build
 *
 * build command
 *
 */

const path = require('path');

const log = require('../log');
const { nodeModulesDir, getPluginName, checkUpdatePlugin, toLoadLocalPlugin, findProjectRoot } = require('../utils');
const {
  WORKFLOW_CONFIG_FILE,
  ERR: { BUILD_LOAD_CONFIG_ERR, BUILD_NO_PLUGIN_ERR, BUILD_INSTALL_ERR, BUILD_RUN_ERR },
} = require('../config');

function run(plugin, type) {
  const script = path.join(nodeModulesDir, plugin, 'index.js');

  try {
    return require(script)({
      type,
      cwd: process.cwd(),
    });
  } catch (e) {
    log.fatal(`${plugin} plugin run error: ${JSON.stringify(e)}`);
    return Promise.resolve(BUILD_RUN_ERR);
  }
}

function toBuildByPlugin(plugin, type) {
  return checkUpdatePlugin(plugin).then(
    () => {
      return run(plugin, type);
    },
    () => {
      return BUILD_INSTALL_ERR;
    }
  );
}

function toBuildByLocalList(type) {
  return toLoadLocalPlugin({
    type: type,
    promptMsg: '您想要执行哪个插件？',
  }).then(
    ({ plugin }) => {
      return toBuildByPlugin(plugin, type);
    },
    () => {
      return Promise.resolve(BUILD_NO_PLUGIN_ERR);
    }
  );
}

function build(type, plugin) {
  if (plugin) {
    return toBuildByPlugin(getPluginName(plugin), type);
  }

  const hasFind = findProjectRoot();

  if (hasFind) {
    // 有 workflow 配置
    let config;

    try {
      config = require(path.join(process.cwd(), WORKFLOW_CONFIG_FILE));
    } catch (e) {
      log.fatal(`加载 ${WORKFLOW_CONFIG_FILE} 配置文件失败: ${JSON.stringify(e)}`);
      return Promise.resolve(BUILD_LOAD_CONFIG_ERR);
    }

    plugin = config[type];
    if (!plugin) {
      return toBuildByLocalList(type);
    } else {
      return toBuildByPlugin(getPluginName(plugin), type);
    }
  } else {
    return toBuildByLocalList(type);
  }
}

module.exports = build;
