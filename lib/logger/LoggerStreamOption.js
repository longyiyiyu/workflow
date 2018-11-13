'use strict';
/**
 * LoggerStreamOption
 * 创建 logger 的 option
 * 统一配置，简化参数，默认都是文件 logger
 *
 */

const LoggerStream = require('./LoggerStream');

const TYPE_STDOUT = 'stdout';
const TYPE_FILE = 'file'; // 目前不支持这种类型，因为需要格式化信息
const TYPE_RAW = 'raw';

const LEVELNAMES = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};
const DEFAULT_LEVEL = 'info';

/**
 * @class LoggerStreamOption
 * @param {String|Object} opts 配置项，如果是字符串，那就是文件类型 logger 的路径
 * @param {String} opts.level logger 级别，为 trace|debug|info|warn|error|fatal 中的一个，默认为 info
 * @param {String} opts.path log 目录路径，统一存在 ~/.workflow/logs/[opts.path]/[today].log
 * @param {Stream} opts.isStdout 是否打在 stdout，否则记录在文件上
 *
 */
class LoggerStreamOption {
  constructor(opts) {
    this.opts = opts;

    if (typeof opts === 'string') {
      this.filePath = opts;
    } else if (typeof opts === 'object') {
      if (opts.type === TYPE_STDOUT) {
        this.isStdout = true;
      } else if (opts.path) {
        this.filePath = opts.path;
      } else {
        throw new TypeError(`[LoggerStreamOption] unknow options: ${JSON.stringify(opts)}`);
      }

      if (opts.level) {
        if (!LEVELNAMES[opts.level]) {
          throw new TypeError(
            `[LoggerStreamOption] unknow level: ${opts.level}, must be one of ${Object.keys(LEVELNAMES).join('|')}`
          );
        }
      }

      this.level = LEVELNAMES[opts.level || DEFAULT_LEVEL];
    } else {
      throw new TypeError(`[LoggerStreamOption] unknow options: ${JSON.stringify(opts)}`);
    }

    this.type = TYPE_RAW;

    this.init();
  }

  init() {
    this.stream = new LoggerStream({
      isStdout: this.isStdout,
      path: this.filePath,
    });
  }
}

LoggerStreamOption.TYPE_STDOUT = TYPE_STDOUT;
LoggerStreamOption.TYPE_FILE = TYPE_FILE;
LoggerStreamOption.TYPE_RAW = TYPE_RAW;

module.exports = LoggerStreamOption;
