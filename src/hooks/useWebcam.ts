import { useRef, useCallback, useEffect } from 'react';
import { useDetectionStore } from '@/store/detection';

export const useWebcam = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const {
        setIsVideoActive,
        setVideoError,
        isVideoActive,
    } = useDetectionStore();

    const startWebcam = useCallback(async () => {
        try {
            console.log('🎥 Starting webcam...');
            setVideoError(null);

            // Check if browser supports getUserMedia with fallback
            if (!navigator.mediaDevices?.getUserMedia) {
                // Try legacy getUserMedia
                const getUserMedia = navigator.getUserMedia ||
                    (navigator as any).webkitGetUserMedia ||
                    (navigator as any).mozGetUserMedia;

                if (!getUserMedia) {
                    throw new Error('Browser tidak mendukung akses kamera. Silakan gunakan browser modern seperti Chrome, Firefox, atau Safari.');
                }
            }

            console.log('📱 Requesting camera permission...');

            // Use modern API if available, otherwise fallback
            let stream: MediaStream;

            if (navigator.mediaDevices?.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user',
                    },
                    audio: false,
                });
            } else {
                // Legacy fallback (wrapped in Promise)
                stream = await new Promise<MediaStream>((resolve, reject) => {
                    const getUserMedia = navigator.getUserMedia ||
                        (navigator as any).webkitGetUserMedia ||
                        (navigator as any).mozGetUserMedia;

                    getUserMedia.call(navigator, {
                        video: {
                            width: 640,
                            height: 480,
                        },
                        audio: false,
                    }, resolve, reject);
                });
            }

            console.log('✅ Camera permission granted, stream obtained');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                videoRef.current.onloadedmetadata = () => {
                    console.log('📹 Video metadata loaded, starting playback');
                    videoRef.current?.play().then(() => {
                        console.log('▶️ Video playback started');
                        setIsVideoActive(true);
                    }).catch((playError) => {
                        console.error('❌ Video play error:', playError);
                        setVideoError('Gagal memulai video playback');
                    });
                };

                videoRef.current.onerror = (error) => {
                    console.error('❌ Video element error:', error);
                    setVideoError('Error pada video element');
                };
            }
        } catch (error) {
            console.error('❌ Error accessing webcam:', error);

            let errorMessage = 'Gagal mengakses kamera';

            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Akses kamera ditolak. Silakan izinkan akses kamera di browser dan refresh halaman.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'Kamera tidak ditemukan. Pastikan kamera terhubung dan tidak digunakan aplikasi lain.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.';
                } else if (error.name === 'OverconstrainedError') {
                    errorMessage = 'Kamera tidak mendukung resolusi yang diminta. Mencoba dengan pengaturan default...';

                    // Try with simpler constraints
                    try {
                        const simpleStream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: false,
                        });

                        if (videoRef.current) {
                            videoRef.current.srcObject = simpleStream;
                            streamRef.current = simpleStream;
                            setIsVideoActive(true);
                            return; // Success with simple constraints
                        }
                    } catch (retryError) {
                        errorMessage = 'Kamera tidak kompatibel dengan aplikasi ini.';
                    }
                } else if (error.name === 'SecurityError') {
                    errorMessage = 'Akses kamera diblokir karena alasan keamanan. Pastikan menggunakan HTTPS atau localhost.';
                } else {
                    errorMessage = error.message;
                }
            }

            setVideoError(errorMessage);
            setIsVideoActive(false);
        }
    }, [setIsVideoActive, setVideoError]);

    const stopWebcam = useCallback(() => {
        console.log('⏹️ Stopping webcam...');

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped track:', track.kind);
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsVideoActive(false);
        console.log('✅ Webcam stopped');
    }, [setIsVideoActive]);

    const captureFrame = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current || !isVideoActive) {
            return null;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        try {
            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.error('Error capturing frame:', error);
            return null;
        }
    }, [isVideoActive]);

    const getVideoElement = useCallback(() => videoRef.current, []);
    const getCanvasElement = useCallback(() => canvasRef.current, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam();
        };
    }, [stopWebcam]);

    return {
        videoRef,
        canvasRef,
        startWebcam,
        stopWebcam,
        captureFrame,
        getVideoElement,
        getCanvasElement,
    };
}; 