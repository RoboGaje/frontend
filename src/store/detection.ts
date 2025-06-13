import { create } from 'zustand';
import { DetectionResult, ConnectionStatus, DetectionSettings, Statistics } from '@/lib/types';

interface DetectionStore {
    // Connection state
    connectionStatus: ConnectionStatus;
    setConnectionStatus: (status: ConnectionStatus) => void;

    // Detection results
    latestResult: DetectionResult | null;
    setLatestResult: (result: DetectionResult) => void;

    // Settings
    settings: DetectionSettings;
    updateSettings: (settings: Partial<DetectionSettings>) => void;

    // Statistics
    statistics: Statistics;
    updateStatistics: (stats: Partial<Statistics>) => void;

    // UI state
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;

    showAlerts: boolean;
    setShowAlerts: (show: boolean) => void;

    // Video state
    isVideoActive: boolean;
    setIsVideoActive: (active: boolean) => void;

    videoError: string | null;
    setVideoError: (error: string | null) => void;

    // Frame rate control
    targetFps: number;
    setTargetFps: (fps: number) => void;

    // Reset functions
    reset: () => void;
}

interface DetectionSettings {
    face_confidence_threshold: number;
    body_confidence_threshold: number;
    crowd_threshold: number;
}

const initialState = {
    connectionStatus: { connected: false },
    latestResult: null,
    settings: {
        face_confidence_threshold: 0.3,
        body_confidence_threshold: 0.5,
        crowd_threshold: parseInt(process.env.NEXT_PUBLIC_CROWD_THRESHOLD || '10'),
    },
    statistics: {
        frames_processed: 0,
        average_fps: 0,
        processing_latency: 0,
        connection_duration: 0,
    },
    isProcessing: false,
    showAlerts: true,
    isVideoActive: false,
    videoError: null,
    targetFps: 5,
};

export const useDetectionStore = create<DetectionStore>((set, get) => ({
    ...initialState,

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    setLatestResult: (result) => {
        set({ latestResult: result });

        // Update statistics
        const currentStats = get().statistics;
        set({
            statistics: {
                ...currentStats,
                frames_processed: currentStats.frames_processed + 1,
                processing_latency: result.processing_time,
            }
        });
    },

    updateSettings: (newSettings) =>
        set((state) => ({
            settings: { ...state.settings, ...newSettings }
        })),

    updateStatistics: (stats) =>
        set((state) => ({
            statistics: { ...state.statistics, ...stats }
        })),

    setIsProcessing: (processing) => set({ isProcessing: processing }),

    setShowAlerts: (show) => set({ showAlerts: show }),

    setIsVideoActive: (active) => set({ isVideoActive: active }),

    setVideoError: (error) => set({ videoError: error }),

    setTargetFps: (fps) => set({ targetFps: fps }),

    reset: () => set(initialState),
})); 