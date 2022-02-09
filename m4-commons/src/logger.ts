import pc from 'picocolors'

const Log = (_name: string) => ({
  i: (...args: any) => console.info(pc.blue('[INFO]'), ...args),
  w: (...args: any) => console.warn(pc.yellow('[WARN]'), ...args),
  e: (...args: any) => console.info(pc.red('[ERRR]'), ...args),
  d: (...args: any) => console.info('[DEBG]', ...args),
  cr:
    (returnCode: number = 1) =>
    (...args: any) => {
      console.info('[DEBG]', ...args)
      globalThis?.process.exit(returnCode)
    },
})

export default Log
