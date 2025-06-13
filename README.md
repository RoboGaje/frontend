# 🤖 Robotika UAS - Frontend

Frontend aplikasi untuk Real-time Face Detection & Crowd Analysis menggunakan Next.js 14.

## 🚀 Features

- **Real-time Video Feed**: Live webcam dengan overlay detection
- **Face Detection**: Deteksi wajah dengan bounding box biru
- **Body Detection**: Deteksi tubuh dengan bounding box hijau
- **Crowd Analysis**: Analisis kepadatan dengan 5 level (empty, low, medium, high, very high)
- **Alert System**: Notifikasi real-time ketika threshold terlampaui
- **Statistics Panel**: Monitoring performa dan statistik
- **Configurable Settings**: Threshold dan FPS yang dapat disesuaikan
- **WebSocket Communication**: Komunikasi real-time dengan backend

## 🛠️ Technology Stack

- **Next.js 14**: React framework dengan App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.IO Client**: WebSocket communication
- **Zustand**: State management
- **Lucide React**: Modern icons

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables

Buat file `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_CROWD_THRESHOLD=10
```

### Settings

- **Confidence Threshold**: 0.1 - 1.0 (default: 0.5)
- **Crowd Alert Threshold**: 1 - 50 (default: 10)
- **Target FPS**: 1 - 15 (default: 5)

## 🎯 Usage

1. **Start Backend**: Pastikan backend FastAPI berjalan di port 8000
2. **Open Browser**: Akses http://localhost:3000
3. **Start Camera**: Click "Start Camera" untuk memulai deteksi
4. **View Results**: Lihat detection overlay dan statistics panel
5. **Configure**: Sesuaikan settings di panel kanan

## 📱 Components

### VideoFeed
- Menampilkan live video dari webcam
- Overlay detection dengan canvas
- Controls untuk start/stop camera
- Status indicators

### StatsPanel
- Current detection counts
- Crowd analysis information
- Session statistics
- Settings controls
- Detection legend

### AlertSystem
- Real-time notifications
- Dismissible alerts
- Different alert levels (info, warning, error, critical)
- Toggle visibility

## 🔌 WebSocket Protocol

### Client → Server
```json
{
  "event": "process_frame",
  "data": {
    "frame": "base64_image_data",
    "timestamp": 1234567890,
    "settings": {
      "confidence_threshold": 0.5,
      "crowd_threshold": 10
    }
  }
}
```

### Server → Client
```json
{
  "event": "detection_result",
  "data": {
    "faces": [...],
    "bodies": [...],
    "crowd_analysis": {...},
    "alerts": [...],
    "processing_time": 0.123,
    "timestamp": 1234567890
  }
}
```

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-friendly layout
- **Real-time Updates**: Live statistics dan detection overlay
- **Modern Interface**: Clean dan intuitive design
- **Dark/Light Elements**: Kontras yang baik untuk visibility
- **Smooth Animations**: Transition dan loading states
- **Error Handling**: User-friendly error messages

## 📊 Performance

- **Optimized Rendering**: Canvas-based detection overlay
- **Efficient State Management**: Zustand untuk minimal re-renders
- **Frame Rate Control**: Configurable FPS untuk performance tuning
- **Memory Management**: Proper cleanup dan resource management

## 🔍 Troubleshooting

### Camera Issues
- Pastikan browser memiliki permission untuk camera
- Check apakah camera tidak digunakan aplikasi lain
- Try refresh page atau restart browser

### Connection Issues
- Pastikan backend server berjalan
- Check network connectivity
- Verify WebSocket URL di environment variables

### Performance Issues
- Reduce target FPS jika processing lambat
- Check browser console untuk errors
- Monitor memory usage di DevTools

## 📝 Development

### Project Structure
```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── hooks/              # Custom hooks
├── lib/                # Utilities dan types
└── store/              # Zustand stores
```

### Key Files
- `hooks/useWebSocket.ts`: WebSocket connection management
- `hooks/useWebcam.ts`: Webcam access dan frame capture
- `store/detection.ts`: Global state management
- `components/VideoFeed.tsx`: Main video component
- `components/StatsPanel.tsx`: Statistics display
- `components/AlertSystem.tsx`: Notification system

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t robotika-frontend .
docker run -p 3000:3000 robotika-frontend
```

### Manual
```bash
npm run build
npm start
```

## 📄 License

MIT License - Robotika UAS Project
 