/**
 * Файл: useLoadSequence.js
 * Хук для загрузки последовательностей маркеров из файлов
 */

import { useState, useEffect, useCallback } from 'react';
import { useMarkersContext } from '../contexts/MarkersContext';

/**
 * Хук для загрузки и применения последовательностей маркеров
 * @param {string} currentCity - Текущий выбранный город
 * @param {object} selectedRoute - Выбранный маршрут
 * @returns {object} - Состояние загрузки и функции
 */
function useLoadSequence(currentCity, selectedRoute) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sequenceLoaded, setSequenceLoaded] = useState(false);
  
  const { updateMarkerSequences } = useMarkersContext();

  // Функция загрузки последовательности для маршрута
  const loadRouteSequence = useCallback((city, route) => {
    if (!city || !route) return Promise.resolve(null);
    
    setIsLoading(true);
    setError(null);
    
    // Формируем путь к файлу последовательностей для конкретного маршрута
    const sequenceFilePath = `/data/sequences/${city}/route-${route.number}.json`;
    
    return fetch(sequenceFilePath)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            // Если файла нет, это не ошибка - просто нет последовательности
            console.log(`Файл последовательности не найден: ${sequenceFilePath}`);
            setSequenceLoaded(false);
            setIsLoading(false);
            return null;
          }
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.markersSequence) {
          // Создаем словарь последовательностей маркеров
          const sequenceMap = {};
          data.markersSequence.forEach(item => {
            sequenceMap[item.markerId] = item.sequence;
          });
          
          // Применяем последовательности к маркерам
          updateMarkerSequences(route.id, sequenceMap);
          
          setSequenceLoaded(true);
          console.log(`Последовательность загружена для маршрута ${route.number}`);
          return sequenceMap;
        }
        return null;
      })
      .catch(error => {
        console.warn(`Ошибка загрузки последовательностей для маршрута ${route.number}:`, error);
        setError(error);
        return null;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [updateMarkerSequences]);

  // Загружаем последовательность при изменении маршрута
  useEffect(() => {
    if (currentCity && selectedRoute) {
      loadRouteSequence(currentCity, selectedRoute);
    } else {
      setSequenceLoaded(false);
    }
  }, [currentCity, selectedRoute, loadRouteSequence]);

  return {
    isLoading,
    error,
    sequenceLoaded,
    loadRouteSequence
  };
}

export default useLoadSequence;