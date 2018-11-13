'use strict';
const fs = require('fs');
const path = require('path');
const osenv = require('osenv');
const chalk = require('chalk');
const { Writable } = require('stream');
const bunyan = require('bunyan');

const { formatDate } = require('./utils');

const levelNames = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO ',
  40: 'WARN ',
  50: 'ERROR',
  60: 'FATAL',
};

const levelColors = {
  10: 'gray',
  20: 'underline',
  30: 'green',
  40: 'yellow',
  50: 'red',
  60: 'red',
};

class LoggerStream extends Writable {
  constructor({ path, isStdout }) {
    super({
      objectMode: true,
    });

    this.path = path;
    this.isStdout = isStdout;
  }

  _write({ level, name, time, msg, err }, encoding, callback) {
    let errMsg;
    if (err) {
      errMsg = err.stack || err.message;
    }

    const logMsg =
      [
        chalk.gray(formatDate('yyyy-MM-dd hh:mm:ss', time)),
        chalk[levelColors[level]](`${name} ${levelNames[level]}`),
        msg,
        '\n',
      ].join(' ') + (errMsg ? chalk.yellow(errMsg) + '\n' : '');

    if (this.isStdout) {
      if (level >= bunyan.ERROR) {
        process.stderr.write(logMsg);
      } else {
        process.stdout.write(logMsg);
      }
    } else {
      const logDir = path.join(osenv.home(), `./.workflow/logs/${this.path}`);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }

      const today = formatDate('yyyy-MM-dd', new Date());
      const logPath = path.join(osenv.home(), `./.workflow/logs/${this.path}/${today}.log`); // 这里是 workflow 工具，不是公共库，因此这里不做参数化，比较麻烦

      fs.appendFileSync(logPath, logMsg);
    }

    callback();
  }
}

module.exports = LoggerStream;
