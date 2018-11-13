/**
 * utils
 *
 */

const path = require('path');
const osenv = require('osenv');
const { PROJ_NAME, HOME_DIR_LOG } = require('./config');

const baseDir = path.join(osenv.home(), `.${PROJ_NAME}`);

module.exports = {
  baseDir,
  logDir: path.join(baseDir, HOME_DIR_LOG),
  pkgFile: path.join(baseDir, 'package.json'),
  cfgFile: path.join(baseDir, 'config.json'),
};
