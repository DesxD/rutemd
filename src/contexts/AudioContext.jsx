/**
 * Контекст для управления аудио-функциональностью
 * Предоставляет состояние и методы для озвучивания маркеров
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Создаем контекст для аудио
const AudioContext = createContext(null);

// Провайдер контекста аудио
export const AudioProvider = ({ children }) => {
  // Состояние включения/выключения аудио
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  
  // Состояние для отслеживания объявленных маркеров (для текущей сессии)
  const [announcedMarkers, setAnnouncedMarkers] = useState(new Set());
  
  // Время последнего объявления
  const lastAnnouncementTime = useRef(0);
  
  // Минимальный интервал между объявлениями
  const MIN_ANNOUNCEMENT_INTERVAL = 10000; // 10 секунд
  
  // Загрузка состояния аудио из localStorage при инициализации
  useEffect(() => {
    const savedValue = localStorage.getItem('audio_enabled');
    if (savedValue !== null) {
      setIsAudioEnabled(savedValue === 'true');
    }
  }, []);
  
  // Сохранение состояния аудио в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('audio_enabled', isAudioEnabled.toString());
  }, [isAudioEnabled]);
  
  // Переключение состояния аудио
  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => !prev);
  }, []);
  
  // Сброс объявленных маркеров (например, при смене маршрута)
  const resetAnnouncedMarkers = useCallback(() => {
    setAnnouncedMarkers(new Set());
    lastAnnouncementTime.current = 0;
  }, []);
  
  // Отметка маркера как объявленного
  const markAsAnnounced = useCallback((markerId) => {
    setAnnouncedMarkers(prev => {
      const newSet = new Set(prev);
      newSet.add(markerId);
      return newSet;
    });
    lastAnnouncementTime.current = Date.now();
  }, []);
  
  // Проверка, был ли маркер объявлен
  const isMarkerAnnounced = useCallback((markerId) => {
    return announcedMarkers.has(markerId);
  }, [announcedMarkers]);
  
  // Проверка, прошло ли достаточно времени с последнего объявления
  const canAnnounce = useCallback(() => {
    return Date.now() - lastAnnouncementTime.current >= MIN_ANNOUNCEMENT_INTERVAL;
  }, []);
  
  // Функция для озвучивания текста
  const speak = useCallback((text) => {
    if (!isAudioEnabled || !text) return false;
    
    // Проверка доступности API синтеза речи
    if (!window.speechSynthesis) {
      console.warn('Синтез речи не поддерживается в вашем браузере');
      return false;
    }
    
    // Проверяем, прошло ли достаточно времени с последнего объявления
    if (!canAnnounce()) {
      return false;
    }
    
    // Создаем новый экземпляр речи
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Настраиваем параметры речи
    utterance.lang = 'ru-RU'; // Язык
    utterance.volume = 1.0;   // Громкость (0-1)
    utterance.rate = 1.0;     // Скорость (0.1-10)
    utterance.pitch = 1.0;    // Тон (0-2)
    
    // Отменяем предыдущие объявления перед новым
    window.speechSynthesis.cancel();
    
    // Произносим текст
    window.speechSynthesis.speak(utterance);
    
    // Обновляем время последнего объявления
    lastAnnouncementTime.current = Date.now();
    
    return true;
  }, [isAudioEnabled, canAnnounce]);
  
  // Значение контекста
  const value = {
    isAudioEnabled,
    toggleAudio,
    speak,
    announcedMarkers,
    resetAnnouncedMarkers,
    markAsAnnounced,
    isMarkerAnnounced,
    canAnnounce
  };
  
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

// Пропсы провайдера
AudioProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Хук для использования контекста аудио
export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext должен использоваться внутри AudioProvider');
  }
  return context;
};