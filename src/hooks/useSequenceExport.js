/**
 * Файл: useSequenceExport.js
 * Хук для экспорта последовательностей маркеров в отдельные файлы
 */

import { useCallback } from 'react';

/**
 * Хук для экспорта последовательностей маркеров
 * @returns {object} - Методы для экспорта последовательностей
 */
function useSequenceExport() {
  /**
   * Экспорт последовательности маркеров в отдельный файл
   * @param {Array} markers - Массив маркеров
   * @param {Object} route - Объект маршрута
   * @param {string} city - Название города
   * @returns {Promise} - Промис с результатом экспорта
   */
  const exportSequence = useCallback((markers, route, city) => {
    if (!markers || !markers.length || !route) {
      console.error('Недостаточно данных для экспорта последовательности');
      return Promise.reject('Недостаточно данных');
    }
    
    try {
      // Фильтруем маркеры для текущего маршрута
      const routeMarkers = markers.filter(marker => 
        marker.routeIds && marker.routeIds.includes(route.id)
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
          sequence: index // Переопределяем последовательность по индексу сортировки
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
  }, []);
  
  /**
   * Применить последовательность из файла к маркерам
   * @param {File} file - Файл с последовательностью
   * @param {Array} markers - Массив маркеров
   * @param {Function} updateMarkerById - Функция обновления маркера
   * @returns {Promise} - Промис с результатом импорта
   */
  const importAndApplySequence = useCallback((file, markers, updateMarkerById) => {
    return new Promise((resolve, reject) => {
      if (!file || !markers || !updateMarkerById) {
        reject('Недостаточно данных для импорта');
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
          
          let updatedCount = 0;
          let notFoundCount = 0;
          
          // Применяем последовательности к маркерам
          importData.markersSequence.forEach((item) => {
            const marker = markers.find(m => m.id === item.markerId);
            if (marker) {
              updateMarkerById(marker.id, { sequence: item.sequence });
              updatedCount++;
            } else {
              notFoundCount++;
            }
          });
          
          resolve({
            message: `Последовательность успешно применена`,
            updated: updatedCount,
            notFound: notFoundCount,
            routeId: importData.routeId,
            routeNumber: importData.routeNumber
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
  }, []);
  
  return {
    exportSequence,
    importAndApplySequence
  };
}

export default useSequenceExport;