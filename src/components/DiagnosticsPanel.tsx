import React from 'react';
import { logger } from '../lib/logger';
import { AlertTriangle, Bug, Info, Terminal } from 'lucide-react';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DiagnosticsPanelProps {
    showLogs?: boolean;
    maxLogs?: number;
}

const LOG_ICONS: Record<LogLevel, React.ReactNode> = {
    debug: <Terminal className="h-4 w-4 text-gray-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
    warn: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
    error: <AlertTriangle className="h-4 w-4 text-red-400" />
};

const DiagnosticsPanel = ({ showLogs = true, maxLogs = 5 }: DiagnosticsPanelProps) => {
    const logs = logger.getLastLogs(maxLogs);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <Bug className="h-4 w-4" />
                <span>Diagnostics</span>
            </div>
            {showLogs && logs.length > 0 && (
                <div className="space-y-2 text-sm">
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            className={`
                                flex items-start gap-2 p-2 rounded-lg
                                ${
                                    log.level === 'error'
                                        ? 'bg-red-500/10 text-red-400'
                                        : log.level === 'warn'
                                        ? 'bg-yellow-500/10 text-yellow-400'
                                        : log.level === 'info'
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : 'bg-white/5 text-gray-400'
                                }
                            `}
                        >
                            {LOG_ICONS[log.level as LogLevel]}
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{log.message}</span>
                                    <span className="text-xs opacity-60">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                {log.data && (
                                    <pre className="text-xs opacity-80 overflow-x-auto">
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DiagnosticsPanel;
