'use strict';
/**
 * utils
 *
 */

const fs = require('fs');
const path = require('path');
const osenv = require('osenv');
const request = require('request-promise');
const spawn = require('cross-spawn');

const log = require('./log');
const { PROJ_NAME, HOME_DIR_LOG } = require('./config');

const baseDir = path.join(osenv.home(), `.${PROJ_NAME}`);
const cfgFile = path.join(baseDir, 'config.json');

function getCfg() {
  let cfg;
  try {
    cfg = require(cfgFile);
  } catch (e) {
    cfg = {};
  }

  return cfg;
}

function setCfg(cfg) {
  fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 4));
}

function getPkgJsonFromRegistry(name, version, registry) {
  return new Promise((resolve, reject) => {
    const { HTTP_PROXY } = getCfg();
    const options = {
      url: `${registry}/${name}/${version}`,
      method: 'GET',
      proxy: HTTP_PROXY,
    };

    request(options)
      .then(response => {
        resolve(JSON.parse(response));
      })
      .catch(err => {
        reject(err);
      });
  });
}

function execNpmCommand(cmd, modules, isGlobal, where) {
  const { registry, proxy } = getCfg();

  return new Promise((resolve, reject) => {
    const args = [cmd].concat(modules).concat(['--color=always', '--save']);

    if (isGlobal) {
      args.push('-g');
    }

    if (registry) {
      args.push(`--registry=${registry}`);
    }

    if (proxy) {
      args.push(`--proxy=${proxy}`);
    }

    log.debug(`execNpmCommand: ${JSON.stringify(args)}`);

    const npm = spawn('npm', args, { cwd: where });

    let output = '';
    npm.stdout
      .on('data', data => {
        output += data;
      })
      .pipe(process.stdout);

    npm.stderr
      .on('data', data => {
        output += data;
      })
      .pipe(process.stderr);

    npm.on('close', code => {
      if (!code) {
        resolve({ code: 0, data: output });
      } else {
        reject({ code: code, data: output });
      }
    });
  });
}

module.exports = {
  baseDir,
  logDir: path.join(baseDir, HOME_DIR_LOG),
  pkgFile: path.join(baseDir, 'package.json'),
  cfgFile,

  getCfg,
  setCfg,
  getPkgJsonFromRegistry,
  execNpmCommand,
};
