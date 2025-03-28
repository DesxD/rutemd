/**
 * Компонент для отображения маркера начала маршрута
 * Показывает зеленый маркер в начальной точке выбранного маршрута
 */

import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

// Иконка для маркера начала маршрута
const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function RouteStartMarker({ route }) {
  const { t } = useTranslation();
  
  if (!route || !route.points || route.points.length === 0) {
    return null;
  }
  
  return (
    <Marker 
      position={[route.points[0].lat, route.points[0].lng]} 
      icon={startIcon}
    >
      <Popup>
        {t('routeStart')} {route.number}
      </Popup>
    </Marker>
  );
}

RouteStartMarker.propTypes = {
  route: PropTypes.object
};

export default RouteStartMarker;