/**
 * Компонент для отображения маршрутов на карте
 * Рисует полилинии для каждого маршрута с соответствующим цветом
 */

import { Polyline } from 'react-leaflet';
import PropTypes from 'prop-types';
import { ROUTE_COLORS, DEFAULT_ROUTE_STYLE, SELECTED_ROUTE_STYLE } from '../../constants/mapConstants';

function RoutePolylines({ routes, selectedRoute, onRouteSelect }) {
  return routes.map((route, index) => {
    const isSelected = selectedRoute && selectedRoute.id === route.id;
    
    return (
      <Polyline 
        key={route.id}
        positions={route.points.map(point => [point.lat, point.lng])}
        color={ROUTE_COLORS[index % ROUTE_COLORS.length]}
        weight={isSelected ? SELECTED_ROUTE_STYLE.weight : DEFAULT_ROUTE_STYLE.weight}
        opacity={isSelected ? SELECTED_ROUTE_STYLE.opacity : DEFAULT_ROUTE_STYLE.opacity}
        onClick={() => onRouteSelect(route.id)}
      />
    );
  });
}

RoutePolylines.propTypes = {
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onRouteSelect: PropTypes.func.isRequired
};

export default RoutePolylines;