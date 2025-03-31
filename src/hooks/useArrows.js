/**
 * Хук для управления стрелками направления на маршруте
 * Позволяет добавлять стрелки, указывающие направление движения
 */

import { useRef, useCallback, useEffect } from 'react';
import L from 'leaflet';

export default function useArrows() {
  // Ref для хранения массива стрелок
  const arrowsRef = useRef([]);
  
  // Функция для вычисления направления между двумя точками
  const calculateBearing = useCallback((lat1, lng1, lat2, lng2) => {
    const toRad = value => value * Math.PI / 180;
    
    const dLon = toRad(lng2 - lng1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
             Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }, []);

  // Функция для вычисления расстояния между двумя точками
  const calculateDistance = useCallback((point1, point2) => {
    const R = 6371e3; // радиус Земли в метрах
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // расстояние в метрах
  }, []);

  // Функция для создания маркера со стрелкой
  const createArrowMarker = useCallback((position, bearing, routeColor = '#3388ff') => {
    // Корректируем угол (стрелка указывает на восток, т.е. 90 градусов)
    const rotationAngle = bearing - 90;
    
    // Выбираем контрастный цвет для стрелок относительно цвета маршрута
    // Используем черный цвет для стрелок, контрастный с синим маршрутом
    const arrowColor = '#FF0000';
    
    // Создаем HTML для стрелки с улучшенным стилем
    const iconHtml = `<div class="custom-arrow" style="color:${arrowColor}; transform:rotate(${rotationAngle}deg);">→</div>`;
    
    // Создаем иконку
    const arrowIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-arrow-container',
      iconSize: [20, 20], // Уменьшенный размер для более частого размещения
      iconAnchor: [10, 10]
    });
    
    // Создаем маркер
    return L.marker(position, {
      icon: arrowIcon,
      interactive: false,
      keyboard: false
    });
  }, []);

  // Функция для очистки стрелок с карты
  const clearArrows = useCallback((map) => {
    if (arrowsRef.current.length > 0) {
      arrowsRef.current.forEach(arrow => {
        if (map && map.hasLayer(arrow)) {
          map.removeLayer(arrow);
        }
      });
      arrowsRef.current = [];
    }
  }, []);

  // Функция для добавления стрелок на полилинию маршрута
  const addArrowsToPolyline = useCallback((map, polyline, routeColor = '#3388ff') => {
    if (!map || !polyline) return;
    
    // Очищаем существующие стрелки
    clearArrows(map);
    
    // Получаем точки маршрута
    const points = polyline.getLatLngs();
    
    // Устанавливаем фиксированную, небольшую частоту для стрелок
    const arrowFrequency = 1000; // в метрах
    
    // Проходим по всем сегментам маршрута
    for (let i = 0; i < points.length - 1; i++) {
      // Вычисляем расстояние сегмента
      const segmentDistance = calculateDistance(
        { lat: points[i].lat, lng: points[i].lng },
        { lat: points[i+1].lat, lng: points[i+1].lng }
      );
      
      // Вычисляем направление сегмента
      const bearing = calculateBearing(
        points[i].lat, points[i].lng,
        points[i+1].lat, points[i+1].lng
      );
      
      // Если сегмент достаточно длинный, добавляем стрелки
      if (segmentDistance > 10) {
        // Сколько стрелок можно разместить
        const arrowsCount = Math.max(1, Math.floor(segmentDistance / arrowFrequency));
        
        // Добавляем стрелки на сегмент
        for (let j = 1; j <= arrowsCount; j++) {
          // Распределяем равномерно
          const ratio = j / (arrowsCount + 1);
          const arrowLat = points[i].lat + (points[i+1].lat - points[i].lat) * ratio;
          const arrowLng = points[i].lng + (points[i+1].lng - points[i].lng) * ratio;
          
          // Создаем и добавляем маркер
          const arrowMarker = createArrowMarker([arrowLat, arrowLng], bearing, routeColor);
          arrowMarker.addTo(map);
          
          // Добавляем в массив для последующего управления
          arrowsRef.current.push(arrowMarker);
        }
      }
    }
    
    // Обязательно добавляем стрелку на последнем сегменте, если маршрут короткий
    if (arrowsRef.current.length === 0 && points.length >= 2) {
      const lastIndex = points.length - 1;
      const preLastIndex = points.length - 2;
      
      const bearing = calculateBearing(
        points[preLastIndex].lat, points[preLastIndex].lng,
        points[lastIndex].lat, points[lastIndex].lng
      );
      
      // Добавляем стрелку в середине последнего сегмента
      const arrowLat = (points[preLastIndex].lat + points[lastIndex].lat) / 2;
      const arrowLng = (points[preLastIndex].lng + points[lastIndex].lng) / 2;
      
      const arrowMarker = createArrowMarker([arrowLat, arrowLng], bearing, routeColor);
      arrowMarker.addTo(map);
      arrowsRef.current.push(arrowMarker);
    }
    
    return arrowsRef.current;
  }, [calculateBearing, calculateDistance, createArrowMarker, clearArrows]);

  // Добавляем стили для стрелок при первом рендере
  useEffect(() => {
    if (!document.getElementById('route-arrow-styles')) {
      const style = document.createElement('style');
      style.id = 'route-arrow-styles';
      style.textContent = `
        .custom-arrow-container {
          background: none !important;
          border: none !important;
          z-index: 800 !important;
        }
        
        .custom-arrow {
          font-size: 20px; 
          font-weight: bold;
          /* Улучшенная тень для лучшей видимости на любом фоне */
          text-shadow: 
            2px 2px 0 white, 
            -2px -2px 0 white, 
            2px -2px 0 white, 
            -2px 2px 0 white,
            0 2px 0 white,
            2px 0 0 white,
            0 -2px 0 white,
            -2px 0 0 white;
          transform-origin: center center;
          position: absolute;
          top: 0px !important;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      const style = document.getElementById('route-arrow-styles');
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return {
    addArrowsToPolyline,
    clearArrows
  };
}