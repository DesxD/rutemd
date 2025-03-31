/**
 * Хук для загрузки постоянных маркеров из JSON-файлов по городам
 * Обеспечивает загрузку маркеров для выбранного города из соответствующего файла
 */

import { useState, useEffect } from 'react';

export default function usePermanentMarkers(city) {
  const [permanentMarkers, setPermanentMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!city) {
      setPermanentMarkers([]);
      setIsLoading(false);
      return;
    }

    const loadMarkers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Получаем путь к JSON-файлу в папке public/data/markers
        // В публичной папке, а не в src
        const response = await fetch(`/data/markers/${city}.json`);
        
        if (!response.ok) {
          // Если файл не найден или другая ошибка HTTP
          if (response.status === 404) {
            console.warn(`Файл маркеров для города ${city} не найден`);
            setPermanentMarkers([]);
          } else {
            throw new Error(`HTTP ошибка: ${response.status}`);
          }
        } else {
          // Если файл найден, загружаем маркеры
          const data = await response.json();
          
          if (data && Array.isArray(data.markers)) {
            setPermanentMarkers(data.markers);
            console.log(`Загружено ${data.markers.length} постоянных маркеров для города ${city}`);
          } else {
            setPermanentMarkers([]);
            console.warn(`Некорректный формат данных в файле маркеров для города ${city}`);
          }
        }
      } catch (err) {
        console.error('Ошибка при загрузке маркеров:', err);
        setError(err.message);
        setPermanentMarkers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarkers();
  }, [city]);

  return { permanentMarkers, isLoading, error };
}