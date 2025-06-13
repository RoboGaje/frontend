export interface Detection {
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
    confidence: number;
    type: 'face' | 'body';
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
    confidence_threshold: number;
    crowd_threshold: number;
}

export interface Statistics {
    frames_processed: number;
    average_fps: number;
    processing_latency: number;
    connection_duration: number;
} 