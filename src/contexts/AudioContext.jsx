/**
 * Контекст для управления аудио-навигацией
 * Позволяет включать/выключать озвучивание из любого компонента
 */

import { createContext, useContext, useState, useEffect } from 'react';

// Создаем контекст для аудио
const AudioContext = createContext(null);

// Ключ для сохранения состояния в localStorage
const AUDIO_ENABLED_KEY = 'audio_navigation_enabled';

/**
 * Провайдер контекста аудио-навигации
 */
export const AudioProvider = ({ children }) => {
  // Инициализируем состояние из localStorage или по умолчанию включено
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    try {
      const storedValue = localStorage.getItem(AUDIO_ENABLED_KEY);
      return storedValue !== null ? JSON.parse(storedValue) : true;
    } catch (error) {
      console.error('Ошибка при чтении состояния аудио из localStorage:', error);
      return true; // По умолчанию аудио включено
    }
  });

  // Сохраняем состояние в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_ENABLED_KEY, JSON.stringify(isAudioEnabled));
    } catch (error) {
      console.error('Ошибка при сохранении состояния аудио в localStorage:', error);
    }
  }, [isAudioEnabled]);

  // Функция для переключения состояния аудио
  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };

  // Предоставляем состояние и функции для управления аудио
  const audioService = {
    isAudioEnabled,
    toggleAudio
  };

  return (
    <AudioContext.Provider value={audioService}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * Хук для доступа к контексту аудио
 */
export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext должен использоваться внутри AudioProvider');
  }
  return context;
};