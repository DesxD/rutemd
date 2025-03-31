/**
 * Компонент для отображения маршрутов на карте с использованием PolylineDecorator
 * и кастомных HTML-стрелок. С исправленным углом поворота.
 */
import React, { useEffect, useRef, memo } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

// Стили для маршрута
const ROUTE_COLOR = '#fff';
const ROUTE_BORDER_COLOR = '#3388ff';
const ROUTE_INNER_WIDTH = 4;
const ROUTE_OUTER_WIDTH = 10;
const ROUTE_OPACITY = 1.0;

// Настройки для стрелок
const ARROW_COLOR = '#FF0000'; // Цвет стрелки
const ARROW_FREQUENCY = '100px'; // Частота стрелок 
const ARROW_SIZE = 20; // Размер иконки стрелки
const ARROW_ROTATION_ADJUSTMENT = -90; // Корректировка угла поворота стрелок на 90 градусов

// Используем React.memo для предотвращения ненужных перерисовок
const RoutePolylines = memo(({ routes, selectedRoute, onRouteSelect, showAllRoutes }) => {
  const map = useMap();
  const decoratorRef = useRef(null);
  const markersRef = useRef([]);

  // Эффект для добавления и удаления стрелок
  useEffect(() => {
    // Функция для создания стилей, если их еще нет
    const ensureStyles = () => {
      if (!document.getElementById('arrow-styles')) {
        const style = document.createElement('style');
        style.id = 'arrow-styles';
        style.textContent = `
          .custom-arrow-container {
            background: none !important;
            border: none !important;
            z-index: 800 !important;
          }
          
          .custom-arrow {
            font-size: 20px;
            font-weight: bold;
            color: ${ARROW_COLOR};
            /* Тень для лучшей видимости */
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
            top: 0 !important;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          }
          
          /* Стиль для polylinedecorator стрелок */
          .leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive {
            transform-origin: center center !important;
          }
        `;
        document.head.appendChild(style);
      }
    };

    // Убеждаемся, что стили добавлены
    ensureStyles();

    // Очищаем предыдущие маркеры
    markersRef.current.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Очищаем предыдущий декоратор
    if (decoratorRef.current) {
      map.removeLayer(decoratorRef.current);
      decoratorRef.current = null;
    }

    // Добавляем новые стрелки, если маршрут выбран
    if (selectedRoute && map) {
      const positions = selectedRoute.points.map(point => [point.lat, point.lng]);

      if (positions.length >= 2) {
        try {
          // Создаем кастомную иконку для стрелок
          const arrowIcon = L.divIcon({
            html: `<div class="custom-arrow" style="transform: rotate(${ARROW_ROTATION_ADJUSTMENT}deg);">→</div>`,
            className: 'custom-arrow-container',
            iconSize: [ARROW_SIZE, ARROW_SIZE],
            iconAnchor: [ARROW_SIZE / 2, ARROW_SIZE / 2]
          });

          // Создаем декоратор со стрелками
          decoratorRef.current = L.polylineDecorator(positions, {
            patterns: [
              {
                offset: '1%', // Начинаем не с самого начала
                repeat: ARROW_FREQUENCY,
                symbol: L.Symbol.marker({
                  rotate: true, // Важно! Заставляет стрелки поворачиваться по направлению пути
                  markerOptions: {
                    icon: arrowIcon,
                    interactive: false
                  }
                })
              }
            ]
          }).addTo(map);

          // Костыль для старых версий библиотек: добавляем традиционные стрелки, если полидекоратор не работает
          if (!decoratorRef.current._layers || Object.keys(decoratorRef.current._layers).length === 0) {
            console.warn("Polylinedecorator не создал слои. Используем запасной вариант со стрелками.");
            // Определяем шаг для стрелок на основе длины маршрута
            const totalPoints = positions.length;
            const step = Math.max(3, Math.floor(totalPoints / 15)); // ~15 стрелок на маршрут
            
            for (let i = step; i < positions.length - 1; i += step) {
              const p1 = positions[i];
              const p2 = positions[i+1];
              
              // Вычисляем угол направления сегмента
              const angleDeg = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
              
              // Применяем корректировку угла для правильного направления стрелки
              const adjustedAngle = angleDeg + ARROW_ROTATION_ADJUSTMENT;
              
              // Создаем иконку с поворотом
              const rotatedIcon = L.divIcon({
                html: `<div class="custom-arrow" style="transform: rotate(${adjustedAngle}deg);">→</div>`,
                className: 'custom-arrow-container',
                iconSize: [ARROW_SIZE, ARROW_SIZE],
                iconAnchor: [ARROW_SIZE / 2, ARROW_SIZE / 2]
              });
              
              // Добавляем маркер
              const marker = L.marker(p1, {
                icon: rotatedIcon,
                interactive: false,
                keyboard: false
              }).addTo(map);
              
              markersRef.current.push(marker);
            }
          }
        } catch (error) {
          console.error("Ошибка при создании декоратора:", error);
        }
      }
    }

    // Функция очистки при размонтировании или изменении маршрута
    return () => {
      if (decoratorRef.current && map) {
        map.removeLayer(decoratorRef.current);
      }
      markersRef.current.forEach(marker => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      decoratorRef.current = null;
      markersRef.current = [];
    };
  }, [selectedRoute, map]);

  // Определяем, какие маршруты показывать
  const routesToShow = showAllRoutes
    ? routes
    : (selectedRoute ? [selectedRoute] : []);

  return (
    <>
      {routesToShow.map((route) => {
        const positions = route.points.map(point => [point.lat, point.lng]);

        if (positions.length < 2) {
          return null;
        }

        return (
          <React.Fragment key={route.id}>
            {/* Внешняя линия (граница) */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: ROUTE_BORDER_COLOR,
                weight: ROUTE_OUTER_WIDTH,
                opacity: ROUTE_OPACITY,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onRouteSelect(route.id),
              }}
            />
            {/* Внутренняя линия (основной цвет) */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: ROUTE_COLOR,
                weight: ROUTE_INNER_WIDTH,
                opacity: ROUTE_OPACITY,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onRouteSelect(route.id),
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
});

RoutePolylines.propTypes = {
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onRouteSelect: PropTypes.func.isRequired,
  showAllRoutes: PropTypes.bool,
};

RoutePolylines.defaultProps = {
  selectedRoute: null,
  showAllRoutes: false,
};

export default RoutePolylines;