import { useRef, useCallback, useEffect } from 'react';
import { useDetectionStore } from '@/store/detection';
import { DetectionResult, WebSocketMessage } from '@/lib/types';

export const useWebSocket = () => {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);
    const maxReconnectAttempts = 5;

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
            console.log('🔗 WebSocket already connected');
            return;
        }

        // Close existing connection if any
        if (socketRef.current) {
            console.log('🧹 Closing existing WebSocket connection...');
            socketRef.current.close();
            socketRef.current = null;
        }

        // Only connect if we're in the browser
        if (typeof window === 'undefined') {
            console.log('⚠️ Not in browser environment, skipping WebSocket connection');
            return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
        console.log('🚀 Attempting WebSocket connection to:', wsUrl);
        console.log('🔄 Reconnect attempt:', reconnectAttemptsRef.current + 1);

        try {
            // Set connecting status
            setConnectionStatus({
                connected: false,
                error: 'Connecting...'
            });

            console.log('🔧 Creating new WebSocket instance...');
            socketRef.current = new WebSocket(wsUrl);

            // Add timeout for connection
            const connectionTimeout = setTimeout(() => {
                if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
                    console.log('⏰ WebSocket connection timeout');
                    socketRef.current.close();
                    setConnectionStatus({
                        connected: false,
                        error: 'Connection timeout'
                    });
                }
            }, 10000); // 10 second timeout

            socketRef.current.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ WebSocket connected successfully to:', wsUrl);
                console.log('📊 WebSocket readyState:', socketRef.current?.readyState);
                reconnectAttemptsRef.current = 0; // Reset reconnect attempts
                setConnectionStatus({
                    connected: true,
                    error: null
                });
            };

            socketRef.current.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log('❌ WebSocket disconnected:', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });

                setConnectionStatus({
                    connected: false,
                    error: `Disconnected (${event.code}): ${event.reason || 'Unknown reason'}`
                });

                // Auto-reconnect if not manually closed and under attempt limit
                if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000); // Exponential backoff
                    console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    console.log('❌ Max reconnection attempts reached');
                    setConnectionStatus({
                        connected: false,
                        error: 'Connection failed after multiple attempts. Please refresh the page.'
                    });
                }
            };

            socketRef.current.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('❌ WebSocket connection error:', error);
                console.log('📊 WebSocket readyState on error:', socketRef.current?.readyState);
                setConnectionStatus({
                    connected: false,
                    error: 'Connection failed - Check if backend is running'
                });
            };

            socketRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('📨 WebSocket message received:', message.event, message.data);

                    if (message.event === 'connected') {
                        // Handle connection confirmation
                        console.log('🎉 Connection confirmed by server:', message.data);
                        setConnectionStatus({
                            connected: true,
                            client_id: message.data.client_id,
                            server_time: message.data.server_time,
                            error: null
                        });
                    } else if (message.event === 'detection_result') {
                        // Handle detection results
                        console.log('🔍 Detection result received:', {
                            faces: message.data.faces?.length || 0,
                            bodies: message.data.bodies?.length || 0,
                            processing_time: message.data.processing_time
                        });
                        setLatestResult(message.data);
                    } else if (message.event === 'error') {
                        // Handle errors
                        console.error('❌ WebSocket server error:', message.data);
                        setConnectionStatus({
                            connected: true, // Still connected but with error
                            error: message.data.message,
                        });
                    } else {
                        console.log('📝 Unknown message event:', message.event);
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data);
                }
            };

            console.log('🎯 WebSocket instance created, waiting for connection...');

        } catch (error) {
            console.error('❌ Error creating WebSocket connection:', error);
            setConnectionStatus({
                connected: false,
                error: 'Failed to create connection: ' + (error as Error).message
            });
        }
    }, [setConnectionStatus, setLatestResult]);

    const disconnect = useCallback(() => {
        console.log('🛑 Manually disconnecting WebSocket...');

        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Reset reconnect attempts
        reconnectAttemptsRef.current = 0;

        if (socketRef.current) {
            socketRef.current.close(1000, 'Manual disconnect');
            socketRef.current = null;
            setConnectionStatus({ connected: false, error: null });
        }
    }, [setConnectionStatus]);

    const sendFrame = useCallback((frameData: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not connected, cannot send frame');
            console.log('📊 WebSocket state:', {
                exists: !!socketRef.current,
                readyState: socketRef.current?.readyState,
                CONNECTING: WebSocket.CONNECTING,
                OPEN: WebSocket.OPEN,
                CLOSING: WebSocket.CLOSING,
                CLOSED: WebSocket.CLOSED
            });
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

            console.log('📤 Sending frame for processing...', {
                timestamp: message.data.timestamp,
                settings: message.data.settings,
                frameSize: frameData.length,
                framePreview: frameData.substring(0, 50) + '...'
            });

            socketRef.current.send(JSON.stringify(message));
            console.log('✅ Frame message sent successfully');
            return true;
        } catch (error) {
            console.error('❌ Error sending frame:', error);
            return false;
        }
    }, [settings]);

    const isConnected = useCallback(() => {
        const connected = socketRef.current?.readyState === WebSocket.OPEN || false;
        console.log('🔍 Checking connection status:', connected, 'ReadyState:', socketRef.current?.readyState);
        return connected;
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