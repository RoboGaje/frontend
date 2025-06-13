'use client';

import { useDetectionStore } from '@/store/detection';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';

export default function StatsPanel() {
    const {
        latestResult,
        statistics,
        connectionStatus,
        settings,
        targetFps,
        setTargetFps,
        updateSettings,
    } = useDetectionStore();

    const { isConnected, connect } = useWebSocket();

    const crowdLevel = latestResult?.crowd_analysis?.crowd_level || 'empty';
    const crowdColor = latestResult?.crowd_analysis?.color || '#6B7280';

    const getCrowdLevelText = (level: string) => {
        const levels = {
            empty: 'Empty',
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            very_high: 'Very High'
        };
        return levels[level as keyof typeof levels] || 'Unknown';
    };

    // Use consistent connection status
    const isActuallyConnected = connectionStatus.connected && isConnected();

    // Debug logging
    useEffect(() => {
        console.log('📊 StatsPanel - Connection Status Debug:', {
            'connectionStatus.connected': connectionStatus.connected,
            'isConnected()': isConnected(),
            'isActuallyConnected': isActuallyConnected,
            'client_id': connectionStatus.client_id,
            'error': connectionStatus.error
        });
    }, [connectionStatus, isConnected, isActuallyConnected]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Detection Statistics</h2>

            {/* Connection Status */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Connection</h3>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                    <span className="text-sm">
                        {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                    </span>
                    {connectionStatus.client_id && (
                        <span className="text-xs text-gray-500">
                            ID: {connectionStatus.client_id.slice(0, 8)}...
                        </span>
                    )}
                </div>
                {connectionStatus.error && (
                    <div className="text-xs text-red-600 mt-1">
                        {connectionStatus.error}
                    </div>
                )}

                {/* Debug Info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <div>🔍 Debug:</div>
                    <div>Store Connected: {connectionStatus.connected ? '✅' : '❌'}</div>
                    <div>Socket Connected: {isConnected() ? '✅' : '❌'}</div>
                    <div>WebSocket URL: {process.env.NEXT_PUBLIC_WS_URL}</div>

                    {/* Manual Connection Test */}
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={() => {
                                console.log('🔄 Manual WebSocket connection test...');
                                connect();
                            }}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                            🔄 Test Connect
                        </button>
                        <button
                            onClick={() => {
                                console.log('🧪 Testing backend API...');
                                fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/models/info')
                                    .then(res => res.json())
                                    .then(data => console.log('✅ Backend API response:', data))
                                    .catch(err => console.error('❌ Backend API error:', err));
                            }}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                            🧪 Test API
                        </button>
                    </div>
                </div>
            </div>

            {/* Current Detection */}
            {latestResult && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">Current Detection</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-md">
                            <div className="text-2xl font-bold text-blue-600">
                                {latestResult.faces.length}
                            </div>
                            <div className="text-sm text-blue-700">Faces</div>
                        </div>

                        <div className="bg-green-50 p-3 rounded-md">
                            <div className="text-2xl font-bold text-green-600">
                                {latestResult.bodies.length}
                            </div>
                            <div className="text-sm text-green-700">Bodies</div>
                        </div>
                    </div>

                    {/* Crowd Analysis */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Crowd Level</span>
                            <div
                                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: crowdColor }}
                            >
                                {getCrowdLevelText(crowdLevel)}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Total People:</span>
                                <span className="font-medium">{latestResult.crowd_analysis.total_people}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Density Score:</span>
                                <span className="font-medium">
                                    {(latestResult.crowd_analysis.density_score * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Face/Body Ratio:</span>
                                <span className="font-medium">
                                    {latestResult.crowd_analysis.face_to_body_ratio.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Processing Info */}
                    <div className="bg-purple-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-purple-700">Processing Time</span>
                            <span className="text-lg font-bold text-purple-600">
                                {latestResult.processing_time.toFixed(3)}s
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Overall Statistics */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Session Statistics</h3>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Frames Processed:</span>
                        <span className="font-medium">{statistics.frames_processed}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Average Latency:</span>
                        <span className="font-medium">{statistics.processing_latency.toFixed(3)}s</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Target FPS:</span>
                        <span className="font-medium">{targetFps}</span>
                    </div>
                </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Settings</h3>

                <div className="space-y-3">
                    {/* Confidence Threshold */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Confidence Threshold: {settings.confidence_threshold.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={settings.confidence_threshold}
                            onChange={(e) => updateSettings({
                                confidence_threshold: parseFloat(e.target.value)
                            })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Crowd Threshold */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Crowd Alert Threshold: {settings.crowd_threshold}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={settings.crowd_threshold}
                            onChange={(e) => updateSettings({
                                crowd_threshold: parseInt(e.target.value)
                            })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Target FPS */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">
                            Target FPS: {targetFps}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="15"
                            step="1"
                            value={targetFps}
                            onChange={(e) => setTargetFps(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Detection Legend</h3>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500"></div>
                        <span>Faces</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-green-500"></div>
                        <span>Bodies</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 