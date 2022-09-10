import { tokenizer } from 'acorn'

/**
 * Strip literal using Acorn's tokenizer.
 *
 * Will throw error if the input is not valid JavaScript.
 */
export function stripLiteralAcorn(code: string) {
  const FILL = ' '
  let result = ''
  function fulfill(index: number) {
    if (index > result.length)
      result += code.slice(result.length, index).replace(/[^\n]/g, FILL)
  }

  const tokens = tokenizer(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowHashBang: true,
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
  })
  const inter = tokens[Symbol.iterator]()

  while (true) {
    const { done, value: token } = inter.next()
    if (done)
      break
    fulfill(token.start)
    if (token.type.label === 'string')
      result += code[token.start] + FILL.repeat(token.end - token.start - 2) + code[token.end - 1]
    else if (token.type.label === 'template')
      result += FILL.repeat(token.end - token.start)

    else
      result += code.slice(token.start, token.end)
  }

  fulfill(code.length)

  return result
}

export function getLiteralPosAcorn(code: string) {
  const result: number[] = [] // literal start, non-literal start, literal start...

  const tokens = tokenizer(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowHashBang: true,
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
  })
  const inter = tokens[Symbol.iterator]()

  while (true) {
    const { done, value: token } = inter.next()
    if (done)
      break
    if (token.type.label === 'string') {
      result.push(token.start + 1)
      result.push(token.end - 1)
    }
    else if (token.type.label === 'template') {
      result.push(token.start)
      result.push(token.end)
    }
  }

  return result
}
