/**
 * Компонент для аудио-сопровождения навигации
 * Озвучивает ближайшие точки маршрута и важные события
 */

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function AudioNavigation({ nearestPoint, isOnRoute, enabled = true }) {
  const { t } = useTranslation();
  const [isAudioEnabled, setIsAudioEnabled] = useState(enabled);
  const announcedPoints = useRef(new Set());
  const lastAnnouncementTime = useRef(0);
  
  // Минимальный интервал между объявлениями в миллисекундах
  const MIN_ANNOUNCEMENT_INTERVAL = 10000; // 10 секунд
  
  // Функция для произнесения текста с помощью синтеза речи
  const speak = (text) => {
    if (!isAudioEnabled || !text) return;
    
    // Проверяем доступность API синтеза речи
    if (!window.speechSynthesis) {
      console.warn('Синтез речи не поддерживается в вашем браузере');
      return;
    }
    
    // Создаем новый экземпляр речи
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Настраиваем параметры речи
    utterance.lang = 'ru-RU'; // Язык
    utterance.volume = 1.0;   // Громкость (0-1)
    utterance.rate = 1.0;     // Скорость (0.1-10)
    utterance.pitch = 1.0;    // Тон (0-2)
    
    // Произносим текст
    window.speechSynthesis.speak(utterance);
    
    // Запоминаем время последнего объявления
    lastAnnouncementTime.current = Date.now();
  };
  
  // Функция переключения аудио
  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };
  
  // Реагируем на изменения ближайшей точки и статуса нахождения на маршруте
  useEffect(() => {
    if (!isAudioEnabled || !nearestPoint) return;
    
    // Проверяем, прошло ли достаточно времени с последнего объявления
    const now = Date.now();
    if (now - lastAnnouncementTime.current < MIN_ANNOUNCEMENT_INTERVAL) {
      return;
    }
    
    // Проверяем, не объявляли ли мы уже эту точку
    const pointId = `${nearestPoint.point.lat}-${nearestPoint.point.lng}`;
    if (announcedPoints.current.has(pointId)) {
      return;
    }
    
    // Объявляем ближайшую точку
    if (nearestPoint.distance <= 50) { // Объявляем, когда ближе 50 метров
      // Здесь можно добавить логику для формирования текста объявления
      // в зависимости от типа точки, ее номера и т.д.
      const announcementText = t('reachedRoutePoint', { 
        distance: Math.round(nearestPoint.distance),
        pointNumber: nearestPoint.index + 1 
      });
      
      speak(announcementText);
      
      // Добавляем точку в список объявленных
      announcedPoints.current.add(pointId);
    }
  }, [isAudioEnabled, nearestPoint, t]);
  
  // Объявление о нахождении/потере маршрута
  useEffect(() => {
    if (!isAudioEnabled) return;
    
    // Проверяем, прошло ли достаточно времени с последнего объявления
    const now = Date.now();
    if (now - lastAnnouncementTime.current < MIN_ANNOUNCEMENT_INTERVAL) {
      return;
    }
    
    // Статусы для отслеживания изменений нахождения на маршруте
    const wasOnRouteRef = useRef(isOnRoute);
    
    // Если статус нахождения на маршруте изменился
    if (wasOnRouteRef.current !== isOnRoute) {
      // Если попали на маршрут
      if (isOnRoute) {
        speak(t('onRoute'));
      } 
      // Если потеряли маршрут
      else {
        speak(t('offRoute'));
      }
      
      // Обновляем статус
      wasOnRouteRef.current = isOnRoute;
    }
  }, [isAudioEnabled, isOnRoute, t]);
  
  // При размонтировании компонента отменяем все объявления
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Этот компонент не отображает UI, он только воспроизводит звуки
  return null;
}

AudioNavigation.propTypes = {
  nearestPoint: PropTypes.shape({
    index: PropTypes.number,
    point: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired
    }),
    distance: PropTypes.number
  }),
  isOnRoute: PropTypes.bool,
  enabled: PropTypes.bool
};

export default AudioNavigation;