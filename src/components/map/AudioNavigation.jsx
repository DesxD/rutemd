/**
 * Компонент для аудио-навигации
 * Озвучивает маркеры по последовательности, когда пользователь приближается к ним
 * Поддерживает вход на маршрут с любой точки
 */

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext';
import { useAudioContext } from '../../contexts/AudioContext';

// Константа для расстояния, на котором срабатывает озвучивание (50 метров)
const MARKER_ANNOUNCEMENT_DISTANCE = 50;

function AudioNavigation({ 
  userPosition,
  selectedRoute,
  isOnRoute
}) {
  const { t } = useTranslation();
  const { markers } = useMarkersContext();
  const { 
    isAudioEnabled, 
    speak, 
    isMarkerAnnounced, 
    markAsAnnounced, 
    resetAnnouncedMarkers 
  } = useAudioContext();
  
  // Состояние для хранения текущего индекса последовательности
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  
  // Флаг для отслеживания инициализации маршрута
  const routeInitialized = useRef(false);
  
  // Предыдущее положение пользователя
  const prevPosition = useRef(null);
  
  // Получаем отсортированные маркеры для текущего маршрута
  const routeMarkers = useMemo(() => {
    if (!selectedRoute || !markers.length) return [];
    
    // Фильтруем маркеры для текущего маршрута
    const filteredMarkers = markers.filter(marker => 
      marker.routeIds.includes(selectedRoute.id)
    );
    
    // Сортируем по последовательности
    return [...filteredMarkers].sort((a, b) => a.sequence - b.sequence);
  }, [selectedRoute, markers]);
  
  // Функция для вычисления расстояния между двумя точками (в метрах)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
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
  }, []);

  // Рассчитываем расстояния до каждого маркера
  const calculateMarkerDistances = useCallback(() => {
    if (!userPosition || !routeMarkers.length) return [];
    
    return routeMarkers.map(marker => {
      if (!marker.position) return { ...marker, distance: Infinity };
      
      const distance = calculateDistance(
        userPosition.latitude, userPosition.longitude,
        marker.position.lat, marker.position.lng
      );
      
      return { ...marker, distance };
    });
  }, [userPosition, routeMarkers, calculateDistance]);
  
  // Сбрасываем отслеживание при смене маршрута
  useEffect(() => {
    resetAnnouncedMarkers();
    setCurrentSequenceIndex(0);
    routeInitialized.current = false;
  }, [selectedRoute, resetAnnouncedMarkers]);
  
  // Инициализация при первом входе на маршрут
  useEffect(() => {
    // Проверяем, нужно ли инициализировать последовательность
    if (isOnRoute && userPosition && routeMarkers.length && !routeInitialized.current) {
      // Получаем расстояния до всех маркеров
      const markersWithDistances = calculateMarkerDistances();
      
      // Находим ближайший маркер
      let closestMarkerIndex = 0;
      let closestDistance = Infinity;
      
      markersWithDistances.forEach((marker, index) => {
        if (marker.distance < closestDistance) {
          closestDistance = marker.distance;
          closestMarkerIndex = index;
        }
      });
      
      // Определяем, с какого маркера начинать озвучивание
      // Если ближайший маркер в начале маршрута - начинаем оттуда
      // Если в середине - отмечаем все предыдущие как озвученные
      if (closestMarkerIndex > 0) {
        // Получаем предыдущий и следующий маркеры для определения направления
        const prevMarker = markersWithDistances[closestMarkerIndex - 1];
        const currMarker = markersWithDistances[closestMarkerIndex];
        let startIndex = closestMarkerIndex;
        
        // Если предыдущий маркер ближе, чем расстояние для объявления
        // и текущее положение пользователя явно ближе к предыдущему маркеру - 
        // мы уже прошли его и начинаем с текущего
        if (prevMarker.distance <= MARKER_ANNOUNCEMENT_DISTANCE * 1.2) {
          startIndex = closestMarkerIndex;
        } else {
          // Иначе начинаем с ближайшего
          startIndex = closestMarkerIndex;
        }
        
        // Отмечаем все предыдущие маркеры как озвученные
        for (let i = 0; i < startIndex; i++) {
          markAsAnnounced(routeMarkers[i].id);
        }
        
        // Устанавливаем индекс последовательности
        setCurrentSequenceIndex(startIndex);
        
        console.log(`Инициализация с маркера ${startIndex} из ${routeMarkers.length}`);
      }
      
      routeInitialized.current = true;
    }
  }, [isOnRoute, userPosition, routeMarkers, calculateMarkerDistances, markAsAnnounced]);
  
  // Отслеживаем движение и проверяем маркеры для озвучивания
  useEffect(() => {
    // Проверяем необходимые условия
    if (!isAudioEnabled || !userPosition || !selectedRoute || !isOnRoute || !routeMarkers.length) {
      return;
    }
    
    // Сохраняем текущее положение для будущих сравнений
    if (!prevPosition.current) {
      prevPosition.current = userPosition;
    }
    
    // Ищем следующий маркер для озвучивания
    if (currentSequenceIndex < routeMarkers.length) {
      const nextMarker = routeMarkers[currentSequenceIndex];
      
      // Проверяем, не был ли уже объявлен маркер
      if (nextMarker && !isMarkerAnnounced(nextMarker.id) && nextMarker.position) {
        // Рассчитываем расстояние до маркера
        const distance = calculateDistance(
          userPosition.latitude, userPosition.longitude,
          nextMarker.position.lat, nextMarker.position.lng
        );
        
        // Если достаточно близко, озвучиваем маркер
        if (distance <= MARKER_ANNOUNCEMENT_DISTANCE) {
          console.log(`Приближение к маркеру: ${nextMarker.title}, расстояние: ${Math.round(distance)}м`);
          
          // Озвучиваем текст маркера
          if (nextMarker.speechText && speak(nextMarker.speechText)) {
            // Отмечаем маркер как озвученный
            markAsAnnounced(nextMarker.id);
            
            // Переходим к следующему маркеру в последовательности
            setCurrentSequenceIndex(prev => prev + 1);
            
            console.log(`Озвучен маркер: ${nextMarker.title} (последовательность: ${nextMarker.sequence})`);
          }
        }
      } else if (nextMarker && isMarkerAnnounced(nextMarker.id)) {
        // Если маркер уже был озвучен, переходим к следующему
        setCurrentSequenceIndex(prev => prev + 1);
      }
    }
    
    // Обновляем предыдущую позицию
    prevPosition.current = userPosition;
  }, [
    isAudioEnabled, 
    userPosition, 
    selectedRoute, 
    isOnRoute, 
    routeMarkers, 
    currentSequenceIndex,
    speak, 
    isMarkerAnnounced, 
    markAsAnnounced,
    calculateDistance
  ]);
  
  // При размонтировании компонента отменяем все объявления
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Компонент не отображает UI
  return null;
}

AudioNavigation.propTypes = {
  userPosition: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    accuracy: PropTypes.number,
    heading: PropTypes.number,
    speed: PropTypes.number,
    timestamp: PropTypes.number
  }),
  selectedRoute: PropTypes.object,
  isOnRoute: PropTypes.bool
};

export default AudioNavigation;