'use client';

import { useDetectionStore } from '@/store/detection';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function StatsPanel() {
    const {
        detectionResults,
        connectionStatus,
        settings,
        updateSettings
    } = useDetectionStore();

    const { isConnecting } = useWebSocket();

    // Get latest detection result
    const latestResult = detectionResults[detectionResults.length - 1];
    const faces = latestResult?.faces || [];
    const bodies = latestResult?.bodies || [];
    const densityInfo = latestResult?.density_info || {};
    const statistics = latestResult?.statistics || {};

    // Calculate face class distribution for display
    const faceClassDist = densityInfo.face_class_distribution || {};
    const totalFacesInFrame = Object.values(faceClassDist).reduce((sum: number, count: number) => sum + count, 0);

    return (
        <div className="space-y-4">
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Connection Status</h3>
                <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${connectionStatus.connected ? 'text-green-600' : 'text-red-600'
                        }`}>
                        <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                        <span className="font-medium">
                            {isConnecting ? 'Connecting...' :
                                connectionStatus.connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    {connectionStatus.error && (
                        <div className="text-sm text-red-600">
                            Error: {connectionStatus.error}
                        </div>
                    )}
                </div>
            </div>

            {/* Current Frame Detection */}
            <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Frame</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Faces:</span>
                        <span className="ml-2 font-bold text-blue-600">{faces.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Bodies:</span>
                        <span className="ml-2 font-bold text-green-600">{bodies.length}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Crowd Level:</span>
                        <span className={`ml-2 font-bold ${densityInfo.crowd_level === 'Empty' ? 'text-gray-500' :
                                densityInfo.crowd_level === 'Low' ? 'text-green-500' :
                                    densityInfo.crowd_level === 'Medium' ? 'text-yellow-500' :
                                        densityInfo.crowd_level === 'High' ? 'text-orange-500' :
                                            'text-red-500'
                            }`}>
                            {densityInfo.crowd_level || 'Unknown'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Intensity:</span>
                        <span className="ml-2 font-bold text-purple-600">
                            {densityInfo.crowd_intensity || 0}%
                        </span>
                    </div>
                </div>

                {/* Face Class Distribution */}
                {totalFacesInFrame > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Face Recognition:</div>
                        <div className="space-y-1">
                            {Object.entries(faceClassDist).map(([className, count]) => (
                                <div key={className} className="flex justify-between text-xs">
                                    <span className="text-gray-600 capitalize">{className}:</span>
                                    <span className="font-medium text-blue-600">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Density Analysis */}
            <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Density Analysis</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">People Density:</span>
                        <span className="font-medium">{densityInfo.people_density || 0} /Mpx</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Area Coverage:</span>
                        <span className="font-medium">{densityInfo.area_coverage || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Face-Body Ratio:</span>
                        <span className="font-medium">{densityInfo.face_body_ratio || 0}</span>
                    </div>
                    {latestResult?.processing_time && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Processing Time:</span>
                            <span className="font-medium">{latestResult.processing_time}s</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Statistics */}
            {statistics.total_frames > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Session Statistics</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Frames:</span>
                            <span className="font-medium">{statistics.total_frames}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Faces:</span>
                            <span className="font-medium text-blue-600">{statistics.total_faces}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Bodies:</span>
                            <span className="font-medium text-green-600">{statistics.total_bodies}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg Faces/Frame:</span>
                            <span className="font-medium">{statistics.avg_faces_per_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg Bodies/Frame:</span>
                            <span className="font-medium">{statistics.avg_bodies_per_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Max Faces:</span>
                            <span className="font-medium">{statistics.max_faces_in_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Max Bodies:</span>
                            <span className="font-medium">{statistics.max_bodies_in_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg Processing:</span>
                            <span className="font-medium">{statistics.avg_processing_time}s</span>
                        </div>
                    </div>

                    {/* Confidence Statistics */}
                    {(statistics.face_confidence_stats?.avg || statistics.body_confidence_stats?.avg) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">Confidence Stats:</div>
                            {statistics.face_confidence_stats?.avg && (
                                <div className="text-xs space-y-1">
                                    <div className="text-gray-600">Face Confidence:</div>
                                    <div className="flex justify-between">
                                        <span>Avg: {statistics.face_confidence_stats.avg}</span>
                                        <span>Range: {statistics.face_confidence_stats.min}-{statistics.face_confidence_stats.max}</span>
                                    </div>
                                </div>
                            )}
                            {statistics.body_confidence_stats?.avg && (
                                <div className="text-xs space-y-1 mt-2">
                                    <div className="text-gray-600">Body Confidence:</div>
                                    <div className="flex justify-between">
                                        <span>Avg: {statistics.body_confidence_stats.avg}</span>
                                        <span>Range: {statistics.body_confidence_stats.min}-{statistics.body_confidence_stats.max}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Face Class Distribution (Overall) */}
                    {statistics.face_class_distribution && Object.keys(statistics.face_class_distribution).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">Overall Face Distribution:</div>
                            <div className="space-y-1">
                                {Object.entries(statistics.face_class_distribution).map(([className, count]) => (
                                    <div key={className} className="flex justify-between text-xs">
                                        <span className="text-gray-600 capitalize">{className}:</span>
                                        <span className="font-medium text-blue-600">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Detection Settings */}
            <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Detection Settings</h3>

                {/* Face Confidence */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700">
                            Face Confidence: {settings.face_confidence_threshold}
                        </label>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={settings.face_confidence_threshold}
                        onChange={(e) => updateSettings({
                            face_confidence_threshold: parseFloat(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                {/* Body Confidence */}
                <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700">
                            Body Confidence: {settings.body_confidence_threshold}
                        </label>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={settings.body_confidence_threshold}
                        onChange={(e) => updateSettings({
                            body_confidence_threshold: parseFloat(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                {/* Crowd Threshold */}
                <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700">
                            Crowd Alert: {settings.crowd_threshold} people
                        </label>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={settings.crowd_threshold}
                        onChange={(e) => updateSettings({
                            crowd_threshold: parseInt(e.target.value)
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>
            </div>
        </div>
    );
}