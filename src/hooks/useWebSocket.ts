import { useEffect, useRef, useCallback } from 'react';
import { useDetectionStore } from '@/store/detection';
import { DetectionResult, WebSocketMessage } from '@/lib/types';

export const useWebSocket = () => {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const {
        setConnectionStatus,
        setLatestResult,
        settings,
    } = useDetectionStore();

    const connect = useCallback(() => {
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        // Only connect if we're in the browser
        if (typeof window === 'undefined') {
            return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

        try {
            socketRef.current = new WebSocket(wsUrl);

            socketRef.current.onopen = () => {
                console.log('WebSocket connected to:', wsUrl);
                setConnectionStatus({ connected: true });
            };

            socketRef.current.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setConnectionStatus({ connected: false });

                // Auto-reconnect after 3 seconds if not manually closed
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 3000);
                }
            };

            socketRef.current.onerror = (error) => {
                console.error('WebSocket connection error:', error);
                setConnectionStatus({
                    connected: false,
                    error: 'Connection failed - Backend mungkin belum berjalan'
                });
            };

            socketRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.event === 'connected') {
                        // Handle connection confirmation
                        setConnectionStatus({
                            connected: true,
                            client_id: message.data.client_id,
                            server_time: message.data.server_time,
                        });
                    } else if (message.event === 'detection_result') {
                        // Handle detection results
                        setLatestResult(message.data);
                    } else if (message.event === 'error') {
                        // Handle errors
                        console.error('WebSocket error:', message.data);
                        setConnectionStatus({
                            connected: true, // Still connected but with error
                            error: message.data.message,
                        });
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            setConnectionStatus({
                connected: false,
                error: 'Failed to create connection'
            });
        }
    }, [setConnectionStatus, setLatestResult]);

    const disconnect = useCallback(() => {
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.close(1000, 'Manual disconnect');
            socketRef.current = null;
            setConnectionStatus({ connected: false });
        }
    }, [setConnectionStatus]);

    const sendFrame = useCallback((frameData: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected');
            return false;
        }

        try {
            const message: WebSocketMessage = {
                event: 'process_frame',
                data: {
                    frame: frameData,
                    timestamp: Date.now(),
                    settings: {
                        confidence_threshold: settings.confidence_threshold,
                        crowd_threshold: settings.crowd_threshold,
                    },
                },
            };

            socketRef.current.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error sending frame:', error);
            return false;
        }
    }, [settings]);

    const isConnected = useCallback(() => {
        return socketRef.current?.readyState === WebSocket.OPEN || false;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        connect,
        disconnect,
        sendFrame,
        isConnected,
    };
}; 