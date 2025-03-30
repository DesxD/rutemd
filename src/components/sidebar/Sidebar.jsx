/**
 * Компонент боковой панели
 * Содержит элементы управления: выбор города и маршрута, а также управление маркерами
 * Добавлена кнопка включения/выключения аудио-навигации
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CitySelector from '../selectors/CitySelector';
import RouteSelector from '../selectors/RouteSelector';
import MarkerManager from '../markers/MarkerManager';
import MarkersSequencer from '../markers/MarkersSequencer';
import MarkersImportExport from '../markers/MarkersImportExport';
import { useAudioContext } from '../../contexts/AudioContext.jsx';
import '../../styles/sidebar/Sidebar.css';

function Sidebar({ 
  currentCity, 
  onCityChange, 
  routes, 
  selectedRoute, 
  onRouteSelect,
  isOpen,
  onToggleShowAllRoutes,
  showAllRoutes,
  onToggleMarkerPlacement
}) {
  const { t } = useTranslation();
  const { isAudioEnabled, toggleAudio } = useAudioContext();
  
  // Добавляем состояния для управления модальными окнами
  const [showMarkerManager, setShowMarkerManager] = useState(false);
  const [showSequencer, setShowSequencer] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Корректный обработчик клика для размещения маркера
  const handleToggleMarkerPlacement = () => {
    if (typeof onToggleMarkerPlacement === 'function') {
      onToggleMarkerPlacement(true); // Включаем режим размещения
    } else {
      console.error('onToggleMarkerPlacement не является функцией');
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>      
      <div className="sidebar-content">
        <h2 className="sidebar-title">{t('apph1')}</h2>
        
        <div className="sidebar-section">
          <h3>{t('selectCity')}</h3>
          <CitySelector 
            currentCity={currentCity} 
            onCityChange={onCityChange} 
          />
        </div>
        
        <div className="sidebar-section">
          <h3>{t('selectRoute')}</h3>
          <RouteSelector 
            routes={routes} 
            selectedRoute={selectedRoute} 
            onRouteSelect={onRouteSelect} 
          />
        </div>

        <div className="sidebar-section">
          <label className="toggle-container">
            <input 
              type="checkbox" 
              checked={showAllRoutes} 
              onChange={onToggleShowAllRoutes}
            />
            <span className="toggle-label">{t('showAllRoutes')}</span>
          </label>
        </div>
        
        {/* Секция аудио-навигации */}
        <div className="sidebar-section audio-section">
          <label className="toggle-container">
            <input 
              type="checkbox" 
              checked={isAudioEnabled} 
              onChange={toggleAudio}
            />
            <span className="toggle-label">
              {isAudioEnabled ? (
                <><span className="audio-icon">🔊</span> {t('audio.enabled')}</>
              ) : (
                <><span className="audio-icon">🔇</span> {t('audio.disabled')}</>
              )}
            </span>
          </label>
        </div>
        
        {/* Добавляем раздел управления маркерами */}
        <div className="sidebar-section markers-section">
          <h3>{t('markers.title')}</h3>
          <div className="marker-buttons">
            <button 
              className="btn-marker" 
              onClick={handleToggleMarkerPlacement}
              title={t('markers.placeMarker')}
            >
              <span className="icon">📍</span>
              {t('markers.placeMarker')}
            </button>
            
            <button 
              className="btn-marker" 
              onClick={() => setShowMarkerManager(true)}
              title={t('markers.manageMarkers')}
            >
              <span className="icon">🔧</span>
              {t('markers.manageMarkers')}
            </button>
            
            {selectedRoute && (
              <button 
                className="btn-marker" 
                onClick={() => setShowSequencer(true)}
                title={t('markers.setSequence')}
              >
                <span className="icon">🔄</span>
                {t('markers.setSequence')}
              </button>
            )}
            
            <button 
              className="btn-marker" 
              onClick={() => setShowImportExport(true)}
              title={t('markers.importExport')}
            >
              <span className="icon">💾</span>
              {t('markers.importExport')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Компонент менеджера маркеров */}
      {showMarkerManager && (
        <MarkerManager 
          isOpen={showMarkerManager}
          onClose={() => setShowMarkerManager(false)}
          routes={routes}
          selectedRoute={selectedRoute}
        />
      )}
      
      {/* Компонент для настройки последовательности */}
      {showSequencer && selectedRoute && (
        <MarkersSequencer
          isOpen={showSequencer}
          onClose={() => setShowSequencer(false)}
          selectedRoute={selectedRoute}
          routes={routes}
        />
      )}
      
      {/* Компонент для импорта/экспорта маркеров */}
      {showImportExport && (
        <MarkersImportExport 
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
        />
      )}
    </div>
  );
}

Sidebar.propTypes = {
  currentCity: PropTypes.string.isRequired,
  onCityChange: PropTypes.func.isRequired,
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onRouteSelect: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggleShowAllRoutes: PropTypes.func.isRequired,
  showAllRoutes: PropTypes.bool.isRequired,
  onToggleMarkerPlacement: PropTypes.func
};

export default Sidebar;