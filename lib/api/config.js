'use strict';
/**
 * config
 *
 * config command
 *
 */

const { getCfg, setCfg } = require('../utils');

function config(key, value) {
  const cfg = getCfg();

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
    setCfg(cfg);

    return [
      {
        k: key,
        v: value,
      },
    ];
  }
}

module.exports = config;
