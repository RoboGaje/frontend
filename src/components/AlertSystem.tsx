'use client';

import { useEffect, useState } from 'react';
import { useDetectionStore } from '@/store/detection';
import { Alert } from '@/lib/types';
import { X, AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

export default function AlertSystem() {
    const { latestResult, showAlerts, setShowAlerts } = useDetectionStore();
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    // Update active alerts when new results come in
    useEffect(() => {
        if (latestResult?.alerts && latestResult.alerts.length > 0) {
            const newAlerts = latestResult.alerts.filter(alert => {
                const alertKey = `${alert.type}-${alert.timestamp}`;
                return !dismissedAlerts.has(alertKey);
            });

            if (newAlerts.length > 0) {
                setActiveAlerts(prev => {
                    // Remove old alerts of the same type and add new ones
                    const filtered = prev.filter(alert =>
                        !newAlerts.some(newAlert => newAlert.type === alert.type)
                    );
                    return [...filtered, ...newAlerts];
                });
            }
        }
    }, [latestResult, dismissedAlerts]);

    // Auto-dismiss info alerts after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveAlerts(prev =>
                prev.filter(alert => alert.level !== 'info' ||
                    Date.now() - alert.timestamp < 5000)
            );
        }, 5000);

        return () => clearTimeout(timer);
    }, [activeAlerts]);

    const dismissAlert = (alert: Alert) => {
        const alertKey = `${alert.type}-${alert.timestamp}`;
        setDismissedAlerts(prev => new Set([...prev, alertKey]));
        setActiveAlerts(prev => prev.filter(a => a !== alert));
    };

    const dismissAllAlerts = () => {
        setActiveAlerts([]);
        setDismissedAlerts(new Set());
    };

    const getAlertIcon = (level: string) => {
        switch (level) {
            case 'critical':
                return <XCircle className="w-5 h-5" />;
            case 'error':
                return <AlertCircle className="w-5 h-5" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5" />;
            case 'info':
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getAlertStyles = (level: string) => {
        switch (level) {
            case 'critical':
                return 'bg-red-100 border-red-500 text-red-800';
            case 'error':
                return 'bg-red-50 border-red-400 text-red-700';
            case 'warning':
                return 'bg-yellow-50 border-yellow-400 text-yellow-700';
            case 'info':
            default:
                return 'bg-blue-50 border-blue-400 text-blue-700';
        }
    };

    if (!showAlerts || activeAlerts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            {/* Alert Toggle */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAlerts(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                >
                    Hide Alerts
                </button>
            </div>

            {/* Active Alerts */}
            <div className="space-y-2">
                {activeAlerts.map((alert, index) => (
                    <div
                        key={`${alert.type}-${alert.timestamp}-${index}`}
                        className={`
              border-l-4 p-4 rounded-md shadow-lg backdrop-blur-sm
              ${getAlertStyles(alert.level)}
              animate-in slide-in-from-right duration-300
            `}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getAlertIcon(alert.level)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-sm">
                                        {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)} Alert
                                    </div>
                                    <div className="text-sm mt-1">
                                        {alert.message}
                                    </div>
                                    {alert.crowd_level && (
                                        <div className="text-xs mt-2 opacity-75">
                                            Crowd Level: {alert.crowd_level.replace('_', ' ').toUpperCase()}
                                        </div>
                                    )}
                                    <div className="text-xs mt-1 opacity-60">
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => dismissAlert(alert)}
                                className="flex-shrink-0 ml-2 text-current opacity-60 hover:opacity-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dismiss All Button */}
            {activeAlerts.length > 1 && (
                <div className="flex justify-end">
                    <button
                        onClick={dismissAllAlerts}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                        Dismiss All
                    </button>
                </div>
            )}
        </div>
    );
}

// Alert Toggle Button Component
export function AlertToggle() {
    const { showAlerts, setShowAlerts } = useDetectionStore();

    return (
        <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`
        fixed bottom-4 right-4 z-40 p-3 rounded-full shadow-lg
        ${showAlerts
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }
        transition-colors duration-200
      `}
            title={showAlerts ? 'Hide Alerts' : 'Show Alerts'}
        >
            {showAlerts ? (
                <X className="w-5 h-5" />
            ) : (
                <AlertTriangle className="w-5 h-5" />
            )}
        </button>
    );
} 