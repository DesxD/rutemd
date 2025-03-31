/**
 * Файл: useExportSequence.js
 * Хук для экспорта последовательностей маркеров
 */

import { useCallback } from 'react';
import { useMarkersContext } from '../contexts/MarkersContext';

/**
 * Хук для экспорта и импорта последовательностей маркеров
 * @returns {object} - Функции для экспорта и импорта
 */
function useExportSequence() {
  const { markers, updateMarkerSequences } = useMarkersContext();

  /**
   * Экспорт последовательности маркеров в файл
   * @param {object} route - Объект маршрута
   * @param {string} city - Название города
   * @returns {Promise} - Результат операции
   */
  const exportSequence = useCallback((route, city) => {
    if (!route || !markers.length) {
      return Promise.reject('Недостаточно данных для экспорта');
    }
    
    try {
      // Фильтруем маркеры для текущего маршрута
      const routeMarkers = markers.filter(marker => 
        marker.routeIds.includes(route.id)
      );
      
      if (!routeMarkers.length) {
        return Promise.reject('Нет маркеров для этого маршрута');
      }
      
      // Сортируем маркеры по последовательности
      const sortedMarkers = [...routeMarkers].sort((a, b) => a.sequence - b.sequence);
      
      // Создаем объект данных для экспорта
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        city: city,
        routeId: route.id,
        routeNumber: route.number,
        markersSequence: sortedMarkers.map((marker, index) => ({
          markerId: marker.id,
          title: marker.title,
          imageUrl: marker.imageUrl.replace('/images/markers/', ''),
          sequence: index // Используем индекс в отсортированном массиве
        }))
      };
      
      // Преобразуем в JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Создаем blob и ссылку для скачивания
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Создаем элемент для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = `${city}_route-${route.number}_sequence.json`;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
      
      return Promise.resolve({
        message: `Последовательность для маршрута ${route.number} успешно экспортирована`,
        count: sortedMarkers.length
      });
    } catch (error) {
      console.error('Ошибка при экспорте последовательности:', error);
      return Promise.reject(error.message);
    }
  }, [markers]);

  /**
   * Импорт последовательности из файла
   * @param {File} file - Файл с последовательностью
   * @returns {Promise} - Результат операции
   */
  const importSequence = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('Файл не выбран');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          
          // Проверяем формат данных
          if (!importData.markersSequence || !Array.isArray(importData.markersSequence)) {
            reject('Неверный формат файла последовательности');
            return;
          }
          
          // Создаем словарь последовательностей маркеров
          const sequenceMap = {};
          importData.markersSequence.forEach(item => {
            sequenceMap[item.markerId] = item.sequence;
          });
          
          // Применяем последовательности к маркерам
          updateMarkerSequences(importData.routeId, sequenceMap);
          
          resolve({
            message: `Последовательность успешно импортирована для маршрута ${importData.routeNumber}`,
            routeId: importData.routeId,
            routeNumber: importData.routeNumber,
            count: importData.markersSequence.length
          });
        } catch (error) {
          console.error('Ошибка при импорте последовательности:', error);
          reject(`Ошибка при импорте: ${error.message}`);
        }
      };
      
      reader.onerror = () => {
        reject('Ошибка чтения файла');
      };
      
      reader.readAsText(file);
    });
  }, [updateMarkerSequences]);

  return {
    exportSequence,
    importSequence
  };
}

export default useExportSequence;