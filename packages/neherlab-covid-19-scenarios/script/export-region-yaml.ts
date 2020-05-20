import { REGION_DATA } from '../src/regions'
import * as YAML from 'yaml'

const output = Object.keys(REGION_DATA)
  .sort()
  .map(k => {
    return { [k]: Object.keys(REGION_DATA[k].regions ?? {}).sort() }
  })

console.log(YAML.stringify(output))
