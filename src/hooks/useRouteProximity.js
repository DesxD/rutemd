/**
 * Хук для определения близости к точкам маршрута
 * Находит ближайшие точки и расстояние до них
 */

import { useState, useEffect, useCallback } from 'react';

export default function useRouteProximity(route, userPosition, options = {}) {
  // Настройки по умолчанию
  const {
    proximityThreshold = 100, // метров
    checkInterval = 1000      // миллисекунд
  } = options;
  
  const [nearestPoint, setNearestPoint] = useState(null);
  const [nearestPoints, setNearestPoints] = useState([]);
  const [isOnRoute, setIsOnRoute] = useState(false);
  
  // Вычисляет расстояние между двумя точками (в метрах)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    // Конвертируем градусы в радианы
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
  
  // Находит ближайшие точки маршрута
  const findNearestPoints = useCallback(() => {
    if (!route?.points || !userPosition) return;
    
    const points = route.points.map((point, index) => {
      const distance = calculateDistance(
        userPosition.latitude, userPosition.longitude,
        point.lat, point.lng
      );
      
      return {
        index,
        point,
        distance
      };
    });
    
    // Сортируем точки по расстоянию
    const sortedPoints = [...points].sort((a, b) => a.distance - b.distance);
    
    // Берем только точки в пределах порога близости
    const nearPoints = sortedPoints.filter(p => p.distance <= proximityThreshold);
    
    // Ближайшая точка
    const nearest = sortedPoints.length > 0 ? sortedPoints[0] : null;
    
    setNearestPoint(nearest);
    setNearestPoints(nearPoints);
    setIsOnRoute(nearest ? nearest.distance <= proximityThreshold : false);
    
  }, [route, userPosition, calculateDistance, proximityThreshold]);
  
  // Периодически проверяем близость к точкам маршрута
  useEffect(() => {
    if (!route || !userPosition) {
      setNearestPoint(null);
      setNearestPoints([]);
      setIsOnRoute(false);
      return;
    }
    
    // Сразу проверяем при изменении положения
    findNearestPoints();
    
    // Настраиваем периодическую проверку
    const intervalId = setInterval(findNearestPoints, checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [route, userPosition, findNearestPoints, checkInterval]);
  
  return {
    nearestPoint,    // Ближайшая точка маршрута
    nearestPoints,   // Массив ближайших точек (в пределах порога)
    isOnRoute,       // Флаг нахождения на маршруте
    proximityThreshold // Текущий порог близости
  };
}