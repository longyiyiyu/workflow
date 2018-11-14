'use strict';
/**
 * api 入口文件
 */

const config = require('./config');
const install = require('./install');
const uninstall = require('./uninstall');

module.exports = {
  config,
  install,
  uninstall,
};
