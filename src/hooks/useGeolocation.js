/**
 * Хук для работы с геолокацией пользователя
 * Упрощенная версия для получения текущих координат
 */

import { useState, useEffect, useCallback } from 'react';

export default function useGeolocation() {
  // Состояние для хранения данных геолокации
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Опции геолокации
  const geoOptions = {
    enableHighAccuracy: true, // Использовать GPS для высокой точности
    maximumAge: 0,            // Не использовать кэшированные данные
    timeout: 5000             // Таймаут в миллисекундах
  };

  // Обработчик успешного получения координат
  const onSuccess = useCallback((pos) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,    // Направление движения
      speed: pos.coords.speed,        // Скорость в м/с
      timestamp: pos.timestamp
    });
    setError(null);
  }, []);

  // Обработчик ошибок геолокации
  const onError = useCallback((err) => {
    setError({
      code: err.code,
      message: err.message
    });
  }, []);

  // Метод для получения текущего положения однократно
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Геолокация не поддерживается вашим браузером' });
      return;
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
  }, [onSuccess, onError, geoOptions]);

  // Метод для начала отслеживания положения
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Геолокация не поддерживается вашим браузером' });
      return;
    }

    // Останавливаем предыдущее отслеживание, если оно было
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
    setWatchId(id);
    setIsWatching(true);
  }, [onSuccess, onError, geoOptions, watchId]);

  // Метод для остановки отслеживания положения
  const stopWatching = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
    }
  }, [watchId]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    position,             // Данные о местоположении
    error,                // Ошибка, если есть
    isWatching,           // Флаг, отслеживается ли положение
    getCurrentPosition,   // Метод для получения текущего положения
    startWatching,        // Метод для начала отслеживания
    stopWatching          // Метод для остановки отслеживания
  };
}