'use client';

import { useDetectionStore } from '@/store/detection';
import { useWebSocket } from '@/hooks/useWebSocket';
import { DensityInfo, FrameStatistics } from '@/lib/types';

export default function StatsPanel() {
    const {
        latestResult,
        connectionStatus,
        settings,
        updateSettings,
        statistics
    } = useDetectionStore();

    const { isConnected, connect, disconnect, sendFrame } = useWebSocket();

    // Get detection data from latest result with proper typing
    const faces = latestResult?.faces || [];
    const bodies = latestResult?.bodies || [];
    const densityInfo = (latestResult?.density_info || {}) as DensityInfo;
    const frameStatistics = (latestResult?.statistics || {}) as FrameStatistics;

    // Calculate face class distribution for display with proper typing
    const faceClassDist = densityInfo.face_class_distribution || {};
    const totalFacesInFrame = Object.values(faceClassDist).reduce((sum: number, count: unknown) => {
        return sum + (typeof count === 'number' ? count : 0);
    }, 0);

    // Check if we're connecting (when not connected but no error)
    const isConnecting = !connectionStatus.connected && !connectionStatus.error;

    // Test functions
    const handleTestConnection = () => {
        if (connectionStatus.connected) {
            console.log('🔌 Testing disconnect...');
            disconnect();
        } else {
            console.log('🔌 Testing connection...');
            connect();
        }
    };

    const handleTestFrame = () => {
        if (!connectionStatus.connected) {
            alert('❌ WebSocket tidak terhubung! Hubungkan dulu sebelum test frame.');
            return;
        }

        // Create a simple test frame (1x1 pixel black image in base64)
        const testFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

        console.log('🧪 Sending test frame...');
        const success = sendFrame(testFrame);

        if (success) {
            alert('✅ Test frame berhasil dikirim! Periksa console untuk response.');
        } else {
            alert('❌ Gagal mengirim test frame!');
        }
    };

    const handleClearStats = () => {
        if (confirm('🗑️ Yakin ingin menghapus semua statistik?')) {
            // Reset statistics in store
            useDetectionStore.getState().reset();
            console.log('🧹 Statistics cleared');
            alert('✅ Statistik berhasil dihapus!');
        }
    };

    const handleExportStats = () => {
        const exportData = {
            timestamp: new Date().toISOString(),
            connectionStatus,
            latestResult,
            statistics,
            settings
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `detection-stats-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('📊 Statistics exported');
        alert('✅ Statistik berhasil diekspor!');
    };

    return (
        <div className="space-y-4">
            {/* Test Controls */}
            <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Controls</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleTestConnection}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${connectionStatus.connected
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                    >
                        {connectionStatus.connected ? '🔌 Test Disconnect' : '🔌 Test Connect'}
                    </button>

                    <button
                        onClick={handleTestFrame}
                        disabled={!connectionStatus.connected}
                        className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors"
                    >
                        🧪 Test Frame
                    </button>

                    <button
                        onClick={handleClearStats}
                        className="px-3 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        🗑️ Clear Stats
                    </button>

                    <button
                        onClick={handleExportStats}
                        className="px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        📊 Export Stats
                    </button>
                </div>

                {/* Debug Info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-3">
                    <div>🔍 Debug:</div>
                    <div>Store Connected: {connectionStatus.connected ? '✅' : '❌'}</div>
                    <div>Socket Connected: {isConnected() ? '✅' : '❌'}</div>
                    <div>WebSocket URL: {process.env.NEXT_PUBLIC_WS_URL}</div>
                    <div>Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL}</div>
                    <div>Current Host: {typeof window !== 'undefined' ? window.location.host : 'unknown'}</div>

                    {/* Manual Connection Test */}
                    <div className="mt-2 flex gap-2 flex-wrap">
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
                                fetch((process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000') + '/api/models/info')
                                    .then(res => res.json())
                                    .then(data => console.log('✅ Backend API response:', data))
                                    .catch(err => console.error('❌ Backend API error:', err));
                            }}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                            🧪 Test API
                        </button>
                        <button
                            onClick={() => {
                                console.log('🔄 Force refresh page...');
                                window.location.reload();
                            }}
                            className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                        >
                            🔄 Refresh
                        </button>
                        <button
                            onClick={() => {
                                console.log('🎬 Manual frame processing test...');
                                // Get video element and try to capture frame
                                const videoElements = document.querySelectorAll('video');
                                if (videoElements.length > 0) {
                                    const video = videoElements[0] as HTMLVideoElement;
                                    console.log('📹 Video found:', {
                                        readyState: video.readyState,
                                        videoWidth: video.videoWidth,
                                        videoHeight: video.videoHeight,
                                        currentTime: video.currentTime
                                    });

                                    // Try to capture frame manually
                                    const canvas = document.createElement('canvas');
                                    canvas.width = video.videoWidth;
                                    canvas.height = video.videoHeight;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                        ctx.drawImage(video, 0, 0);
                                        const frameData = canvas.toDataURL('image/jpeg', 0.8);
                                        console.log('📸 Manual frame captured, size:', frameData.length);

                                        // Send frame via WebSocket using the hook
                                        console.log('📡 Sending frame via WebSocket...');
                                        const success = sendFrame(frameData);
                                        console.log('📡 Frame send result:', success);

                                        if (success) {
                                            console.log('✅ Frame sent successfully!');
                                        } else {
                                            console.log('❌ Failed to send frame');
                                        }
                                    }
                                } else {
                                    console.log('❌ No video element found');
                                }
                            }}
                            className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                        >
                            🎬 Test Frame
                        </button>
                        <button
                            onClick={() => {
                                console.log('🚀 Force start frame processing...');
                                // Trigger frame processing manually
                                const videoElements = document.querySelectorAll('video');
                                if (videoElements.length > 0) {
                                    const video = videoElements[0] as HTMLVideoElement;
                                    if (video.readyState === 4) { // HAVE_ENOUGH_DATA
                                        console.log('🎯 Starting continuous frame processing...');

                                        const processInterval = setInterval(() => {
                                            const canvas = document.createElement('canvas');
                                            canvas.width = video.videoWidth;
                                            canvas.height = video.videoHeight;
                                            const ctx = canvas.getContext('2d');
                                            if (ctx) {
                                                ctx.drawImage(video, 0, 0);
                                                const frameData = canvas.toDataURL('image/jpeg', 0.8);
                                                const success = sendFrame(frameData);
                                                console.log('🔄 Auto frame sent:', success);
                                            }
                                        }, 1000); // 1 FPS for testing

                                        // Stop after 10 seconds
                                        setTimeout(() => {
                                            clearInterval(processInterval);
                                            console.log('⏹️ Stopped auto frame processing');
                                        }, 10000);
                                    }
                                }
                            }}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                            🚀 Auto Process
                        </button>
                        <button
                            onClick={() => {
                                console.log('🔍 Testing with very low face confidence threshold...');
                                // Get video element and try to capture frame
                                const videoElements = document.querySelectorAll('video');
                                if (videoElements.length > 0) {
                                    const video = videoElements[0] as HTMLVideoElement;
                                    console.log('📹 Video found:', {
                                        readyState: video.readyState,
                                        videoWidth: video.videoWidth,
                                        videoHeight: video.videoHeight,
                                        currentTime: video.currentTime
                                    });

                                    // Try to capture frame manually
                                    const canvas = document.createElement('canvas');
                                    canvas.width = video.videoWidth;
                                    canvas.height = video.videoHeight;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                        ctx.drawImage(video, 0, 0);
                                        const frameData = canvas.toDataURL('image/jpeg', 0.8);
                                        console.log('📸 Manual frame captured, size:', frameData.length);

                                        // Send frame with very low face confidence threshold
                                        console.log('📡 Sending frame with VERY LOW face confidence threshold (0.1)...');

                                        // Temporarily update settings to use very low face confidence
                                        const originalSettings = { ...settings };
                                        updateSettings({
                                            face_confidence_threshold: 0.1,  // Very low for face
                                            body_confidence_threshold: settings.body_confidence_threshold  // Keep body as is
                                        });

                                        // Send frame using the hook
                                        const success = sendFrame(frameData);
                                        console.log('📡 Low face confidence frame send result:', success);

                                        // Restore original settings after a delay
                                        setTimeout(() => {
                                            updateSettings(originalSettings);
                                            console.log('⚙️ Settings restored to original values');
                                        }, 2000);

                                        if (success) {
                                            console.log('✅ Low face confidence frame sent successfully!');
                                        } else {
                                            console.log('❌ Failed to send low face confidence frame');
                                        }
                                    }
                                } else {
                                    console.log('❌ No video element found');
                                }
                            }}
                            className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                        >
                            🔍 Low Face Conf
                        </button>
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Connection Status</h3>
                <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${connectionStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                        <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
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
                    {connectionStatus.client_id && (
                        <div className="text-xs text-gray-500">
                            Client ID: {connectionStatus.client_id}
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
                                    <span className="font-medium text-blue-600">
                                        {typeof count === 'number' ? count : 0}
                                    </span>
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
            {frameStatistics && frameStatistics.total_frames > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Session Statistics</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Frames:</span>
                            <span className="font-medium">{frameStatistics.total_frames}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Faces:</span>
                            <span className="font-medium text-blue-600">{frameStatistics.total_faces}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Bodies:</span>
                            <span className="font-medium text-green-600">{frameStatistics.total_bodies}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg Faces/Frame:</span>
                            <span className="font-medium">{frameStatistics.avg_faces_per_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg Bodies/Frame:</span>
                            <span className="font-medium">{frameStatistics.avg_bodies_per_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Max Faces:</span>
                            <span className="font-medium">{frameStatistics.max_faces_in_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Max Bodies:</span>
                            <span className="font-medium">{frameStatistics.max_bodies_in_frame}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg Processing:</span>
                            <span className="font-medium">{frameStatistics.avg_processing_time}s</span>
                        </div>
                    </div>

                    {/* Confidence Statistics */}
                    {(frameStatistics.face_confidence_stats?.avg || frameStatistics.body_confidence_stats?.avg) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">Confidence Stats:</div>
                            {frameStatistics.face_confidence_stats?.avg && (
                                <div className="text-xs space-y-1">
                                    <div className="text-gray-600">Face Confidence:</div>
                                    <div className="flex justify-between">
                                        <span>Avg: {frameStatistics.face_confidence_stats.avg}</span>
                                        <span>Range: {frameStatistics.face_confidence_stats.min}-{frameStatistics.face_confidence_stats.max}</span>
                                    </div>
                                </div>
                            )}
                            {frameStatistics.body_confidence_stats?.avg && (
                                <div className="text-xs space-y-1 mt-2">
                                    <div className="text-gray-600">Body Confidence:</div>
                                    <div className="flex justify-between">
                                        <span>Avg: {frameStatistics.body_confidence_stats.avg}</span>
                                        <span>Range: {frameStatistics.body_confidence_stats.min}-{frameStatistics.body_confidence_stats.max}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Face Class Distribution (Overall) */}
                    {frameStatistics.face_class_distribution && Object.keys(frameStatistics.face_class_distribution).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-sm font-medium text-gray-700 mb-2">Overall Face Distribution:</div>
                            <div className="space-y-1">
                                {Object.entries(frameStatistics.face_class_distribution).map(([className, count]) => (
                                    <div key={className} className="flex justify-between text-xs">
                                        <span className="text-gray-600 capitalize">{className}:</span>
                                        <span className="font-medium text-blue-600">
                                            {typeof count === 'number' ? count : 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Basic Statistics (fallback) */}
            {(!frameStatistics || !frameStatistics.total_frames) && statistics.frames_processed > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Statistics</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Frames Processed:</span>
                            <span className="font-medium">{statistics.frames_processed}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Average Latency:</span>
                            <span className="font-medium">{statistics.processing_latency.toFixed(3)}s</span>
                        </div>
                    </div>
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