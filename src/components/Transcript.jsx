import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare, Languages } from 'lucide-react';

function Transcript({ transcripts, translations, isVisible }) {
  const [activeTab, setActiveTab] = useState('transcript');
  const [isExpanded, setIsExpanded] = useState(false);
  const transcriptRef = useRef(null);
  const translationRef = useRef(null);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  useEffect(() => {
    if (translationRef.current) {
      translationRef.current.scrollTop = translationRef.current.scrollHeight;
    }
  }, [translations]);

  if (!isVisible) {
    return null;
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLanguageFlag = (languageCode) => {
    const flags = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷'
    };
    return flags[languageCode] || '🌐';
  };

  return (
    <div className={`transcript-overlay transition-all duration-300 ${
      isExpanded ? 'h-96' : 'h-48'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-800">Live Conversation</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Tab buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'transcript'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setActiveTab('translation')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'translation'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Translation
            </button>
          </div>
          
          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div
            ref={transcriptRef}
            className="h-full overflow-y-auto space-y-2 pr-2"
          >
            {transcripts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No transcripts yet</p>
                <p className="text-sm">Start speaking to see live transcripts</p>
              </div>
            ) : (
              transcripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className={`p-3 rounded-lg border ${
                    transcript.source === 'local'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {getLanguageFlag(transcript.language)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {transcript.source === 'local' ? 'You' : 'Peer'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(transcript.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {transcript.source === 'local' ? (
                        <Mic className="w-3 h-3 text-blue-600" />
                      ) : (
                        <MicOff className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {transcript.text}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Translation Tab */}
        {activeTab === 'translation' && (
          <div
            ref={translationRef}
            className="h-full overflow-y-auto space-y-3 pr-2"
          >
            {translations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No translations yet</p>
                <p className="text-sm">Translations will appear here</p>
              </div>
            ) : (
              translations.map((translation) => (
                <div
                  key={translation.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Languages className="w-4 h-4 text-primary-600" />
                      <span className="text-xs text-gray-500">
                        {formatTime(translation.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Original</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {translation.original}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Translation</p>
                      <p className="text-sm text-primary-700 bg-primary-50 p-2 rounded font-medium">
                        {translation.translated}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {activeTab === 'transcript' 
            ? `${transcripts.length} transcript${transcripts.length !== 1 ? 's' : ''}`
            : `${translations.length} translation${translations.length !== 1 ? 's' : ''}`
          }
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transcript; 