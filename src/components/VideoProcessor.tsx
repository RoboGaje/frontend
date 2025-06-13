'use client';

import { useState, useRef } from 'react';
import { useDetectionStore } from '@/store/detection';

interface ProcessingStats {
    total_frames: number;
    processed_frames: number;
    total_faces: number;
    total_bodies: number;
    processing_time: number;
}

export default function VideoProcessor() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { settings } = useDetectionStore();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('video/')) {
                setError('Please select a video file');
                return;
            }

            // Validate file size (max 100MB)
            if (file.size > 100 * 1024 * 1024) {
                setError('File size must be less than 100MB');
                return;
            }

            setSelectedFile(file);
            setError(null);
            setProcessedVideoUrl(null);
            setProcessingStats(null);
        }
    };

    const processVideo = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('video_file', selectedFile);
            formData.append('face_confidence', settings.face_confidence_threshold.toString());
            formData.append('body_confidence', settings.body_confidence_threshold.toString());

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/process-video`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            // Get processing stats from headers
            const statsHeader = response.headers.get('X-Processing-Stats');
            if (statsHeader) {
                try {
                    const stats = JSON.parse(statsHeader.replace(/'/g, '"'));
                    setProcessingStats(stats);
                } catch (e) {
                    console.warn('Failed to parse processing stats');
                }
            }

            // Create blob URL for processed video
            const blob = await response.blob();
            const videoUrl = URL.createObjectURL(blob);
            setProcessedVideoUrl(videoUrl);

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadProcessedVideo = () => {
        if (!processedVideoUrl || !selectedFile) return;

        const link = document.createElement('a');
        link.href = processedVideoUrl;
        link.download = `processed_${selectedFile.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetProcessor = () => {
        setSelectedFile(null);
        setProcessedVideoUrl(null);
        setProcessingStats(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Video Processor</h2>
                <div className="text-sm text-gray-500">
                    Upload video untuk diproses dengan face & body detection
                </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isProcessing}
                    />

                    {!selectedFile ? (
                        <div className="space-y-2">
                            <div className="text-4xl">🎬</div>
                            <div className="text-lg font-medium text-gray-700">
                                Select Video File
                            </div>
                            <div className="text-sm text-gray-500">
                                MP4, AVI, MOV (max 100MB)
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                disabled={isProcessing}
                            >
                                Choose File
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-2xl">📹</div>
                            <div className="text-lg font-medium text-gray-700">
                                {selectedFile.name}
                            </div>
                            <div className="text-sm text-gray-500">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                                    disabled={isProcessing}
                                >
                                    Change
                                </button>
                                <button
                                    onClick={resetProcessor}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                                    disabled={isProcessing}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Display */}
                {selectedFile && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Processing Settings:</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Face Confidence:</span>
                                <span className="ml-2 font-medium">{settings.face_confidence_threshold}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Body Confidence:</span>
                                <span className="ml-2 font-medium">{settings.body_confidence_threshold}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Process Button */}
                {selectedFile && !processedVideoUrl && (
                    <button
                        onClick={processVideo}
                        disabled={isProcessing}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${isProcessing
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Processing Video...
                            </div>
                        ) : (
                            '🚀 Process Video'
                        )}
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-red-600">❌</span>
                        <span className="text-red-800 font-medium">Error:</span>
                    </div>
                    <div className="text-red-700 mt-1">{error}</div>
                </div>
            )}

            {/* Processing Stats */}
            {processingStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-800 font-medium mb-2">📊 Processing Results:</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-blue-600">Total Frames:</span>
                            <span className="ml-2 font-medium">{processingStats.total_frames}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Processed:</span>
                            <span className="ml-2 font-medium">{processingStats.processed_frames}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Faces Found:</span>
                            <span className="ml-2 font-medium">{processingStats.total_faces}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Bodies Found:</span>
                            <span className="ml-2 font-medium">{processingStats.total_bodies}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-blue-600">Processing Time:</span>
                            <span className="ml-2 font-medium">{processingStats.processing_time.toFixed(2)}s</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Processed Video Display */}
            {processedVideoUrl && (
                <div className="space-y-4">
                    <div className="text-lg font-medium text-gray-700">✅ Processed Video:</div>

                    <video
                        src={processedVideoUrl}
                        controls
                        className="w-full max-h-96 bg-black rounded-lg"
                    >
                        Your browser does not support video playback.
                    </video>

                    <div className="flex gap-2">
                        <button
                            onClick={downloadProcessedVideo}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            📥 Download
                        </button>
                        <button
                            onClick={resetProcessor}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            🔄 Process Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 