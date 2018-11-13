/**
 * config
 *
 * config command
 *
 */

const fs = require('fs');

const { cfgFile } = require('../utils');

function config(key, value) {
  let cfg;
  try {
    cfg = require(cfgFile);
  } catch (e) {
    cfg = {};
  }

  if (!key && !value) {
    return Object.keys(cfg).map(k => {
      return { k, v: cfg[k] };
    });
  } else if (!value) {
    if (cfg[key]) {
      return [
        {
          k: key,
          v: cfg[key],
        },
      ];
    } else {
      return [];
    }
  } else {
    cfg[key] = value;

    fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 4));

    return [
      {
        k: key,
        v: value,
      },
    ];
  }
}

module.exports = config;
