/**
 * Simple logger utility for the application
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogOptions {
  level?: LogLevel
  context?: string
  data?: any
}

const defaultOptions: LogOptions = {
  level: "info",
  context: "app",
}

/**
 * Log a message with the specified level and options
 */
export function log(message: string, options: LogOptions = {}) {
  const opts = { ...defaultOptions, ...options }
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${opts.level?.toUpperCase()}] [${opts.context}]`

  let logFn: (message?: any, ...optionalParams: any[]) => void

  switch (opts.level) {
    case "debug":
      logFn = console.debug
      break
    case "warn":
      logFn = console.warn
      break
    case "error":
      logFn = console.error
      break
    case "info":
    default:
      logFn = console.info
  }

  if (opts.data) {
    logFn(`${prefix} ${message}`, opts.data)
  } else {
    logFn(`${prefix} ${message}`)
  }
}

/**
 * Log a debug message
 */
export function debug(message: string, context?: string, data?: any) {
  log(message, { level: "debug", context, data })
}

/**
 * Log an info message
 */
export function info(message: string, context?: string, data?: any) {
  log(message, { level: "info", context, data })
}

/**
 * Log a warning message
 */
export function warn(message: string, context?: string, data?: any) {
  log(message, { level: "warn", context, data })
}

/**
 * Log an error message
 */
export function error(message: string, context?: string, data?: any) {
  log(message, { level: "error", context, data })
}

// Default export for convenience
export default {
  log,
  debug,
  info,
  warn,
  error,
}
