import { COUNTRY_PARAMS_BY_ISO_CODE } from '../src/mappings'
import * as YAML from 'yaml'

const output = Object.keys(COUNTRY_PARAMS_BY_ISO_CODE)
  .sort()
  .map(k => {
    return { [k]: Object.keys(COUNTRY_PARAMS_BY_ISO_CODE[k].subregions).sort() }
  })

console.log(YAML.stringify(output))
