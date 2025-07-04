'use client';

import { useDetectionStore } from '@/store/detection';
import { useWebSocket } from '@/hooks/useWebSocket';
import { DensityInfo, FrameStatistics } from '@/lib/types';
import React from 'react';

export default function StatsPanel() {
    const {
        latestResult,
        connectionStatus,
        settings,
        updateSettings,
        statistics,
        isProcessing,
        targetFps,
        setTargetFps,
        processAllFrames,
        setProcessAllFrames,
    } = useDetectionStore();

    const { isConnected, connect, disconnect, sendFrame } = useWebSocket();

    // Get detection data from latest result with proper typing
    const faces = latestResult?.faces || [];
    const bodies = latestResult?.bodies || [];
    const densityInfo = (latestResult?.density_info || {}) as DensityInfo;
    const frameStatistics = (latestResult?.statistics || {}) as FrameStatistics;

    // Debug logging untuk melihat struktur data
    React.useEffect(() => {
        if (latestResult) {
            console.log('🔍 StatsPanel - Latest Result:', {
                faces: latestResult.faces,
                bodies: latestResult.bodies,
                facesStructure: latestResult.faces?.[0],
                bodiesStructure: latestResult.bodies?.[0],
                densityInfo: latestResult.density_info,
                timestamp: latestResult.timestamp
            });
        }
    }, [latestResult]);

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
                        <button
                            onClick={() => {
                                console.log('🧪 Testing bounding box rendering with dummy data...');

                                // Create dummy detection result
                                const dummyResult = {
                                    faces: [
                                        {
                                            bbox: [100, 100, 200, 200] as [number, number, number, number],
                                            confidence: 0.95,
                                            type: 'face' as const,
                                            class_name: 'test_face'
                                        }
                                    ],
                                    bodies: [
                                        {
                                            bbox: [80, 80, 250, 300] as [number, number, number, number],
                                            confidence: 0.85,
                                            type: 'body' as const,
                                            class_name: 'person'
                                        }
                                    ],
                                    crowd_analysis: {
                                        face_count: 1,
                                        body_count: 1,
                                        total_people: 1,
                                        crowd_level: 'low' as const,
                                        density_score: 0.2,
                                        color: '#10B981',
                                        face_to_body_ratio: 1.0,
                                        should_alert: false,
                                        level_info: {
                                            min: 1,
                                            max: 2,
                                            description: 'Test'
                                        }
                                    },
                                    density_info: {
                                        people_count: 1,
                                        face_count: 1,
                                        people_density: 3.25,
                                        crowd_level: 'Low' as const,
                                        crowd_intensity: 25,
                                        face_body_ratio: 1.0,
                                        area_coverage: 60.24,
                                        face_class_distribution: { 'test_face': 1 }
                                    },
                                    alerts: [],
                                    processing_time: 0.1,
                                    timestamp: Date.now(),
                                    frame_info: {
                                        width: 640,
                                        height: 480,
                                        channels: 3
                                    }
                                };

                                console.log('🎯 Setting dummy detection result:', dummyResult);

                                // Update store with dummy data
                                useDetectionStore.getState().setLatestResult(dummyResult);

                                console.log('✅ Dummy detection result set! Check if bounding boxes appear.');
                            }}
                            className="px-2 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600"
                        >
                            🧪 Test Bbox
                        </button>
                        <button
                            onClick={() => {
                                console.log('🧹 Clearing overlay canvas...');

                                // Find and clear overlay canvas
                                const canvases = document.querySelectorAll('canvas');
                                canvases.forEach((canvas, index) => {
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        console.log(`🧹 Cleared canvas ${index}`);
                                    }
                                });

                                // Also clear store
                                useDetectionStore.getState().reset();

                                console.log('✅ All canvases cleared!');
                            }}
                            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                            🧹 Clear Canvas
                        </button>
                        <button
                            onClick={() => {
                                console.log('👁️ Testing canvas visibility...');

                                // Find overlay canvas and draw test rectangle
                                const canvases = document.querySelectorAll('canvas');
                                console.log(`Found ${canvases.length} canvas elements`);

                                canvases.forEach((canvas, index) => {
                                    const rect = canvas.getBoundingClientRect();
                                    console.log(`Canvas ${index}:`, {
                                        width: canvas.width,
                                        height: canvas.height,
                                        displaySize: { width: rect.width, height: rect.height },
                                        position: { top: rect.top, left: rect.left },
                                        zIndex: window.getComputedStyle(canvas).zIndex,
                                        visibility: window.getComputedStyle(canvas).visibility,
                                        display: window.getComputedStyle(canvas).display
                                    });

                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                        // Draw test rectangle
                                        ctx.strokeStyle = 'red';
                                        ctx.lineWidth = 5;
                                        ctx.strokeRect(50, 50, 100, 100);

                                        // Draw test text
                                        ctx.fillStyle = 'yellow';
                                        ctx.font = '20px Arial';
                                        ctx.fillText(`Canvas ${index}`, 60, 80);

                                        console.log(`✅ Drew test rectangle on canvas ${index}`);
                                    }
                                });
                            }}
                            className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                        >
                            👁️ Test Canvas
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

            {/* Settings */}
            <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">⚙️ Settings</h3>
                <div className="space-y-4">
                    {/* Confidence Thresholds */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Face Confidence
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={settings.face_confidence_threshold}
                                onChange={(e) => updateSettings({ face_confidence_threshold: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-500 text-center">
                                {settings.face_confidence_threshold}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Body Confidence
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={settings.body_confidence_threshold}
                                onChange={(e) => updateSettings({ body_confidence_threshold: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-500 text-center">
                                {settings.body_confidence_threshold}
                            </div>
                        </div>
                    </div>

                    {/* Frame Rate Control */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target FPS
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={targetFps}
                            onChange={(e) => setTargetFps(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">
                            {targetFps} FPS
                        </div>
                    </div>

                    {/* Processing Mode Control */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                            🎯 Mode Pemrosesan Real-time
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="realtime_processing_mode"
                                    checked={processAllFrames}
                                    onChange={() => setProcessAllFrames(true)}
                                    className="text-blue-600"
                                />
                                <div className="text-sm">
                                    <div className="font-medium text-blue-900">🎯 Proses Semua Frame</div>
                                    <div className="text-xs text-blue-700">Akurasi maksimal - setiap frame diproses</div>
                                </div>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="realtime_processing_mode"
                                    checked={!processAllFrames}
                                    onChange={() => setProcessAllFrames(false)}
                                    className="text-blue-600"
                                />
                                <div className="text-sm">
                                    <div className="font-medium text-blue-900">⚡ Mode Cepat</div>
                                    <div className="text-xs text-blue-700">Skip beberapa frame untuk performa</div>
                                </div>
                            </label>
                        </div>
                        <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                            <strong>Status:</strong> {processAllFrames ? 'Semua frame akan diproses berurutan' : 'Frame akan di-skip untuk performa'}
                        </div>
                    </div>

                    {/* Crowd Threshold */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Crowd Threshold
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={settings.crowd_threshold}
                            onChange={(e) => updateSettings({ crowd_threshold: parseInt(e.target.value) })}
                            className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">
                            {settings.crowd_threshold} people
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}