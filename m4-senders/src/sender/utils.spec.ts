import { expect } from 'chai'
import { splitText } from './utils'

function findCountOfLineBreaks(s: string): number {
  return s.split('\n').length - 1
}

describe('splitText', () => {
  it('should maintain the number of line breaks', () => {
    const input = '1231231234\n\n123123123\n\n123123123'
    const result = splitText(input, 10)
    expect(result).to.deep.equal(['1231231234', '\n123123123', '\n123123123'])
    expect(findCountOfLineBreaks(input)).to.equal(
      result.map(findCountOfLineBreaks).reduce((a, b) => a + b, 0) +
        (result.length - 1)
    )
  })
})
