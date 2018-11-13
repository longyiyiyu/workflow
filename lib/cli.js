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
const {
  version,
  bin,
  engines: { node },
} = require('../package.json');
const {
  ERR: { NODE_VERSION_ERR, INIT_CLIENT_ERR },
} = require('./config');

const { config } = require('./api');

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
function initCmdConfig() {
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
    });
}

/**
 * help 命令
 */
function initCmdHelp() {
  program
    .command('*', '', {
      noHelp: true,
    })
    .action(() => {
      program.help();
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

function main() {
  // 检查 node 版本
  if (!checkNodeVersion()) {
    return Promise.resolve(NODE_VERSION_ERR);
  }

  if (initClient()) {
    return Promise.resolve(INIT_CLIENT_ERR);
  }

  if (process.argv.length <= 2) {
    return printBanner();
  }

  program.version(version, '-v, --version');

  initCmdConfig();
  // initCmdInstall();
  // initCmdUninstall();
  // initCmdList();
  // initCmdInit();
  // initCmdDev();
  // initCmdCommit();
  // initCmdBuild();
  initCmdHelp();

  program.parse(process.argv);

  // 执行了命令就返回正确，有没有更好的方式？
  return Promise.resolve(0);
}

module.exports = main;
