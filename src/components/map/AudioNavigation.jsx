/**
 * Компонент для аудио-сопровождения навигации
 * Озвучивает ближайшие точки маршрута, маркеры и важные события
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';
import { sortMarkersBySequence } from '../../models/MarkerModel';

function AudioNavigation({ 
  nearestPoint, 
  isOnRoute, 
  enabled = true, 
  selectedRoute,
  userPosition 
}) {
  const { t } = useTranslation();
  const { markers } = useMarkersContext();
  const [isAudioEnabled, setIsAudioEnabled] = useState(enabled);
  const announcedPoints = useRef(new Set());
  const announcedMarkers = useRef(new Set());
  const lastAnnouncementTime = useRef(0);
  const lastMarkerAnnouncementTime = useRef(0);
  
  // Минимальный интервал между объявлениями в миллисекундах
  const MIN_ANNOUNCEMENT_INTERVAL = 10000; // 10 секунд
  const MIN_MARKER_ANNOUNCEMENT_INTERVAL = 15000; // 15 секунд
  const MARKER_ANNOUNCEMENT_DISTANCE = 50; // метров
  
  // Отфильтрованные и отсортированные маркеры для текущего маршрута
  const routeMarkers = useMemo(() => {
    if (!selectedRoute || !markers.length) return [];
    
    // Выбираем маркеры, которые относятся к выбранному маршруту
    const filteredMarkers = markers.filter(marker => 
      marker.routeIds.includes(selectedRoute.id)
    );
    
    // Сортируем маркеры по порядку озвучивания
    return sortMarkersBySequence(filteredMarkers);
  }, [selectedRoute, markers]);
  
  // Функция для вычисления расстояния между двумя точками (в метрах)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = value => value * Math.PI / 180;
    
    const R = 6371e3; // радиус Земли в метрах
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lng2 - lng1);
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // расстояние в метрах
  };
  
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
  
  // Озвучивание маркеров
  useEffect(() => {
    if (!isAudioEnabled || !userPosition || !routeMarkers.length || !isOnRoute) return;
    
    // Проверяем, прошло ли достаточно времени с последнего объявления маркера
    const now = Date.now();
    if (now - lastMarkerAnnouncementTime.current < MIN_MARKER_ANNOUNCEMENT_INTERVAL) {
      return;
    }
    
    // Проверяем маркеры по порядку
    for (const marker of routeMarkers) {
      // Пропускаем уже озвученные маркеры
      if (announcedMarkers.current.has(marker.id)) continue;
      
      // Если у маркера нет позиции или текста для озвучивания, пропускаем
      if (!marker.position || !marker.speechText) continue;
      
      // Вычисляем расстояние до маркера
      const distance = calculateDistance(
        userPosition.latitude, userPosition.longitude,
        marker.position.lat, marker.position.lng
      );
      
      // Если пользователь достаточно близко к маркеру
      if (distance <= MARKER_ANNOUNCEMENT_DISTANCE) {
        // Озвучиваем текст маркера
        speak(marker.speechText);
        
        // Запоминаем время озвучивания маркера
        lastMarkerAnnouncementTime.current = now;
        
        // Добавляем маркер в список озвученных
        announcedMarkers.current.add(marker.id);
        
        // Озвучиваем только один маркер за раз
        break;
      }
    }
  }, [isAudioEnabled, userPosition, routeMarkers, isOnRoute]);
  
  // При смене маршрута сбрасываем озвученные маркеры
  useEffect(() => {
    if (selectedRoute) {
      announcedMarkers.current.clear();
    }
  }, [selectedRoute]);
  
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
  enabled: PropTypes.bool,
  selectedRoute: PropTypes.object,
  userPosition: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    accuracy: PropTypes.number,
    heading: PropTypes.number,
    speed: PropTypes.number,
    timestamp: PropTypes.number
  })
};

export default AudioNavigation;