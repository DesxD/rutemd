/**
 * Основной компонент карты
 * Объединяет все компоненты, связанные с картой, и управляет отображением маршрутов
 */

import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import PropTypes from 'prop-types';
import 'leaflet/dist/leaflet.css';
import '../../styles/map/map.css';
import ChangeMapView from './ChangeMapView';
import RoutePolylines from './RoutePolylines';
import RouteStartMarker from './RouteStartMarker';
import { CITY_CENTERS } from '../../constants/mapConstants';

function MapComponent({ 
  currentCity, 
  routes, 
  selectedRoute, 
  onRouteSelect,
  showAllRoutes 
}) {
  // Получаем координаты центра и масштаб для выбранного города
  const { center, zoom } = CITY_CENTERS[currentCity] || CITY_CENTERS.edinet;

  return (
    <div className="map-container">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        zoomControl={false}
      >
        <ChangeMapView center={center} zoom={zoom} />
        <ZoomControl position="topright" />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RoutePolylines 
          routes={routes} 
          selectedRoute={selectedRoute} 
          onRouteSelect={onRouteSelect}
          showAllRoutes={showAllRoutes}
        />
        
        {selectedRoute && !showAllRoutes && (
          <RouteStartMarker route={selectedRoute} />
        )}
      </MapContainer>
    </div>
  );
}

MapComponent.propTypes = {
  currentCity: PropTypes.string.isRequired,
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onRouteSelect: PropTypes.func.isRequired,
  showAllRoutes: PropTypes.bool.isRequired
};

export default MapComponent;