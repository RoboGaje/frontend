export interface Detection {
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
    confidence: number;
    type: 'face' | 'body';
    class_id?: number;
    class_name?: string;
}

export interface CrowdAnalysis {
    face_count: number;
    body_count: number;
    total_people: number;
    crowd_level: 'empty' | 'low' | 'medium' | 'high' | 'very_high';
    density_score: number;
    color: string;
    face_to_body_ratio: number;
    should_alert: boolean;
    level_info: {
        min: number;
        max: number;
        description: string;
    };
}

export interface DensityInfo {
    people_count: number;
    face_count: number;
    people_density: number;
    crowd_level: 'Empty' | 'Low' | 'Medium' | 'High' | 'Very High';
    crowd_intensity: number;
    face_body_ratio: number;
    area_coverage: number;
    face_class_distribution: Record<string, number>;
}

export interface ConfidenceStats {
    avg: number;
    min: number;
    max: number;
}

export interface FrameStatistics {
    total_frames: number;
    total_faces: number;
    total_bodies: number;
    avg_faces_per_frame: number;
    avg_bodies_per_frame: number;
    max_faces_in_frame: number;
    max_bodies_in_frame: number;
    avg_processing_time: number;
    face_class_distribution: Record<string, number>;
    face_confidence_stats?: ConfidenceStats;
    body_confidence_stats?: ConfidenceStats;
    recent_crowd_level_distribution: Record<string, number>;
}

export interface Alert {
    type: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    crowd_level?: string;
    timestamp: number;
}

export interface DetectionResult {
    faces: Detection[];
    bodies: Detection[];
    crowd_analysis: CrowdAnalysis;
    density_info?: DensityInfo;
    statistics?: FrameStatistics;
    alerts: Alert[];
    processing_time: number;
    timestamp: number;
    frame_info: {
        width: number;
        height: number;
        channels: number;
    };
}

export interface WebSocketMessage {
    event: string;
    data: any;
}

export interface ConnectionStatus {
    connected: boolean;
    client_id?: string;
    server_time?: string;
    error?: string;
}

export interface DetectionSettings {
    face_confidence_threshold: number;
    body_confidence_threshold: number;
    crowd_threshold: number;
}

export interface Statistics {
    frames_processed: number;
    average_fps: number;
    processing_latency: number;
    connection_duration: number;
} 