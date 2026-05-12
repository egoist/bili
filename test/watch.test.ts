import { Bundler } from '../src'
import logger from '../src/logger'
import { watch } from 'rollup'

jest.mock('rollup', () => ({
  rollup: jest.fn(),
  watch: jest.fn(),
}))

const mockWatch = watch as jest.Mock

describe('watch mode', () => {
  beforeEach(() => {
    mockWatch.mockReset()
    jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('logs fatal Rollup watch events', async () => {
    const error = new Error('watch failed')

    mockWatch.mockReturnValue({
      on(event: string, listener: (payload: any) => void) {
        expect(event).toBe('event')
        listener({ code: 'FATAL', error })
      },
    })

    await new Bundler(
      { input: 'index.js' },
      {
        configFile: false,
        logLevel: 'quiet',
        rootDir: __dirname,
      }
    ).run({ watch: true })

    expect(logger.error).toHaveBeenCalledWith('watch failed')
  })

  it('keeps logging normal Rollup watch errors', async () => {
    const error = new Error('build failed')

    mockWatch.mockReturnValue({
      on(event: string, listener: (payload: any) => void) {
        expect(event).toBe('event')
        listener({ code: 'ERROR', error })
      },
    })

    await new Bundler(
      { input: 'index.js' },
      {
        configFile: false,
        logLevel: 'quiet',
        rootDir: __dirname,
      }
    ).run({ watch: true })

    expect(logger.error).toHaveBeenCalledWith('build failed')
  })
})
