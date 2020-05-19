/*
Merge country names from the `scenarios.json` file with their ISO country codes,
both alpha2 and alpha3. You must run the `bootstrap` script before this will
work.

Usage:
node script/merge-iso.js
 */
var regions = require('./data/iso-countries.json')
var scenarios = require('../data/scenarios.json')
YAML = require('yaml');

const names = scenarios.all.map(d => d.name)

const geos = regions.filter(r => names.includes(r.name)).map(
    r => Object.assign({
      [r["alpha-2"]]: {
        name: r.name,
        alpha3: r["alpha-3"]
      }
    })).reduce((r, a) => Object.assign(r, a), {})

// console.log(JSON.stringify(geos))
console.log(YAML.stringify(geos))
