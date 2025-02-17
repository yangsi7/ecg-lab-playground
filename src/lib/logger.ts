/********************************************************************
 * FILE: src/lib/logger.ts
 * No changes, just ensure it's consistent. 
 ********************************************************************/
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
    level?: LogLevel
    context?: Record<string, unknown>
}

class Logger {
    private static instance: Logger
    private isDevelopment = process.env.NODE_ENV === 'development'

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger()
        }
        return Logger.instance
    }

    log(message: string, options: LogOptions = {}) {
        const { level = 'info', context = {} } = options
        const timestamp = new Date().toISOString()

        if (this.isDevelopment) {
            console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, context)
        }
    }

    debug(message: string, context?: Record<string, unknown>) {
        this.log(message, { level: 'debug', context })
    }

    info(message: string, context?: Record<string, unknown>) {
        this.log(message, { level: 'info', context })
    }

    warn(message: string, context?: Record<string, unknown>) {
        this.log(message, { level: 'warn', context })
    }

    error(message: string, context?: Record<string, unknown>) {
        this.log(message, { level: 'error', context })
    }
}

export const logger = Logger.getInstance()
