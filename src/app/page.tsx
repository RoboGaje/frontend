'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDetectionStore } from '@/store/detection';

// Dynamic imports to prevent hydration issues
const VideoFeed = dynamic(() => import('@/components/VideoFeed'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center">
        <div className="text-gray-400">Loading video feed...</div>
      </div>
    </div>
  )
});

const StatsPanel = dynamic(() => import('@/components/StatsPanel'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-gray-400">Loading stats...</div>
    </div>
  )
});

const AlertSystem = dynamic(() => import('@/components/AlertSystem'), {
  ssr: false
});

export default function Home() {
  const { connect, disconnect } = useWebSocket();
  const { connectionStatus } = useDetectionStore();
  const [isMounted, setIsMounted] = useState(false);

  // Auto-connect to WebSocket on mount
  useEffect(() => {
    if (isMounted) {
      console.log('🚀 Page mounted, attempting WebSocket connection...');

      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        console.log('⏰ Connecting to WebSocket after delay...');
        connect();
      }, 1000);

      return () => {
        clearTimeout(timer);
        console.log('🧹 Page unmounting, disconnecting WebSocket...');
        disconnect();
      };
    }
  }, [connect, disconnect, isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto max-w-7xl">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Robotika UAS
            </h1>
            <p className="text-xl text-gray-600">
              Real-time Face Detection & Crowd Analysis
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Feed */}
            <div className="lg:col-span-2">
              <div className="w-full max-w-4xl mx-auto">
                <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-gray-400">Loading application...</div>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-gray-400">Loading...</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Robotika UAS
          </h1>
          <p className="text-xl text-gray-600">
            Real-time Face Detection & Crowd Analysis
          </p>

          {/* Connection Status */}
          <div className="mt-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${connectionStatus.connected
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              {connectionStatus.error && ` - ${connectionStatus.error}`}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <VideoFeed />
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel />
          </div>
        </div>

        {/* Alert System */}
        <AlertSystem />

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-500">
          <p>Powered by YOLO v12 & Next.js</p>
        </footer>
      </div>
    </main>
  );
}
