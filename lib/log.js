'use strict';
/**
 * log
 *
 * 全局 logger
 * 使用半成品 logger
 * TODO: 完善 logger，使之成为 npm 组件
 *
 * 注意:
 * 需要 initClient 之后才能使用!
 *
 * TODO:
 * debug 参数
 *
 */

const loggerFactory = require('./logger');

module.exports = loggerFactory('core', [loggerFactory.createDefaultOption(), loggerFactory.createOption('core')]);
