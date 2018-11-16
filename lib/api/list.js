'use strict';
/**
 * list
 *
 * list command
 *
 */

const { getPkg, getPluginName, getLocalPluginVersion } = require('../utils');
const { NOTFOUNDVERSION } = require('../config');

function list(plugins) {
  const { dependencies = {} } = getPkg();
  let showPluginList = [];

  if (!plugins || !plugins.length) {
    showPluginList = Object.keys(dependencies);
  } else {
    showPluginList = plugins
      .map(p => {
        return getPluginName(p);
      })
      .filter(p => {
        return !!dependencies[p];
      });
  }

  return showPluginList
    .map(name => {
      return {
        name,
        version: getLocalPluginVersion(name),
      };
    })
    .filter(p => {
      return p.version !== NOTFOUNDVERSION;
    });
}

module.exports = list;
