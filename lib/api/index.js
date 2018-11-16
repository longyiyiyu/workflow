'use strict';
/**
 * api 入口文件
 */

const config = require('./config');
const install = require('./install');
const uninstall = require('./uninstall');
const list = require('./list');
const init = require('./init');

module.exports = {
  config,
  install,
  uninstall,
  list,
  init,
};
