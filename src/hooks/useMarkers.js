/**
 * Хук для управления маркерами
 * Предоставляет методы для работы с маркерами и их сохранения в локальном хранилище
 * Обновлен для поддержки постоянных маркеров из JSON-файлов
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createMarker, updateMarker } from '../models/MarkerModel';
import usePermanentMarkers from './usePermanentMarkers';

const STORAGE_KEY = 'route_markers';

export default function useMarkers(currentCity) {
  const [userMarkers, setUserMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Загрузка постоянных маркеров из JSON-файлов
  const { 
    permanentMarkers, 
    isLoading: isPermanentLoading, 
    error: permanentError 
  } = usePermanentMarkers(currentCity);

  // Загрузка пользовательских маркеров из localStorage при монтировании
  useEffect(() => {
    const loadUserMarkers = () => {
      try {
        const savedMarkers = localStorage.getItem(STORAGE_KEY);
        if (savedMarkers) {
          setUserMarkers(JSON.parse(savedMarkers));
        }
      } catch (error) {
        console.error('Ошибка при загрузке маркеров:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserMarkers();
  }, []);

  // Сохранение пользовательских маркеров в localStorage при изменении
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userMarkers));
      } catch (error) {
        console.error('Ошибка при сохранении маркеров:', error);
      }
    }
  }, [userMarkers, isLoading]);

  // Объединение пользовательских и постоянных маркеров
  const markers = useMemo(() => {
    // Создаем Map с пользовательскими маркерами
    const userMarkersMap = new Map(userMarkers.map(marker => [marker.id, marker]));
    
    // Копируем все постоянные маркеры
    const combinedMarkers = [...permanentMarkers];
    
    // Добавляем или заменяем маркеры из пользовательских (если ID совпадают)
    userMarkers.forEach(userMarker => {
      // Проверяем, есть ли такой маркер среди постоянных
      const existingIndex = combinedMarkers.findIndex(m => m.id === userMarker.id);
      
      if (existingIndex >= 0) {
        // Если есть, заменяем его пользовательским
        combinedMarkers[existingIndex] = userMarker;
      } else {
        // Если нет, добавляем
        combinedMarkers.push(userMarker);
      }
    });
    
    return combinedMarkers;
  }, [userMarkers, permanentMarkers]);

  // Добавление нового маркера (только в пользовательские)
  const addMarker = useCallback((markerData) => {
    const newMarker = createMarker(markerData);
    setUserMarkers(prevMarkers => [...prevMarkers, newMarker]);
    return newMarker;
  }, []);

  // Обновление существующего маркера (только в пользовательских)
  const updateMarkerById = useCallback((markerId, updates) => {
    setUserMarkers(prevMarkers => 
      prevMarkers.map(marker => 
        marker.id === markerId 
          ? updateMarker(marker, updates) 
          : marker
      )
    );
  }, []);

  // Удаление маркера по ID (только из пользовательских)
  const removeMarkerById = useCallback((markerId) => {
    setUserMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== markerId));
  }, []);

  // Получение маркеров для конкретного маршрута
  const getMarkersByRouteId = useCallback((routeId) => {
    return markers.filter(marker => marker.routeIds.includes(routeId));
  }, [markers]);

  // Установка новой позиции для маркера
  const setMarkerPosition = useCallback((markerId, latLng) => {
    updateMarkerById(markerId, {
      position: { lat: latLng.lat, lng: latLng.lng }
    });
  }, [updateMarkerById]);

  // Обновление списка маршрутов, к которым относится маркер
  const updateMarkerRoutes = useCallback((markerId, routeIds) => {
    updateMarkerById(markerId, { routeIds });
  }, [updateMarkerById]);

  // Обновление порядка следования маркера
  const updateMarkerSequence = useCallback((markerId, sequence) => {
    updateMarkerById(markerId, { sequence });
  }, [updateMarkerById]);

  // Проверка, является ли маркер постоянным
  const isPermanentMarker = useCallback((markerId) => {
    return permanentMarkers.some(marker => marker.id === markerId);
  }, [permanentMarkers]);

  return {
    markers,
    userMarkers,
    permanentMarkers,
    isLoading: isLoading || isPermanentLoading,
    permanentError,
    addMarker,
    updateMarkerById,
    removeMarkerById,
    getMarkersByRouteId,
    setMarkerPosition,
    updateMarkerRoutes,
    updateMarkerSequence,
    isPermanentMarker
  };
}