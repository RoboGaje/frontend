'use client';

import { useState, useRef } from 'react';
import { useDetectionStore } from '@/store/detection';

interface ProcessingStats {
    total_frames: number;
    processed_frames: number;
    detection_processed_frames: number;
    total_faces: number;
    total_bodies: number;
    processing_time: number;
    avg_faces_per_frame: number;
    avg_bodies_per_frame: number;
    max_faces_in_frame: number;
    max_bodies_in_frame: number;
}

export default function VideoProcessor() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
    const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processAllFrames, setProcessAllFrames] = useState(true); // Default: proses semua frame

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

            // Tambahkan parameter process_all_frames
            const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/process-video`);
            url.searchParams.append('process_all_frames', processAllFrames.toString());

            const response = await fetch(url.toString(), {
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

                {/* Processing Mode Selection */}
                {selectedFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-blue-800 mb-3">🎯 Mode Pemrosesan:</div>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="processing_mode"
                                    checked={processAllFrames}
                                    onChange={() => setProcessAllFrames(true)}
                                    disabled={isProcessing}
                                    className="text-blue-600"
                                />
                                <div>
                                    <div className="font-medium text-blue-900">🎯 Proses Semua Frame</div>
                                    <div className="text-xs text-blue-700">Akurasi maksimal - setiap frame diproses (lebih lambat)</div>
                                </div>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="processing_mode"
                                    checked={!processAllFrames}
                                    onChange={() => setProcessAllFrames(false)}
                                    disabled={isProcessing}
                                    className="text-blue-600"
                                />
                                <div>
                                    <div className="font-medium text-blue-900">⚡ Mode Cepat</div>
                                    <div className="text-xs text-blue-700">Skip beberapa frame untuk performa (lebih cepat)</div>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Settings Display */}
                {selectedFile && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">⚙️ Processing Settings:</div>
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
                        <div className="mt-2 text-xs text-gray-600">
                            Mode: <span className="font-medium">{processAllFrames ? 'Semua Frame' : 'Skip Frame'}</span>
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
                                {processAllFrames ? 'Memproses Semua Frame...' : 'Memproses Video (Mode Cepat)...'}
                            </div>
                        ) : (
                            `🚀 ${processAllFrames ? 'Proses Semua Frame' : 'Proses Video (Cepat)'}`
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
                    <div className="text-blue-800 font-medium mb-2">📊 Hasil Pemrosesan:</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-blue-600">Total Frames:</span>
                            <span className="ml-2 font-medium">{processingStats.total_frames}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Frames Diproses:</span>
                            <span className="ml-2 font-medium">{processingStats.processed_frames}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Deteksi Dijalankan:</span>
                            <span className="ml-2 font-medium">{processingStats.detection_processed_frames || processingStats.processed_frames}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Total Faces:</span>
                            <span className="ml-2 font-medium">{processingStats.total_faces}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Total Bodies:</span>
                            <span className="ml-2 font-medium">{processingStats.total_bodies}</span>
                        </div>
                        <div>
                            <span className="text-blue-600">Waktu Proses:</span>
                            <span className="ml-2 font-medium">{processingStats.processing_time.toFixed(2)}s</span>
                        </div>
                        {processingStats.avg_faces_per_frame !== undefined && (
                            <>
                                <div>
                                    <span className="text-blue-600">Rata-rata Faces:</span>
                                    <span className="ml-2 font-medium">{processingStats.avg_faces_per_frame}/frame</span>
                                </div>
                                <div>
                                    <span className="text-blue-600">Rata-rata Bodies:</span>
                                    <span className="ml-2 font-medium">{processingStats.avg_bodies_per_frame}/frame</span>
                                </div>
                                <div>
                                    <span className="text-blue-600">Max Faces:</span>
                                    <span className="ml-2 font-medium">{processingStats.max_faces_in_frame}</span>
                                </div>
                                <div>
                                    <span className="text-blue-600">Max Bodies:</span>
                                    <span className="ml-2 font-medium">{processingStats.max_bodies_in_frame}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Processed Video Display */}
            {processedVideoUrl && (
                <div className="space-y-4">
                    <div className="text-lg font-medium text-gray-700">✅ Video Hasil Pemrosesan:</div>

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