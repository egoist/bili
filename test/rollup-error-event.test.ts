import { isRollupErrorEvent } from '../src'

test('detects rollup watch error events', () => {
  expect(
    isRollupErrorEvent({ code: 'ERROR', error: { message: 'boom' } })
  ).toBe(true)
  expect(
    isRollupErrorEvent({ code: 'FATAL', error: { message: 'boom' } })
  ).toBe(true)
  expect(isRollupErrorEvent({ code: 'BUNDLE_END' })).toBe(false)
  expect(isRollupErrorEvent({ code: 'START' })).toBe(false)
  expect(isRollupErrorEvent({})).toBe(false)
  expect(isRollupErrorEvent(null)).toBe(false)
})
