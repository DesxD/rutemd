/**
 * Компонент для обновления центра и масштаба карты
 * Используется внутри MapContainer для изменения центра при выборе города
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import PropTypes from 'prop-types';

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

ChangeMapView.propTypes = {
  center: PropTypes.array.isRequired,
  zoom: PropTypes.number.isRequired
};

export default ChangeMapView;