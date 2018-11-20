'use strict';
/**
 * init
 *
 * init command
 *
 */

const path = require('path');

const yeoman = require('yeoman-environment');

const log = require('../log');
const { nodeModulesDir, getPluginName, checkUpdatePlugin, toLoadLocalPlugin } = require('../utils');
const {
  PLUGIN_TYPE_INIT,
  ERR: { INIT_NO_PLUGIN_ERR, INIT_INSTALL_ERR, INIT_YO_ERR },
} = require('../config');

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

function toInitByPlugin(plugin) {
  return checkUpdatePlugin(plugin).then(
    () => {
      return run(plugin);
    },
    () => {
      return INIT_INSTALL_ERR;
    }
  );
}

function toInitByLocalList() {
  return toLoadLocalPlugin({
    type: PLUGIN_TYPE_INIT,
    promptMsg: '您想要选择哪个插件进行初始化？',
  }).then(
    ({ plugin }) => {
      return toInitByPlugin(plugin);
    },
    () => {
      return Promise.resolve(INIT_NO_PLUGIN_ERR);
    }
  );
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
