import { REGION_DATA} from '../src/regions'
import * as YAML from 'yaml'

const keys = Object.keys(REGION_DATA)
console.log(keys)
const output = keys.map( k => {
  return { [k]: Object.keys(REGION_DATA[k].regions??{})}
})

console.log(YAML.stringify(output))
