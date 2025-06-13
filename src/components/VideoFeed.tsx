'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWebcam } from '@/hooks/useWebcam';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDetectionStore } from '@/store/detection';
import { Detection } from '@/lib/types';

function VideoFeedComponent() {
    // Add client-side only state to prevent hydration mismatch
    const [isClient, setIsClient] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const {
        videoRef,
        canvasRef,
        startWebcam,
        stopWebcam,
        captureFrame,
    } = useWebcam();

    const { sendFrame, isConnected } = useWebSocket();
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const {
        isVideoActive,
        videoError,
        latestResult,
        isProcessing,
        setIsProcessing,
        targetFps,
        processAllFrames,
    } = useDetectionStore();

    // Frame processing queue untuk memastikan setiap frame diproses berurutan
    const frameQueueRef = useRef<Array<{ frameData: string; timestamp: number }>>([]);
    const isProcessingQueueRef = useRef(false);

    // Set client-side flag after component mounts
    useEffect(() => {
        setIsClient(true);
        setIsMounted(true);
    }, []);

    // Draw detection results
    useEffect(() => {
        if (!isMounted) return;

        if (latestResult) {
            console.log('🎨 Drawing detection results:', {
                faces: latestResult.faces,
                bodies: latestResult.bodies,
                facesCount: latestResult.faces?.length || 0,
                bodiesCount: latestResult.bodies?.length || 0
            });

            clearOverlay();

            // Draw faces (blue)
            if (latestResult.faces && latestResult.faces.length > 0) {
                console.log('🔵 Drawing faces:', latestResult.faces);
                drawDetections(latestResult.faces, '#3B82F6');
            }

            // Draw bodies (green)
            if (latestResult.bodies && latestResult.bodies.length > 0) {
                console.log('🟢 Drawing bodies:', latestResult.bodies);
                drawDetections(latestResult.bodies, '#10B981');
            }

            setIsProcessing(false);
        } else {
            console.log('⚠️ No latestResult available for drawing');
        }
    }, [latestResult, isMounted]);

    // Draw detection overlays - improved version
    const drawDetections = (detections: Detection[], color: string) => {
        if (!isMounted) {
            console.log('❌ Not mounted, skipping draw');
            return;
        }

        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) {
            console.log('❌ Missing canvas or video element');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.log('❌ Cannot get canvas context');
            return;
        }

        // Set canvas size to match video display size
        const rect = video.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        console.log('🎨 Canvas setup:', {
            canvasSize: { width: canvas.width, height: canvas.height },
            videoSize: { width: video.videoWidth, height: video.videoHeight },
            displaySize: { width: rect.width, height: rect.height },
            detectionsCount: detections.length
        });

        // Calculate scale factors
        const scaleX = rect.width / video.videoWidth;
        const scaleY = rect.height / video.videoHeight;

        console.log('📏 Scale factors:', { scaleX, scaleY });

        ctx.strokeStyle = color;
        ctx.lineWidth = 3; // Make lines thicker for visibility
        ctx.font = '14px Arial';
        ctx.fillStyle = color;

        detections.forEach((detection, index) => {
            console.log(`🎯 Drawing detection ${index}:`, detection);

            // Handle different bbox formats
            let bbox;
            if (Array.isArray(detection.bbox)) {
                bbox = detection.bbox;
            } else if (detection.bbox && typeof detection.bbox === 'object') {
                // Handle object format like {x1, y1, x2, y2}
                bbox = [detection.bbox.x1, detection.bbox.y1, detection.bbox.x2, detection.bbox.y2];
            } else {
                console.log('❌ Invalid bbox format:', detection.bbox);
                return;
            }

            const [x1, y1, x2, y2] = bbox;

            // Validate coordinates
            if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
                console.log('❌ Invalid coordinates:', { x1, y1, x2, y2 });
                return;
            }

            // Scale coordinates to display size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledX2 = x2 * scaleX;
            const scaledY2 = y2 * scaleY;

            const width = scaledX2 - scaledX1;
            const height = scaledY2 - scaledY1;

            console.log(`📦 Bounding box ${index}:`, {
                original: { x1, y1, x2, y2 },
                scaled: { x1: scaledX1, y1: scaledY1, x2: scaledX2, y2: scaledY2 },
                dimensions: { width, height }
            });

            // Draw bounding box
            ctx.strokeRect(scaledX1, scaledY1, width, height);

            // Draw label with class name if available
            const baseLabel = detection.class_name || detection.class || detection.type || 'Detection';
            const confidence = detection.confidence || 0;
            const label = `${baseLabel}: ${(confidence * 100).toFixed(1)}%`;
            const textWidth = ctx.measureText(label).width;

            // Background for text
            ctx.fillStyle = color;
            ctx.fillRect(scaledX1, scaledY1 - 25, textWidth + 8, 20);

            // Text
            ctx.fillStyle = 'white';
            ctx.fillText(label, scaledX1 + 4, scaledY1 - 8);

            console.log(`✅ Drew detection ${index} with label: ${label}`);
        });

        console.log(`🎨 Finished drawing ${detections.length} detections`);
    };

    // Clear overlay canvas
    const clearOverlay = () => {
        if (!isMounted) return;

        const canvas = overlayCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Process frame queue sequentially
    const processFrameQueue = async () => {
        if (isProcessingQueueRef.current || frameQueueRef.current.length === 0) {
            return;
        }

        isProcessingQueueRef.current = true;

        while (frameQueueRef.current.length > 0) {
            const frameItem = frameQueueRef.current.shift();
            if (!frameItem) break;

            try {
                console.log(`🔄 Processing queued frame (${frameQueueRef.current.length} remaining)`);
                const success = sendFrame(frameItem.frameData);

                if (!success) {
                    console.log('❌ Failed to send queued frame');
                    break; // Stop processing if send fails
                }

                // Small delay to prevent overwhelming the backend
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error('Error processing queued frame:', error);
                break;
            }
        }

        isProcessingQueueRef.current = false;
    };

    // Modified processFrame to use queue system
    const processFrame = () => {
        if (!videoRef.current || !canvasRef.current || !isMounted) {
            console.log('❌ Cannot process frame: missing refs or not mounted');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
            console.log('❌ Cannot process frame: invalid video dimensions or context');
            return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        console.log(`📸 Frame captured, adding to queue (mode: ${processAllFrames ? 'SEMUA FRAME' : 'SKIP FRAME'})`);

        // Add frame to queue with timestamp
        frameQueueRef.current.push({
            frameData,
            timestamp: Date.now()
        });

        // Limit queue size to prevent memory issues (max 10 frames)
        if (frameQueueRef.current.length > 10) {
            console.log('⚠️ Frame queue full, removing oldest frame');
            frameQueueRef.current.shift();
        }

        // Process queue
        processFrameQueue();
    };

    // Start frame processing interval - menggunakan setting processAllFrames
    useEffect(() => {
        if (!isMounted) return;

        // Get connection status from store instead of hook
        const { connectionStatus } = useDetectionStore.getState();
        const storeConnected = connectionStatus.connected;
        const socketConnected = isConnected();

        console.log('🔄 Frame processing effect triggered:', {
            isVideoActive,
            storeConnected,
            socketConnected,
            targetFps,
            processAllFrames
        });

        if (isVideoActive && storeConnected && socketConnected) {
            let interval: number;

            if (processAllFrames) {
                // Mode semua frame: interval lebih sering
                interval = Math.max(100, 1000 / targetFps); // Minimum 100ms
                console.log(`⏰ Starting SEMUA FRAME processing: ${interval}ms (${targetFps} FPS)`);
            } else {
                // Mode skip frame: interval lebih jarang
                interval = Math.max(500, 2000 / targetFps); // Minimum 500ms, lebih jarang
                console.log(`⏰ Starting SKIP FRAME processing: ${interval}ms (reduced frequency)`);
            }

            frameIntervalRef.current = setInterval(() => {
                console.log(`⏱️ Frame processing tick - mode: ${processAllFrames ? 'SEMUA' : 'SKIP'}`);
                processFrame();
            }, interval);

            return () => {
                if (frameIntervalRef.current) {
                    console.log('🛑 Clearing frame processing interval');
                    clearInterval(frameIntervalRef.current);
                    frameIntervalRef.current = null;
                }
                // Clear remaining queue
                frameQueueRef.current = [];
                isProcessingQueueRef.current = false;
            };
        } else {
            console.log('⏸️ Frame processing paused:', {
                videoActive: isVideoActive,
                storeConnected,
                socketConnected
            });
            // Clear queue when paused
            frameQueueRef.current = [];
            isProcessingQueueRef.current = false;
        }
    }, [isVideoActive, targetFps, processAllFrames, isMounted, useDetectionStore.getState().connectionStatus.connected]);

    // Handle video resize
    useEffect(() => {
        if (!isMounted) return;

        const handleResize = () => {
            if (latestResult) {
                clearOverlay();
                drawDetections(latestResult.faces, '#3B82F6');
                drawDetections(latestResult.bodies, '#10B981');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [latestResult, isMounted]);

    // Don't render anything until mounted
    if (!isMounted) {
        return (
            <div className="relative w-full max-w-4xl mx-auto">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
                        <div className="text-gray-400">Loading camera...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            {/* Video Element */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-auto"
                    autoPlay
                    muted
                    playsInline
                />

                {/* Detection Overlay Canvas */}
                <canvas
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />

                {/* Hidden Canvas for Frame Capture */}
                <canvas
                    ref={canvasRef}
                    className="hidden"
                />

                {/* Video Controls Overlay */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                    {!isVideoActive ? (
                        <button
                            onClick={startWebcam}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg border-2 border-green-500"
                        >
                            🎥 Start Camera
                        </button>
                    ) : (
                        <button
                            onClick={stopWebcam}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg border-2 border-red-500"
                        >
                            ⏹️ Stop Camera
                        </button>
                    )}
                </div>

                {/* Status Indicators */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    {/* Connection Status */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${useDetectionStore.getState().connectionStatus.connected
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                        }`}>
                        {useDetectionStore.getState().connectionStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}
                    </div>

                    {/* Processing Status */}
                    {isVideoActive && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium shadow-lg ${useDetectionStore.getState().isProcessing
                            ? 'bg-yellow-600 text-white'
                            : 'bg-blue-600 text-white'
                            }`}>
                            {useDetectionStore.getState().isProcessing ? '⏳ Processing...' : '✅ Ready'}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-20">
                        <div className="text-center text-white bg-gray-800 p-8 rounded-lg shadow-xl max-w-md">
                            <div className="text-6xl mb-4">⚠️</div>
                            <p className="text-lg font-semibold mb-4">📷 Camera Error</p>
                            <p className="text-sm text-gray-300 mb-6 leading-relaxed">{videoError}</p>

                            {/* Solutions */}
                            <div className="text-xs text-gray-400 mb-6 text-left bg-gray-700 p-4 rounded">
                                <div className="font-semibold mb-2">💡 Possible Solutions:</div>
                                <div className="space-y-1">
                                    <div>• Refresh the page and try again</div>
                                    <div>• Check if camera is connected</div>
                                    <div>• Close other apps using camera</div>
                                    <div>• Allow camera permission in browser</div>
                                    <div>• Use Chrome, Firefox, or Safari</div>
                                    <div>• Make sure you're on HTTPS or localhost</div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={startWebcam}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    🔄 Try Again
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                                >
                                    🔄 Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Video Placeholder */}
                {!isVideoActive && !videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                        <div className="text-center text-gray-400 max-w-md">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium mb-2">📷 Camera Not Active</p>
                            <p className="text-sm mb-4">Click the green "🎥 Start Camera" button to begin detection</p>

                            {/* Large Start Button in Center */}
                            <button
                                onClick={startWebcam}
                                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg border-2 border-green-500 mb-4"
                            >
                                🎥 Start Camera Now
                            </button>

                            <div className="text-xs text-gray-500 space-y-1">
                                <div>👆 Or use the button in the top-left corner</div>
                                <div>🔒 Browser will ask for camera permission</div>
                                <div>🌐 Make sure you're using HTTPS or localhost</div>

                                {/* Debug Info */}
                                <div className="mt-3 p-2 bg-gray-700 rounded text-left">
                                    <div className="text-xs font-mono">
                                        <div>🔍 Debug Info:</div>
                                        <div>• Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'unknown'}</div>
                                        <div>• Host: {typeof window !== 'undefined' ? window.location.host : 'unknown'}</div>
                                        <div>• MediaDevices: {typeof navigator !== 'undefined' && navigator.mediaDevices ? '✅' : '❌'}</div>
                                        <div>• getUserMedia: {typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia ? '✅' : '❌'}</div>
                                        <div>• HTTPS/Localhost: {typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '✅' : '❌'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default dynamic(() => Promise.resolve(VideoFeedComponent), { ssr: false }); 