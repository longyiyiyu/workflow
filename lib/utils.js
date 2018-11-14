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
const { PROJ_NAME, HOME_DIR_LOG, PLUGIN_PREFIX, NOTFOUNDVERSION } = require('./config');

const baseDir = path.join(osenv.home(), `.${PROJ_NAME}`);
const cfgFile = path.join(baseDir, 'config.json');
const nodeModulesDir = path.join(baseDir, 'node_modules');

const pluginNameReg = new RegExp(`^${PLUGIN_PREFIX}|^@[^/]+\\/${PLUGIN_PREFIX}`);

function getCfg() {
  let cfg;
  try {
    // 不能用 require，因为 require 有缓存
    cfg = JSON.parse(fs.readFileSync(cfgFile));
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

    // log.debug(`getPkgJsonFromRegistry: ${HTTP_PROXY} ${JSON.stringify(options)}`);
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

function getPluginName(p) {
  if (pluginNameReg.test(p)) {
    return p;
  } else {
    return `${PLUGIN_PREFIX}${p}`;
  }
}

function getLocalPluginVersion(plugin) {
  const pluginPkgPath = path.join(nodeModulesDir, plugin, 'package.json');
  let pluginPkg;

  try {
    pluginPkg = require(pluginPkgPath);
  } catch (e) {
    log.error(`get local plugin version error: ${JSON.stringify(e)}`);
    return NOTFOUNDVERSION;
  }

  return pluginPkg.version;
}

module.exports = {
  baseDir,
  logDir: path.join(baseDir, HOME_DIR_LOG),
  pkgFile: path.join(baseDir, 'package.json'),
  nodeModulesDir,
  cfgFile,

  getCfg,
  setCfg,
  getPkgJsonFromRegistry,
  execNpmCommand,
  getPluginName,
  getLocalPluginVersion,
};
