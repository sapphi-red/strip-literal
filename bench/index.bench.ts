import { readFile } from 'fs/promises'
import { bench, describe } from 'vitest'
import { stripLiteralAcorn, stripLiteralRegex } from '../src'

const modules = {
  'vue-esm-bundler': './node_modules/vue/dist/vue.esm-bundler.js',
  'vue-compiler-core-esm-bundler': './node_modules/@vue/compiler-core/dist/compiler-core.esm-bundler.js',
}

Object.entries(modules).forEach(([name, path]) => {
  describe(`bench ${name}`, async () => {
    const code = await readFile(path, 'utf-8')

    const replacements = {
      'process.env.': '({}).',
      'global.process.env.': '({}).',
      'globalThis.process.env.': '({}).',
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global.process.env.NODE_ENV': JSON.stringify('production'),
      'globalThis.process.env.NODE_ENV': JSON.stringify('production'),
    }
    const replacementsKeys = Object.keys(replacements)
    const pattern = new RegExp(
      // Mustn't be preceded by a char that can be part of an identifier
      // or a '.' that isn't part of a spread operator
      `(?<![\\p{L}\\p{N}_$]|(?<!\\.\\.)\\.)(${
        replacementsKeys
          .map((str) => {
            return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
          })
          .join('|')
        // Mustn't be followed by a char that can be part of an identifier
        // or an assignment (but allow equality operators)
      })(?![\\p{L}\\p{N}_$]|\\s*?=[^=])`,
      'gu',
    )

    function replaceOverStripedCode(
      code: string,
      stripedCode: string,
      pattern: RegExp,
      replacements: Record<string, string>,
    ) {
      let newCode = ''
      let match: RegExpExecArray | null
      let lastEnd = 0
      // eslint-disable-next-line no-cond-assign
      while ((match = pattern.exec(stripedCode))) {
        const start = match.index
        const end = start + match[0].length
        const replacement
          = typeof replacements === 'string'
            ? replacements
            : replacements[match[0]] ?? ''
        newCode += code.slice(lastEnd, start) + replacement
        lastEnd = end
      }
      if (lastEnd !== code.length)
        newCode += code.slice(lastEnd)

      return newCode
    }

    bench('regex replace (current)', () => {
      code.replace(pattern, (_, match) => `${replacements[match]}`)
    })
    bench('strip-literal(acorn) + regex replace', () => {
      const stripedCode = stripLiteralAcorn(code)
      replaceOverStripedCode(code, stripedCode, pattern, replacements)
    })
    bench('strip-literal(regex) + regex replace', () => {
      const stripedCode = stripLiteralRegex(code)
      replaceOverStripedCode(code, stripedCode, pattern, replacements)
    })
  })
})
