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
const pkgFile = path.join(baseDir, 'package.json');
const nodeModulesDir = path.join(baseDir, 'node_modules');

const pluginNameReg = new RegExp(`^${PLUGIN_PREFIX}|^@[^/]+\\/${PLUGIN_PREFIX}`);

function getBaseJSONFile(file) {
  let obj;
  try {
    obj = JSON.parse(fs.readFileSync(file));
  } catch (e) {
    obj = {};
  }

  return obj;
}

function getPkg() {
  return getBaseJSONFile(pkgFile);
}

function getCfg() {
  return getBaseJSONFile(cfgFile);
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
    // log.error(`get local plugin version error: ${JSON.stringify(e)}`);
    return NOTFOUNDVERSION;
  }

  return pluginPkg.version;
}

function getLocalPluginList(type = '') {
  const { dependencies = {} } = getPkg();

  return Object.keys(dependencies)
    .map(name => {
      return {
        name,
        pkg: getBaseJSONFile(path.join(nodeModulesDir, name, 'package.json')),
      };
    })
    .filter(({ pkg: { version, keywords } }) => {
      if (!version || !keywords || !keywords.includes(type)) {
        return false;
      }

      return true;
    });
}

module.exports = {
  baseDir,
  logDir: path.join(baseDir, HOME_DIR_LOG),
  pkgFile,
  nodeModulesDir,
  cfgFile,

  getPkg,
  getCfg,
  setCfg,
  getPkgJsonFromRegistry,
  execNpmCommand,
  getPluginName,
  getLocalPluginVersion,
  getLocalPluginList,
};
