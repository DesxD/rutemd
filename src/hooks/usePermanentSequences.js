/**
 * Файл: usePermanentSequences.js
 * Хук для загрузки и применения отдельных файлов последовательностей маркеров
 */

import { useState, useEffect } from 'react';

/**
 * Хук для загрузки последовательностей маркеров из отдельных файлов
 * @param {string} currentCity - Текущий выбранный город
 * @param {object} selectedRoute - Текущий выбранный маршрут
 * @returns {object} - Объект с последовательностями маркеров
 */
function usePermanentSequences(currentCity, selectedRoute) {
  const [sequences, setSequences] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Эффект для загрузки последовательностей для текущего города и маршрута
  useEffect(() => {
    if (!currentCity || !selectedRoute) return;
    
    setIsLoading(true);
    setError(null);
    
    // Формируем путь к файлу последовательностей для конкретного маршрута
    // Пример: /data/sequences/edinet/route-1.json
    const sequenceFilePath = `/data/sequences/${currentCity}/route-${selectedRoute.number}.json`;
    
    // Загружаем файл с последовательностями
    fetch(sequenceFilePath)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            // Если файла нет, это не ошибка - просто нет последовательности
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
          
          // Обновляем состояние
          setSequences(prev => ({
            ...prev,
            [selectedRoute.id]: sequenceMap
          }));
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.warn(`Ошибка загрузки последовательностей для маршрута ${selectedRoute.number}:`, error);
        setError(error);
        setIsLoading(false);
      });
  }, [currentCity, selectedRoute]);
  
  // Функция для применения последовательностей к массиву маркеров
  const applySequencesToMarkers = (markers, routeId) => {
    if (!sequences[routeId] || !markers.length) return markers;
    
    return markers.map(marker => {
      // Если для этого маркера есть последовательность, применяем её
      if (sequences[routeId][marker.id] !== undefined) {
        return {
          ...marker,
          sequence: sequences[routeId][marker.id]
        };
      }
      return marker;
    });
  };
  
  return { 
    sequences, 
    isLoading, 
    error, 
    applySequencesToMarkers 
  };
}

export default usePermanentSequences;