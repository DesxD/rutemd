/**
 * Основной компонент карты
 * Объединяет все компоненты, связанные с картой, и управляет отображением маршрутов и местоположением
 * Добавлена поддержка маркеров и их размещения на карте
 * Добавлена интеграция с аудио-навигацией
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMapEvents, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import '../../styles/map/map.css';
import RoutePolylines from './RoutePolylines';
import DirectionalLocationMarker from './DirectionalLocationMarker';
import LocationControl from './LocationControl';
import RouteMarkers from '../markers/RouteMarkers';
import MarkerForm from '../markers/MarkerForm';
import AudioNavigation from './AudioNavigation';
import { CITY_CENTERS } from '../../constants/mapConstants';
import useGeolocation from '../../hooks/useGeolocation';
import useRouteProximity from '../../hooks/useRouteProximity';

// Компонент для внутреннего управления картой
function MapController({ 
  center, 
  isLocationActive, 
  isFollowActive,
  userPosition,
  currentCity
}) {
  const map = useMap();
  const initialZoomSet = useRef(false);
  const currentZoom = useRef(map.getZoom());
  
  // Запоминаем текущий зум при его изменении пользователем
  useMapEvents({
    zoomend: () => {
      currentZoom.current = map.getZoom();
    }
  });
  
  // Устанавливаем начальные координаты для города при монтировании
  useEffect(() => {
    if (!initialZoomSet.current) {
      map.setView(center, map.getZoom());
      initialZoomSet.current = true;
    }
  }, []);
  
  // Обрабатываем изменение города
  useEffect(() => {
    if (!isLocationActive) {
      // Только если геолокация неактивна, меняем вид на новый город
      const cityCenter = CITY_CENTERS[currentCity]?.center || center;
      // Используем текущий зум
      map.setView(cityCenter, currentZoom.current);
    }
  }, [currentCity, isLocationActive]);
  
  // Управляем следованием за пользователем
  useEffect(() => {
    if (isFollowActive && userPosition) {
      // При активном следовании центрируемся на пользователе, сохраняя текущий зум
      map.setView(
        [userPosition.latitude, userPosition.longitude], 
        currentZoom.current, 
        { animate: true }
      );
    }
  }, [isFollowActive, userPosition]);
  
  return null;
}

// Компонент для обработки событий карты и режима размещения маркеров
function MapEvents({ 
  onUserMapInteraction, 
  isFollowActive,
  isMarkerPlacementMode,
  onMarkerPlace
}) {
  const map = useMapEvents({
    dragstart: () => {
      if (isFollowActive) {
        onUserMapInteraction();
      }
    },
    zoomstart: () => {
      if (isFollowActive) {
        onUserMapInteraction();
      }
    },
    click: (e) => {
      if (isMarkerPlacementMode) {
        const { lat, lng } = e.latlng;
        onMarkerPlace({ lat, lng });
      }
    }
  });
  
  return null;
}

MapEvents.propTypes = {
  onUserMapInteraction: PropTypes.func.isRequired,
  isFollowActive: PropTypes.bool.isRequired,
  isMarkerPlacementMode: PropTypes.bool,
  onMarkerPlace: PropTypes.func
};

MapEvents.defaultProps = {
  isMarkerPlacementMode: false
};

function MapComponent({ 
  currentCity, 
  routes, 
  selectedRoute, 
  onRouteSelect,
  showAllRoutes,
  isMarkerPlacementMode,
  onToggleMarkerPlacement
}) {
  const { t } = useTranslation();
  // Получаем координаты центра для выбранного города
  const { center } = CITY_CENTERS[currentCity] || CITY_CENTERS.edinet;
  const mapRef = useRef(null);
  
  // Состояния для управления геолокацией и навигацией
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [isFollowActive, setIsFollowActive] = useState(false);
  
  // Состояния для управления маркерами
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isEditingMarker, setIsEditingMarker] = useState(false);
  
  // Эффект для сброса состояний при изменении режима размещения маркеров
  useEffect(() => {
    // Сбрасываем состояния только при выключении режима и если не показываем форму
    if (!isMarkerPlacementMode && !showMarkerForm) {
      setNewMarkerPosition(null);
    }
  }, [isMarkerPlacementMode, showMarkerForm]);
  
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
  
  // Обработчик включения/выключения геолокации
  const handleToggleLocation = () => {
    if (isLocationActive) {
      stopWatching();
      setIsLocationActive(false);
      setIsFollowActive(false);
    } else {
      startWatching();
      setIsLocationActive(true);
      // НЕ включаем автоматическое следование при активации геолокации
    }
  };
  
  // Обработчик включения/выключения следования за пользователем
  const handleToggleFollow = () => {
    setIsFollowActive(!isFollowActive);
  };
  
  // Обработчик взаимодействия пользователя с картой
  const handleUserMapInteraction = () => {
    if (isFollowActive) {
      setIsFollowActive(false);
    }
  };
  
  // Обработчик размещения маркера на карте
  const handleMarkerPlace = (position) => {
    setNewMarkerPosition(position);
    setShowMarkerForm(true);
    // Выключаем режим размещения маркера
    if (typeof onToggleMarkerPlacement === 'function') {
      onToggleMarkerPlacement(false);
    }
  };
  
  // Обработчик закрытия формы маркера
  const handleCloseMarkerForm = () => {
    setShowMarkerForm(false);
    setNewMarkerPosition(null);
    setSelectedMarker(null);
    setIsEditingMarker(false);
  };
  
  // Обработчик выбора маркера для редактирования
  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setIsEditingMarker(true);
    setShowMarkerForm(true);
  };
  
  return (
    <div className={`map-container ${isMarkerPlacementMode ? 'marker-placement-mode' : ''}`}>
      <MapContainer 
        ref={mapRef}
        center={center} 
        zoom={14} 
        scrollWheelZoom={true} 
        zoomControl={false}
      >
        {/* Контроллер для управления картой */}
        <MapController 
          center={center}
          isLocationActive={isLocationActive}
          isFollowActive={isFollowActive}
          userPosition={position}
          currentCity={currentCity}
        />
        
        <MapEvents 
          onUserMapInteraction={handleUserMapInteraction}
          isFollowActive={isFollowActive}
          isMarkerPlacementMode={isMarkerPlacementMode}
          onMarkerPlace={handleMarkerPlace}
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
        
        {/* Показываем маркеры на карте */}
        <RouteMarkers 
          selectedRoute={selectedRoute}
          showAllRoutes={showAllRoutes}
          isEditing={false}
          onMarkerClick={handleMarkerClick}
        />
        
        {/* Показываем местоположение пользователя */}
        {position && isLocationActive && (
          <DirectionalLocationMarker 
            position={position} 
          />
        )}
        
        {/* Компонент аудио-навигации */}
        {position && isLocationActive && selectedRoute && (
          <AudioNavigation 
            userPosition={position}
            selectedRoute={selectedRoute}
            isOnRoute={isOnRoute}
          />
        )}
      </MapContainer>
      
      {/* Кнопки управления геолокацией */}
      <LocationControl 
        onToggleLocation={handleToggleLocation}
        isLocationActive={isLocationActive}
        onToggleFollow={handleToggleFollow}
        isFollowActive={isFollowActive}
      />
      
      {/* Форма для создания/редактирования маркера */}
      {showMarkerForm && (
        <div className="marker-form-overlay">
          <div className="marker-form-container">
            <button 
              className="close-form-button" 
              onClick={handleCloseMarkerForm}
            >
              &times;
            </button>
            <MarkerForm 
              marker={isEditingMarker ? selectedMarker : null}
              isEditing={isEditingMarker}
              position={isEditingMarker ? null : newMarkerPosition}
              onClose={handleCloseMarkerForm}
              routes={routes}
              selectedRoute={selectedRoute}
            />
          </div>
        </div>
      )}
      
      {/* Индикатор режима размещения маркеров */}
      {isMarkerPlacementMode && (
        <div className="marker-placement-indicator">
          {t('markers.clickMapToPlace')}
        </div>
      )}
    </div>
  );
}

MapComponent.propTypes = {
  currentCity: PropTypes.string.isRequired,
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onRouteSelect: PropTypes.func.isRequired,
  showAllRoutes: PropTypes.bool.isRequired,
  isMarkerPlacementMode: PropTypes.bool,
  onToggleMarkerPlacement: PropTypes.func
};

MapComponent.defaultProps = {
  isMarkerPlacementMode: false
};

export default MapComponent;