/** Custom logger for Cloudflare Workers — pino-pretty uses Node fs.write which isn't available */
export const logger = {
  info: (...args: unknown[]) => console.log(JSON.stringify({ level: 'info', msg: args })),
  warn: (...args: unknown[]) => console.warn(JSON.stringify({ level: 'warn', msg: args })),
  error: (...args: unknown[]) => console.error(JSON.stringify({ level: 'error', msg: args })),
  debug: (...args: unknown[]) => console.debug(JSON.stringify({ level: 'debug', msg: args })),
}
