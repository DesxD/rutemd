/**
 * Компонент для отображения маркеров на карте
 * Показывает маркеры только для выбранного маршрута
 */

import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import PropTypes from 'prop-types';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';
import '../../styles/markers/RouteMarkers.css';

function RouteMarkers({ selectedRoute, showAllRoutes, isEditing, onMarkerClick }) {
  const { markers } = useMarkersContext();
  
  // Определяем, какие маркеры показывать
  const visibleMarkers = useMemo(() => {
    if (!markers.length) return [];
    
    // Показываем все маркеры при включенном режиме отображения всех маршрутов
    if (showAllRoutes) {
      return markers;
    }
    
    // Показываем маркеры только для выбранного маршрута
    if (selectedRoute) {
      return markers.filter(marker => 
        marker.routeIds.includes(selectedRoute.id)
      );
    }
    
    return [];
  }, [markers, selectedRoute, showAllRoutes]);

  // Создание иконки маркера
  const createMarkerIcon = (marker) => {
    // По умолчанию используем иконку "sign-off.png"
    const imagePath = marker.imageUrl || '/images/markers/sign-off.png';
    
    const html = `
      <div class="custom-marker-container">
        <img src="${imagePath}" alt="${marker.title}" class="marker-icon" />
      </div>
    `;
    
    return divIcon({
      html,
      className: 'custom-marker-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  return (
    <>
      {visibleMarkers.map(marker => (
        <Marker 
          key={marker.id}
          position={[marker.position.lat, marker.position.lng]}
          icon={createMarkerIcon(marker)}
          eventHandlers={{
            click: () => isEditing && onMarkerClick && onMarkerClick(marker)
          }}
        >
          <Popup>
            <div className="marker-popup">
              <h3>{marker.title}</h3>
              <p className="marker-speech-text">{marker.speechText}</p>
              <p className="marker-sequence">Последовательность: {marker.sequence}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

RouteMarkers.propTypes = {
  selectedRoute: PropTypes.object,
  showAllRoutes: PropTypes.bool,
  isEditing: PropTypes.bool,
  onMarkerClick: PropTypes.func
};

RouteMarkers.defaultProps = {
  showAllRoutes: false,
  isEditing: false
};

export default RouteMarkers;