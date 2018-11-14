'use strict';
/**
 * uninstall
 *
 * uninstall command
 *
 */

const ora = require('ora');

const log = require('../log');
const { baseDir, getPluginName, execNpmCommand } = require('../utils');

function uninstall(plugins) {
  if (!plugins || !plugins.length) {
    return Promise.resolve([]);
  }

  plugins = plugins.map(p => {
    return getPluginName(p);
  });

  const pluginListString = plugins.join(' ');
  const loading = ora(`Uninstall ${pluginListString}`).start();
  return execNpmCommand('uninstall', plugins, false, baseDir).then(
    () => {
      loading.succeed();
      log.info(`成功卸载插件: ${pluginListString}`);

      return plugins;
    },
    result => {
      const errMsg = `卸载插件失败，插件列表: ${pluginListString},错误码: ${result.code}, 错误日志: ${result.data}`;

      loading.fail(errMsg);
      log.error(errMsg);

      return [];
    }
  );
}

module.exports = uninstall;
