import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Wifi, WifiOff, Users } from 'lucide-react';

function CallUI({ 
  isCallActive, 
  isConnected, 
  isRecording, 
  onStartCall, 
  onJoinCall, 
  onEndCall, 
  onStartRecording, 
  onStopRecording 
}) {
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);

  const getConnectionStatus = () => {
    if (!isCallActive) return 'disconnected';
    if (isConnected) return 'connected';
    return 'connecting';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-100';
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const status = getConnectionStatus();

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Top Section - Connection Status */}
      <div className="flex items-start justify-between">
        {/* Connection Status */}
        <div className="connection-status pointer-events-auto">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status)}
            <div>
              <p className="text-sm font-medium text-gray-800">
                {status === 'connected' ? 'Connected' : 
                 status === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </p>
              <p className="text-xs text-gray-500">
                {isCallActive ? 'Peer-to-Peer Call' : 'Ready to connect'}
              </p>
            </div>
          </div>
          
          {showConnectionInfo && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <p>WebRTC Connection</p>
              <p>Local Network</p>
              <p>Low Latency</p>
            </div>
          )}
          
          <button
            onClick={() => setShowConnectionInfo(!showConnectionInfo)}
            className="mt-1 text-xs text-primary-600 hover:text-primary-700"
          >
            {showConnectionInfo ? 'Hide' : 'Show'} Info
          </button>
        </div>

        {/* Call Duration (if active) */}
        {isCallActive && (
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg pointer-events-auto">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800">Call Duration</p>
              <p className="text-lg font-mono text-primary-600">
                <CallTimer isActive={isCallActive} />
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Center Section - Main Call Controls */}
      <div className="flex justify-center">
        {!isCallActive ? (
          /* Pre-call controls */
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg pointer-events-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Lip-Sync Translator
                </h2>
                <p className="text-gray-600 mb-6">
                  Start a real-time translation call with 3D avatar lip-sync
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onStartCall}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Start Call</span>
                </button>
                
                <button
                  onClick={onJoinCall}
                  className="btn-outline flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Join Call</span>
                </button>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Real-time speech translation</p>
                <p>• 3D avatar lip-sync</p>
                <p>• Peer-to-peer connection</p>
                <p>• On-device AI processing</p>
              </div>
            </div>
          </div>
        ) : (
          /* Active call controls */
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg pointer-events-auto">
            <div className="text-center space-y-4">
              {/* Recording Status */}
              {isRecording && (
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording</span>
                </div>
              )}
              
              {/* Main Control Buttons */}
              <div className="flex items-center justify-center space-x-4">
                {/* Recording Button */}
                <button
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>
                
                {/* End Call Button */}
                <button
                  onClick={onEndCall}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
              
              {/* Status Text */}
              <div className="text-sm text-gray-600">
                {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section - Additional Info */}
      <div className="flex justify-center">
        {isCallActive && (
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg pointer-events-auto">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'connected' ? 'bg-green-500' :
                  status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-gray-600">
                  {status === 'connected' ? 'Connected' : 
                   status === 'connecting' ? 'Connecting' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Mic className={`w-4 h-4 ${
                  isRecording ? 'text-red-500' : 'text-gray-400'
                }`} />
                <span className="text-gray-600">
                  {isRecording ? 'Recording' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Call timer component
function CallTimer({ isActive }) {
  const [seconds, setSeconds] = useState(0);

  React.useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return <span>{formatTime(seconds)}</span>;
}

export default CallUI; 