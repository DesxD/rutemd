/**
 * Файл: useMarkers.js
 * Хук для управления маркерами с поддержкой загрузки постоянных маркеров из файла
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Генерация уникального ID
 * @returns {string} - Уникальный идентификатор
 */
function generateUniqueId() {
  return `marker_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Загрузка маркеров из файла
 * @param {string} currentCity - Текущий выбранный город
 * @returns {Promise<Array>} - Массив маркеров
 */
async function loadPermanentMarkers(currentCity) {
  try {
    const markersFilePath = `/data/markers/${currentCity}.json`;
    const response = await fetch(markersFilePath);
    
    if (!response.ok) {
      console.warn(`Файл маркеров для города ${currentCity} не найден.`);
      return [];
    }
    
    const data = await response.json();
    
    if (data && data.markers && Array.isArray(data.markers)) {
      console.log(`Загружено ${data.markers.length} постоянных маркеров для города ${currentCity}`);
      return data.markers;
    }
    
    return [];
  } catch (error) {
    console.error(`Ошибка при загрузке постоянных маркеров для города ${currentCity}:`, error);
    return [];
  }
}

/**
 * Хук для управления маркерами
 * @param {string} currentCity - Текущий выбранный город
 * @returns {object} - Методы для работы с маркерами
 */
function useMarkers(currentCity) {
  const [markers, setMarkers] = useState([]);
  // Используем ref для отслеживания загрузки
  const didLoadLocalMarkers = useRef(false);
  const didLoadPermanentMarkers = useRef(false);

  // Загрузка маркеров из localStorage при первой инициализации
  useEffect(() => {
    // Если маркеры уже загружены из localStorage, не выполняем повторно
    if (didLoadLocalMarkers.current) return;
    
    // Загрузка из localStorage
    const savedMarkers = localStorage.getItem('route_markers');
    if (savedMarkers) {
      try {
        const parsedMarkers = JSON.parse(savedMarkers);
        setMarkers(parsedMarkers);
        console.log(`Загружено ${parsedMarkers.length} маркеров из localStorage`);
      } catch (error) {
        console.error('Ошибка при парсинге маркеров из localStorage:', error);
      }
    }
    
    // Отмечаем, что маркеры загружены из localStorage
    didLoadLocalMarkers.current = true;
  }, []);

  // Загрузка постоянных маркеров при изменении города
  useEffect(() => {
    if (!currentCity) return;
    
    // Загрузка постоянных маркеров из файла
    const loadMarkers = async () => {
      const permanentMarkers = await loadPermanentMarkers(currentCity);
      
      if (permanentMarkers.length > 0) {
        setMarkers(prevMarkers => {
          // Создаем Map для быстрого поиска
          const markersMap = new Map(prevMarkers.map(m => [m.id, m]));
          
          // Проверяем и обновляем существующие маркеры или добавляем новые
          permanentMarkers.forEach(pm => {
            if (markersMap.has(pm.id)) {
              const existingMarker = markersMap.get(pm.id);
              // Обновляем свойства
              existingMarker.title = pm.title;
              existingMarker.imageUrl = pm.imageUrl;
              existingMarker.position = pm.position;
              
              // Добавляем routeIds, если их нет
              pm.routeIds.forEach(routeId => {
                if (!existingMarker.routeIds.includes(routeId)) {
                  existingMarker.routeIds.push(routeId);
                }
              });
            } else {
              // Добавляем новый маркер в Map
              markersMap.set(pm.id, pm);
            }
          });
          
          // Получаем обновленный список маркеров
          const updatedMarkers = Array.from(markersMap.values());
          
          // Сохраняем в localStorage
          localStorage.setItem('route_markers', JSON.stringify(updatedMarkers));
          
          return updatedMarkers;
        });
      }
      
      // Отмечаем, что постоянные маркеры загружены
      didLoadPermanentMarkers.current = true;
    };
    
    // Если город изменился, загружаем маркеры
    didLoadPermanentMarkers.current = false;
    loadMarkers();
  }, [currentCity]);

  // Функция добавления нового маркера
  const addMarker = useCallback((markerData) => {
    const newMarker = {
      id: generateUniqueId(),
      title: markerData.title || 'Новый маркер',
      speechText: markerData.speechText || '',
      imageUrl: markerData.imageUrl || '/images/markers/sign-off.png',
      position: markerData.position,
      routeIds: markerData.routeIds || [],
      sequence: markerData.sequence || 0
    };

    setMarkers(prevMarkers => {
      const updatedMarkers = [...prevMarkers, newMarker];
      localStorage.setItem('route_markers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });
    
    return newMarker;
  }, []);

  // Функция обновления существующего маркера
  const updateMarkerById = useCallback((markerId, markerData) => {
    setMarkers(prevMarkers => {
      const updatedMarkers = prevMarkers.map(marker => 
        marker.id === markerId
          ? { ...marker, ...markerData }
          : marker
      );
      localStorage.setItem('route_markers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });
  }, []);

  // Функция удаления маркера
  const removeMarkerById = useCallback((markerId) => {
    setMarkers(prevMarkers => {
      const updatedMarkers = prevMarkers.filter(marker => marker.id !== markerId);
      localStorage.setItem('route_markers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });
  }, []);

  // Функция для обновления последовательностей маркеров для конкретного маршрута
  const updateSequenceForRoute = useCallback((routeId, sequenceMap) => {
    setMarkers(prevMarkers => {
      const updatedMarkers = prevMarkers.map(marker => {
        if (marker.routeIds.includes(routeId) && sequenceMap[marker.id] !== undefined) {
          return {
            ...marker,
            sequence: sequenceMap[marker.id]
          };
        }
        return marker;
      });
      
      localStorage.setItem('route_markers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });
  }, []);

  // Функция для применения сохраненной последовательности из файла
  const applySequenceFromFile = useCallback(async (currentCity, routeNumber) => {
    if (!currentCity || !routeNumber) return;
    
    try {
      // Формируем путь к файлу последовательностей для конкретного маршрута
      const sequenceFilePath = `/data/sequences/${currentCity}/route-${routeNumber}.json`;
      
      // Загружаем файл
      const response = await fetch(sequenceFilePath);
      if (!response.ok) {
        if (response.status !== 404) {
          console.error(`Ошибка загрузки файла последовательности: ${response.status}`);
        }
        return false;
      }
      
      const data = await response.json();
      
      // Проверяем формат данных
      if (!data.markersSequence || !Array.isArray(data.markersSequence)) {
        console.error('Неверный формат файла последовательности');
        return false;
      }
      
      // Создаем словарь последовательностей
      const sequenceMap = {};
      data.markersSequence.forEach(item => {
        sequenceMap[item.markerId] = item.sequence;
      });
      
      // Применяем последовательности
      updateSequenceForRoute(data.routeId, sequenceMap);
      
      console.log(`Последовательность для маршрута ${routeNumber} успешно применена`);
      return true;
    } catch (error) {
      console.error('Ошибка при загрузке последовательности:', error);
      return false;
    }
  }, [updateSequenceForRoute]);

  return {
    markers,
    addMarker,
    updateMarkerById,
    removeMarkerById,
    updateSequenceForRoute,
    applySequenceFromFile
  };
}

export default useMarkers;