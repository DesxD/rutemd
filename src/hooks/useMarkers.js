/**
 * Хук для управления маркерами
 * Предоставляет методы для работы с маркерами и их сохранения в локальном хранилище
 */

import { useState, useEffect, useCallback } from 'react';
import { createMarker, updateMarker } from '../models/MarkerModel';

const STORAGE_KEY = 'route_markers';

export default function useMarkers() {
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка маркеров из localStorage при монтировании
  useEffect(() => {
    const loadMarkers = () => {
      try {
        const savedMarkers = localStorage.getItem(STORAGE_KEY);
        if (savedMarkers) {
          setMarkers(JSON.parse(savedMarkers));
        }
      } catch (error) {
        console.error('Ошибка при загрузке маркеров:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarkers();
  }, []);

  // Сохранение маркеров в localStorage при изменении
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
      } catch (error) {
        console.error('Ошибка при сохранении маркеров:', error);
      }
    }
  }, [markers, isLoading]);

  // Добавление нового маркера
  const addMarker = useCallback((markerData) => {
    const newMarker = createMarker(markerData);
    setMarkers(prevMarkers => [...prevMarkers, newMarker]);
    return newMarker;
  }, []);

  // Обновление существующего маркера
  const updateMarkerById = useCallback((markerId, updates) => {
    setMarkers(prevMarkers => 
      prevMarkers.map(marker => 
        marker.id === markerId 
          ? updateMarker(marker, updates) 
          : marker
      )
    );
  }, []);

  // Удаление маркера по ID
  const removeMarkerById = useCallback((markerId) => {
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== markerId));
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

  return {
    markers,
    isLoading,
    addMarker,
    updateMarkerById,
    removeMarkerById,
    getMarkersByRouteId,
    setMarkerPosition,
    updateMarkerRoutes,
    updateMarkerSequence
  };
}