/********************************************************************
 * FILE: src/lib/logger.ts
 * No changes, just ensure it's consistent. 
 ********************************************************************/
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    log(level: LogLevel, message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        if (import.meta.env.DEV) {
            console[level](message, data);
        }
    }

    debug(msg: string, data?: any) { this.log('debug', msg, data); }
    info(msg: string, data?: any)  { this.log('info',  msg, data); }
    warn(msg: string, data?: any)  { this.log('warn',  msg, data); }
    error(msg: string, data?: any) { this.log('error', msg, data); }

    getLastLogs(count = 10): LogEntry[] {
        return this.logs.slice(-count);
    }
    clearLogs() {
        this.logs = [];
    }
}

export const logger = new Logger();
