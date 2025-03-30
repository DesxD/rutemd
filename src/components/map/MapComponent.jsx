/**
 * Основной компонент карты
 * Объединяет все компоненты, связанные с картой, и управляет отображением маршрутов и местоположением
 * Добавлена поддержка маркеров и их размещения на карте
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import '../../styles/map/map.css';
import ChangeMapView from './ChangeMapView';
import RoutePolylines from './RoutePolylines';
import DirectionalLocationMarker from './DirectionalLocationMarker';
import LocationControl from './LocationControl';
import RouteMarkers from '../markers/RouteMarkers';
import MarkerForm from '../markers/MarkerForm';
import AudioNavigation from './AudioNavigation';
import { CITY_CENTERS } from '../../constants/mapConstants';
import useGeolocation from '../../hooks/useGeolocation';
import useRouteProximity from '../../hooks/useRouteProximity';

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
  
  // Состояния для управления маркерами (форма и позиция нового маркера)
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
  
  // Определяем текущий центр и масштаб для карты
  const effectiveCenter = isLocationActive && lastUserCenter && !isFollowActive
    ? lastUserCenter
    : isFollowActive && position && !userInteractedWithMap
      ? [position.latitude, position.longitude]
      : currentViewCenter;
      
  const effectiveZoom = isFollowActive && !userInteractedWithMap ? 16 : currentViewZoom;
  
  return (
    <div className={`map-container ${isMarkerPlacementMode ? 'marker-placement-mode' : ''}`}>
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
        
        {/* Показываем местоположение пользователя с индикатором направления */}
        {position && isLocationActive && (
          <DirectionalLocationMarker 
            position={position} 
            followUser={isFollowActive && !userInteractedWithMap}
          />
        )}
        
        {/* Компонент аудио-навигации */}
        {position && isLocationActive && selectedRoute && (
          <AudioNavigation 
            nearestPoint={nearestPoint}
            isOnRoute={isOnRoute}
            selectedRoute={selectedRoute}
            userPosition={position}
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
      
      {/* Удаляем контрол для управления маркерами, так как теперь он в сайдбаре */}
      
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