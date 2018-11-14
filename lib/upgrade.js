'use strict';
/**
 * upgrade
 *
 * 检测 cli 工具版本更新，检测 plugin 版本更新
 *
 */

const semver = require('semver');
const ora = require('ora');

const log = require('./log');
const { getCfg, getPkgJsonFromRegistry, execNpmCommand } = require('./utils');
const { name, version } = require('../package.json');

function checkCore() {
  const config = getCfg();
  const registry = config && config.registry;

  log.debug('正在检查 cli 版本更新...');
  return getPkgJsonFromRegistry(name, 'latest', registry).then(
    json => {
      const configs = json.configs;
      const latestVersion = json.version;
      const compatibleVersion = configs && configs.compatibleVersion;
      log.debug(`本地版本: ${version}, 最新版本: ${latestVersion}, 兼容版本: ${compatibleVersion}`);

      if (!semver.satisfies(version, compatibleVersion)) {
        log.info(`当前版本为: ${version}, workflow 要求使用的版本为: ${latestVersion}, 需要全量更新`);

        const loading = ora('Update workflow-cli').start();
        return execNpmCommand('install', name, true).then(
          () => {
            loading.succeed();
            log.info(`已经自动升级为最新版本: ${latestVersion}`);

            return 0;
          },
          result => {
            const errMsg = `全量更新失败，错误码: ${result.code}, 错误日志: ${result.data}`;

            loading.fail(errMsg);
            log.error(errMsg);

            return -1;
          }
        );
      } else {
        log.debug(`当前版本 ${version} 和最新版本 ${latestVersion} 兼容`);
      }

      return 0;
    },
    err => {
      log.error(`获取 ${name} 最新版本失败: ${JSON.stringify(err)}`);
      return -1;
    }
  );
}

module.exports = () => {
  return Promise.all([checkCore()]);
};
