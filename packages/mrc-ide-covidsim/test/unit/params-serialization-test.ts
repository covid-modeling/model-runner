import { parse, serialize } from '../../src/params-serialization'
import { assert } from 'chai'

suite('serialization of the imperial model parameter format', () => {
  test('parse parameter file', () => {
    const params = parse(`
[a number]
1.0
^^ a comment

//// A second comment
[an array]
1.0\t2.0\t3.0

=====

[a number in a new section]
1

*** ^^ another comment

[a matrix]
1\t2\t3
4\t5\t6
`)

    assert.deepEqual(params, {
      'a number': 1.0,
      'an array': [1.0, 2.0, 3.0],
      'a number in a new section': 1,
      'a matrix': [
        [1, 2, 3],
        [4, 5, 6],
      ],
    })
  })

  test('parse parameter file with missing values', () => {
    const data = parse(`
[a]
1.0

[b]
#1

[c]
2.0

[d]
#2

        `)

    assert.deepEqual(data, {
      a: 1.0,
      c: 2.0,
    })
  })

  test('parse parameter file with strings', () => {
    const data = parse(`
[a]
District_of_Columbia	Florida	Georgia

[b]
610100	United_States	Alabama
610200	United_States	Alaska
        `)

    assert.deepEqual(data, {
      a: ['District_of_Columbia', 'Florida', 'Georgia'],
      b: [
        [610100, 'United_States', 'Alabama'],
        [610200, 'United_States', 'Alaska'],
      ],
    })
  })

  test('generate parameter data', () => {
    const text = serialize({
      'a number': 1.0,
      'an array': [1.0, 2.0, 3.0],
      'a matrix': [
        [1, 2, 3],
        [4, 5, 6],
      ],
    })

    assert.equal(
      text,
      `
[a number]
1

[an array]
1\t2\t3

[a matrix]
1\t2\t3
4\t5\t6
`.trimLeft()
    )
  })

  test('generate parameter data with missing values throws an error', () => {
    assert.throws(() => {
      serialize({
        a: 1.0,
        'some parameter': undefined,
        c: 2.0,
      })
    }, "Missing value for Imperial model parameter 'some parameter'")
  })

  test('generate parameter data with strings', () => {
    const text = serialize({
      a: ['District_of_Columbia', 'Florida', 'Georgia'],
      b: [
        [610100, 'United_States', 'Alabama'],
        [610200, 'United_States', 'Alaska'],
      ],
    })

    assert.deepEqual(
      text,
      `
[a]
District_of_Columbia	Florida	Georgia

[b]
610100	United_States	Alabama
610200	United_States	Alaska
`.trimLeft()
    )
  })
})
