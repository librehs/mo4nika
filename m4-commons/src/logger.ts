import pc from 'picocolors'

const Log = (name: string) => ({
  i: (...args: any) => console.info(pc.blue(`[INFO|${name}]`), ...args),
  w: (...args: any) => console.warn(pc.yellow(`[WARN|${name}]`), ...args),
  e: (...args: any) => console.info(pc.red(`[ERRR|${name}]`), ...args),
  d: (...args: any) => console.info(`[DEBG|${name}]`, ...args),
  cr:
    (returnCode: number = 1) =>
    (...args: any) => {
      console.info(`[DEBG|${name}]`, ...args)
      globalThis?.process.exit(returnCode)
    },
})

export default Log
