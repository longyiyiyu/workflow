const bunyan = require('bunyan');
const LoggerStreamOption = require('./LoggerStreamOption');

function createDefaultOption() {
  return new LoggerStreamOption({
    level: 'trace',
    type: 'stdout',
  });
}

function createOption(opts) {
  let opt;

  try {
    opt = new LoggerStreamOption(opts);
  } catch (e) {
    return null;
  }

  return opt;
}

function loggerFactory(name, options = []) {
  if (!name) {
    throw new TypeError('[loggerFactory] need name');
  }

  if (!(options instanceof Array)) {
    options = [options];
  }

  const streams = options.filter(o => {
    return o instanceof LoggerStreamOption;
  });

  // 默认是打印所有日志到控制台
  if (!streams.length) {
    streams.push(createDefaultOption());
  }

  return bunyan.createLogger({
    name,
    streams,
  });
}

loggerFactory.createOption = createOption;
loggerFactory.createDefaultOption = createDefaultOption;

module.exports = loggerFactory;
