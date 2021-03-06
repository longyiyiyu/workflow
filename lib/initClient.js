'use strict';
/**
 * initClient
 *
 * 初始化客户端环境
 * 相关资源默认在 ~/.workflow/ 下面
 *
 * TODO:
 * 确定 package.json 里面的 dependencies 都有安装
 *
 */

const fs = require('fs');

const log = require('./log');
const { baseDir, logDir, pkgFile, cfgFile } = require('./utils');

function initHome() {
  if (fs.existsSync(baseDir) && fs.statSync(baseDir).isFile()) {
    fs.unlinkSync(baseDir);
  }

  if (!fs.existsSync(baseDir)) {
    // eslint-disable-next-line
    console.log('检测到这是您第一次使用 workflow，即将进行初始化...');

    fs.mkdirSync(baseDir);
  }
}

function initLog() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);

    log.info(`创建文件夹成功: ${logDir}`);
  }
}

function initPkgFile() {
  if (!fs.existsSync(pkgFile)) {
    fs.writeFileSync(
      pkgFile,
      JSON.stringify(
        {
          name: 'workflow-home',
          version: '1.0.0',
          private: true,
        },
        null,
        4
      )
    );

    log.info(`创建文件成功: ${pkgFile}`);
  }
}

function initConfig() {
  if (!fs.existsSync(cfgFile)) {
    const { http_proxy, HTTP_PROXY } = process.env;
    const cfg = {
      registry: 'http://registry.npmjs.org',
    };

    if (http_proxy || HTTP_PROXY) {
      cfg.HTTP_PROXY = HTTP_PROXY || http_proxy;
    }

    fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 4));

    log.info(`创建文件成功: ${cfgFile}`);
  }
}

module.exports = () => {
  try {
    initHome();
    initLog();
    initPkgFile();
    initConfig();

    return 0;
  } catch (e) {
    return 1;
  }
};
