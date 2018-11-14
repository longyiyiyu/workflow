'use strict';
/* eslint-disable no-console */
/**
 * workflow
 *
 * 前端工作流工具
 * 命令行工具入口文件
 *
 */

const figlet = require('figlet');
const chalk = require('chalk');
const semver = require('semver');
const program = require('commander');

const log = require('./log');
const initClient = require('./initClient');
const upgrade = require('./upgrade');
const {
  version,
  bin,
  engines: { node },
} = require('../package.json');
const {
  ERR: { UNKNOWN_ERR, NODE_VERSION_ERR, INIT_CLIENT_ERR, UPGRADE_ERR },
} = require('./config');

const { config, install, uninstall } = require('./api');

function checkNodeVersion() {
  if (!semver.satisfies(process.version, node)) {
    console.log(
      chalk.red(
        `运行 workflow 所需 Node.js 版本为: ${node}，当前版本为: ${
          process.version
        }，请升级到最新版本 Node.js(https://nodejs.org/en/).`
      )
    );

    return false;
  }

  return true;
}

/**
 * Print banner
 * Font preview：http://patorjk.com/software/taag/#p=display&f=3D-ASCII&t=feflow%0A
 *
 */
function printBanner() {
  return new Promise(resolve => {
    figlet.text(
      'WORKFLOW',
      {
        font: '3D-ASCII',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      },
      (err, data) => {
        if (err) {
          log.error(chalk.red(`figlet err: ${JSON.stringify(err)}`));
          resolve(0);
          return;
        }

        console.log(chalk.cyan(data));
        console.log(
          chalk.cyan(` WorkfloW，当前版本v${version}, 让开发更简单，主页: https://github.com/longyiyiyu/workflow`)
        );
        // console.log(chalk.cyan(' (c) powered by IMWEB Team'));
        console.log(
          chalk.cyan(
            ` 执行 ${Object.keys(bin)
              .map(s => {
                return `\`${s} -h\``;
              })
              .join(' 或者 ')} 查看帮助`
          )
        );

        resolve(0);
      }
    );
  });
}

/**
 * config 命令
 */
function initCmdConfig(callback) {
  program
    .command('config [key] [value]')
    .description('to get/set config')
    .action((key, value) => {
      const list = config(key, value);

      if (list && list.length) {
        list.forEach(({ k, v }) => {
          console.log(`${k}=${JSON.stringify(v)}`);
        });
      }

      callback(0);
    });
}

/**
 * help 命令
 */
function initCmdHelp(callback) {
  program
    .command('*', '', {
      noHelp: true,
    })
    .action(() => {
      program.help();
      callback(0);
    });

  // program.on('--help', () => {
  //   console.log('');
  //   console.log('  Examples:');
  //   console.log('');
  //   console.log('    # to answer question 1');
  //   console.log('    $ c a 1');
  //   console.log('    # to run your answer of question 1 with degree base');
  //   console.log('    $ c r 1');
  //   console.log('    # to run answer from Blob of question 1 with degree base');
  //   console.log('    $ c r 1 -u Blob');
  //   console.log('    # to run your answer of question 1 with degree advance1');
  //   console.log('    $ c r 1 -t advance1');
  //   console.log('');
  // });
}

/**
 * install 命令
 */
function initCmdInstall(callback) {
  program
    .command('install <name...>')
    .alias('i')
    .description('to install plugins')
    .action(name => {
      install(name).then(() => {
        callback(0);
      });
    });
}

/**
 * uninstall 命令
 */
function initCmdUninstall(callback) {
  program
    .command('uninstall <name...>')
    .description('to uninstall plugins')
    .action(name => {
      uninstall(name).then(() => {
        callback(0);
      });
    });
}

function initCmds() {
  return new Promise(resolve => {
    program.version(version, '-v, --version');

    initCmdConfig(resolve);
    initCmdInstall(resolve);
    initCmdUninstall(resolve);
    // initCmdList(resolve);
    // initCmdInit(resolve);
    // initCmdDev(resolve);
    // initCmdCommit(resolve);
    // initCmdBuild(resolve);
    initCmdHelp(resolve);

    program.parse(process.argv);
  });
}

function main() {
  // 检查 node 版本
  if (!checkNodeVersion()) {
    return Promise.resolve(NODE_VERSION_ERR);
  }

  if (initClient()) {
    return Promise.resolve(INIT_CLIENT_ERR);
  }

  return upgrade()
    .then(
      () => {
        if (process.argv.length <= 2) {
          return printBanner();
        }

        return initCmds();
      },
      () => {
        // 不会到达这里，因为更新检测不应该阻止执行
        return UPGRADE_ERR;
      }
    )
    .catch(err => {
      log.fatal(`未知错误: ${JSON.stringify(err)}`);
      return UNKNOWN_ERR;
    });
}

module.exports = main;
