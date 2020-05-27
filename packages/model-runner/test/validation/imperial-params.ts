// Taken from packages/mrc-ide-covidsim/src/imperial-params.ts.
// In future, factor into common package.
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

// Parse an individual value in an imperial parameter file
function parseValue(text: string) {
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

export const isCovidSimInputFile = (fileName: string) =>
  fileName.endsWith('-params.txt')
