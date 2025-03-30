/**
 * Основной компонент карты
 * Объединяет все компоненты, связанные с картой, и управляет отображением маршрутов и местоположением
 * Удален маркер начала маршрута
 */

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';
import 'leaflet/dist/leaflet.css';
import '../../styles/map/map.css';
import ChangeMapView from './ChangeMapView';
import RoutePolylines from './RoutePolylines';
// Импорт маркера начала маршрута удален
// import RouteStartMarker from './RouteStartMarker';
import DirectionalLocationMarker from './DirectionalLocationMarker';
import LocationControl from './LocationControl';
import { CITY_CENTERS } from '../../constants/mapConstants';
import useGeolocation from '../../hooks/useGeolocation';
import useRouteProximity from '../../hooks/useRouteProximity';

// Компонент для обработки событий карты
function MapEvents({ onUserMapInteraction, isFollowActive }) {
  useMapEvents({
    dragstart: () => {
      if (isFollowActive) {
        onUserMapInteraction();
      }
    },
    zoomstart: () => {
      if (isFollowActive) {
        onUserMapInteraction();
      }
    }
  });
  
  return null;
}

MapEvents.propTypes = {
  onUserMapInteraction: PropTypes.func.isRequired,
  isFollowActive: PropTypes.bool.isRequired
};

function MapComponent({ 
  currentCity, 
  routes, 
  selectedRoute, 
  onRouteSelect,
  showAllRoutes 
}) {
  // Получаем координаты центра и масштаб для выбранного города
  const { center, zoom } = CITY_CENTERS[currentCity] || CITY_CENTERS.edinet;
  const mapRef = useRef(null);
  
  // Состояния для управления геолокацией и навигацией
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [isFollowActive, setIsFollowActive] = useState(false);
  const [userInteractedWithMap, setUserInteractedWithMap] = useState(false);
  const [lastUserCenter, setLastUserCenter] = useState(null);
  const [currentViewCenter, setCurrentViewCenter] = useState(center);
  const [currentViewZoom, setCurrentViewZoom] = useState(zoom);
  
  // Получаем данные геолокации
  const { 
    position, 
    error, 
    startWatching, 
    stopWatching 
  } = useGeolocation();
  
  // Используем хук для определения близости к маршруту
  const { nearestPoint, isOnRoute } = useRouteProximity(
    selectedRoute, 
    position, 
    { proximityThreshold: 100 }
  );
  
  // Обновляем последний центр при изменении положения пользователя
  useEffect(() => {
    if (position) {
      setLastUserCenter([position.latitude, position.longitude]);
      
      // Если активен режим следования, обновляем центр просмотра
      if (isFollowActive && !userInteractedWithMap) {
        setCurrentViewCenter([position.latitude, position.longitude]);
        setCurrentViewZoom(16);
      }
    }
  }, [position, isFollowActive, userInteractedWithMap]);
  
  // Обработчик смены города
  useEffect(() => {
    // Обновляем центр только если геолокация неактивна или пользователь не на карте
    if (!isLocationActive || !lastUserCenter) {
      setCurrentViewCenter(center);
      setCurrentViewZoom(zoom);
    }
  }, [currentCity, center, zoom, isLocationActive, lastUserCenter]);
  
  // Обработчик включения/выключения геолокации
  const handleToggleLocation = () => {
    if (isLocationActive) {
      stopWatching();
      setIsLocationActive(false);
      setIsFollowActive(false);
      // Не меняем центр при выключении геолокации - оставляем последнюю позицию
    } else {
      startWatching();
      setIsLocationActive(true);
      setIsFollowActive(true);
      setUserInteractedWithMap(false);
    }
  };
  
  // Обработчик включения/выключения следования за пользователем
  const handleToggleFollow = () => {
    if (!isFollowActive) {
      setIsFollowActive(true);
      setUserInteractedWithMap(false);
      
      // Если есть позиция пользователя, сразу центрируем на ней
      if (position) {
        setCurrentViewCenter([position.latitude, position.longitude]);
        setCurrentViewZoom(16);
      }
    } else {
      setIsFollowActive(false);
    }
  };
  
  // Обработчик взаимодействия пользователя с картой
  const handleUserMapInteraction = () => {
    if (isFollowActive) {
      setUserInteractedWithMap(true);
      setIsFollowActive(false);
    }
  };
  
  // Определяем текущий центр и масштаб для карты
  const effectiveCenter = isLocationActive && lastUserCenter && !isFollowActive
    ? lastUserCenter
    : isFollowActive && position && !userInteractedWithMap
      ? [position.latitude, position.longitude]
      : currentViewCenter;
      
  const effectiveZoom = isFollowActive && !userInteractedWithMap ? 16 : currentViewZoom;
  
  return (
    <div className="map-container">
      <MapContainer 
        ref={mapRef}
        center={effectiveCenter} 
        zoom={effectiveZoom} 
        scrollWheelZoom={true} 
        zoomControl={false}
      >
        <ChangeMapView 
          center={effectiveCenter} 
          zoom={effectiveZoom} 
        />
        
        <MapEvents 
          onUserMapInteraction={handleUserMapInteraction}
          isFollowActive={isFollowActive}
        />
        
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
        
        {/* Удален маркер начала маршрута
        {selectedRoute && !showAllRoutes && (
          <RouteStartMarker route={selectedRoute} />
        )}
        */}
        
        {/* Показываем местоположение пользователя с индикатором направления */}
        {position && isLocationActive && (
          <DirectionalLocationMarker 
            position={position} 
            followUser={isFollowActive && !userInteractedWithMap}
          />
        )}
        
        {/* Здесь в будущем можно добавить отображение ближайших маркеров */}
        {/* Для этого можно использовать данные из nearestPoint и isOnRoute */}
      </MapContainer>
      
      {/* Кнопки управления геолокацией */}
      <LocationControl 
        onToggleLocation={handleToggleLocation}
        isLocationActive={isLocationActive}
        onToggleFollow={handleToggleFollow}
        isFollowActive={isFollowActive}
      />
      
      {/* В будущем здесь можно добавить компонент для аудио-навигации */}
      {/* {position && isLocationActive && selectedRoute && (
        <AudioNavigation 
          nearestPoint={nearestPoint}
          isOnRoute={isOnRoute}
        />
      )} */}
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