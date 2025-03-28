/**
 * Компонент для отображения маршрутов на карте
 * Показывает только выбранный маршрут или все маршруты в зависимости от режима
 */

import { useEffect, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import useArrows from '../../hooks/useArrows';

// Стили для маршрута
const ROUTE_COLOR = '#fff'; // Синий цвет для маршрута
const ROUTE_BORDER_COLOR = '#3388ff'; // Белый цвет для границы
const ROUTE_INNER_WIDTH = 4; // Ширина внутренней линии
const ROUTE_OUTER_WIDTH = 10; // Ширина внешней линии
const ROUTE_OPACITY = 1.0; // Полная непрозрачность для лучшей видимости

function RoutePolylines({ routes, selectedRoute, onRouteSelect, showAllRoutes }) {
  const map = useMap();
  const innerPolylineRef = useRef(null);
  const { addArrowsToPolyline, clearArrows } = useArrows();
  
  // Обновляем стрелки при изменении выбранного маршрута
  useEffect(() => {
    if (selectedRoute && innerPolylineRef.current) {
      // Используем setTimeout, чтобы убедиться, что ссылка на полилинию установлена
      setTimeout(() => {
        if (innerPolylineRef.current) {
          addArrowsToPolyline(map, innerPolylineRef.current, ROUTE_COLOR);
        }
      }, 100);
    } else {
      clearArrows(map);
    }
    
    return () => {
      clearArrows(map);
    };
  }, [selectedRoute, map, addArrowsToPolyline, clearArrows]);

  // Определяем, какие маршруты показывать
  const routesToShow = showAllRoutes 
    ? routes 
    : (selectedRoute ? [selectedRoute] : []);

  return (
    <>
      {routesToShow.map((route) => {
        const isSelected = selectedRoute && selectedRoute.id === route.id;
        const positions = route.points.map(point => [point.lat, point.lng]);
        
        return (
          <div key={route.id}>
            {/* Внешняя линия (белая граница) */}
            <Polyline 
              positions={positions}
              pathOptions={{
                color: ROUTE_BORDER_COLOR,
                weight: ROUTE_OUTER_WIDTH,
                opacity: ROUTE_OPACITY,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              onClick={() => onRouteSelect(route.id)}
              eventHandlers={{
                click: () => onRouteSelect(route.id),
              }}
            />
            
            {/* Внутренняя линия (цветная) */}
            <Polyline 
              positions={positions}
              pathOptions={{
                color: ROUTE_COLOR,
                weight: ROUTE_INNER_WIDTH,
                opacity: ROUTE_OPACITY,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              onClick={() => onRouteSelect(route.id)}
              ref={isSelected ? innerPolylineRef : null}
              eventHandlers={{
                click: () => onRouteSelect(route.id),
              }}
            />
          </div>
        );
      })}
    </>
  );
}

RoutePolylines.propTypes = {
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onRouteSelect: PropTypes.func.isRequired,
  showAllRoutes: PropTypes.bool
};

RoutePolylines.defaultProps = {
  showAllRoutes: false
};

export default RoutePolylines;