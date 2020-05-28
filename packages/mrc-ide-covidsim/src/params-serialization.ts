import { DateTime } from 'luxon'
import * as assert from 'assert'

const SEPARATOR_REGEX = /[ \t]/
const ENTRY_REGEX = /^[A-Za-z0-9#]/

// Parse the contents of an imperial parameter file
export function parse(text: string): {} {
  const result = {}
  const lines = text.split('\n')
  const n = lines.length
  let i = 0
  while (i < n) {
    const line = lines[i].trimRight()
    i++
    if (line.startsWith('[')) {
      if (line.endsWith(']')) {
        const key = line.slice(1, -1)
        let str = ''
        while (i < n && ENTRY_REGEX.test(lines[i])) {
          str += '\n' + lines[i]
          i++
        }
        try {
          const value = parseValue(str)
          if (value != null) {
            result[key] = value
          }
        } catch (_) {
          throw new Error(`Unable to parse the value for key '${key}': ${str}`)
        }
      } else {
        throw new Error(`Expected a closing square bracket on line ${i}`)
      }
    }
  }
  return result
}

// Generate the content for an imperial parameter file.
export function serialize(data: {}): string {
  let result = ''
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = serializeValue(data[key])
      if (value == null) {
        throw new Error(`Missing value for Imperial model parameter '${key}'`)
      }
      result += '[' + key + ']\n' + value + '\n\n'
    }
  }
  return result.slice(0, -1)
}

// Parse an individual value in an imperial parameter file
function parseValue(text) {
  text = text.trim()

  // Parse multi-line matrices
  if (text.includes('\n')) {
    return text.split('\n').map(parseValue)
  }

  // Parse tab-separated arrays
  if (SEPARATOR_REGEX.test(text)) {
    return text.split(SEPARATOR_REGEX).map(parseValue)
  }

  if (text.startsWith('#')) {
    return null
  }

  const float = Number.parseFloat(text)
  if (Number.isNaN(float)) {
    return text
  } else {
    return float
  }
}

// Serialize an individual value in an imperial parameter file
function serializeValue(value) {
  if (Array.isArray(value)) {
    // Serialize a 2D matrix as a multi-line array.
    if (Array.isArray(value[0])) {
      return value.map(serializeValue).join('\n')
    }

    // Serialize a 1D array as a tab-separated line
    else {
      return value.map(serializeValue).join('\t')
    }
  } else if (value != null) {
    return String(value)
  } else {
    return null
  }
}
