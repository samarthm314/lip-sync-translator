import React, { useState } from 'react';
import { Settings, User, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { AVATAR_MODELS } from '../models/Avatar.js';
import { SUPPORTED_LANGUAGES } from '../models/Language.js';

function Controls({ currentAvatar, languageManager, onAvatarChange, onLanguageChange, isVisible }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  if (!isVisible) {
    return null;
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleAvatarChange = (avatarId) => {
    onAvatarChange(avatarId);
  };

  const handleLanguageChange = (sourceCode, targetCode) => {
    onLanguageChange(sourceCode, targetCode);
  };

  const getCurrentLanguagePair = () => {
    if (!languageManager) return { source: 'en', target: 'es' };
    const source = languageManager.getSourceLanguage();
    const target = languageManager.getTargetLanguage();
    return { source: source.code, target: target.code };
  };

  const currentLanguages = getCurrentLanguagePair();

  return (
    <div className={`controls-overlay transition-all duration-300 ${
      isExpanded ? 'w-80' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-800">Settings</h3>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Avatar Selection */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('avatar')}
            className="flex items-center justify-between w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Avatar</span>
            </div>
            {activeSection === 'avatar' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {activeSection === 'avatar' && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="avatar-selector">
                {Object.values(AVATAR_MODELS).map((avatar) => (
                  <div
                    key={avatar.id}
                    onClick={() => handleAvatarChange(avatar.id)}
                    className={`avatar-option ${
                      currentAvatar === avatar.id ? 'selected' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="avatar-thumbnail bg-gray-100 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      {currentAvatar === avatar.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800">{avatar.name}</p>
                      <p className="text-xs text-gray-500">{avatar.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('language')}
            className="flex items-center justify-between w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Language</span>
            </div>
            {activeSection === 'language' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {activeSection === 'language' && (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="space-y-3">
                {/* Source Language */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Source Language
                  </label>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.values(SUPPORTED_LANGUAGES).map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code, currentLanguages.target)}
                        className={`language-option ${
                          currentLanguages.source === language.code ? 'bg-primary-50 text-primary-700' : ''
                        }`}
                      >
                        <span className="language-flag">{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                        {currentLanguages.source === language.code && (
                          <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Language */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Target Language
                  </label>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.values(SUPPORTED_LANGUAGES).map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(currentLanguages.source, language.code)}
                        className={`language-option ${
                          currentLanguages.target === language.code ? 'bg-primary-50 text-primary-700' : ''
                        }`}
                      >
                        <span className="language-flag">{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                        {currentLanguages.target === language.code && (
                          <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Pair Display */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <span>{SUPPORTED_LANGUAGES[currentLanguages.source]?.flag}</span>
                    <span>{SUPPORTED_LANGUAGES[currentLanguages.source]?.name}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span>{SUPPORTED_LANGUAGES[currentLanguages.target]?.flag}</span>
                    <span>{SUPPORTED_LANGUAGES[currentLanguages.target]?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {isExpanded && (
          <div className="space-y-2">
            <div className="p-2 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    const { source, target } = currentLanguages;
                    handleLanguageChange(target, source);
                  }}
                  className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  🔄 Swap Languages
                </button>
                <button
                  onClick={() => handleAvatarChange('default')}
                  className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  🎭 Reset Avatar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Current: {AVATAR_MODELS[currentAvatar]?.name}</p>
          <p>
            {SUPPORTED_LANGUAGES[currentLanguages.source]?.name} → {SUPPORTED_LANGUAGES[currentLanguages.target]?.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Controls; 