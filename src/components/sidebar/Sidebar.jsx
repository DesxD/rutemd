/**
 * Компонент боковой панели
 * Обновлен для поддержки аудио-функциональности и скрытия маркеров
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext';
import { useAudioContext } from '../../contexts/AudioContext';
import CitySelector from '../selectors/CitySelector';
import RouteSelector from '../selectors/RouteSelector';
import MarkerManager from '../markers/MarkerManager';
import SequenceManager from '../sequences/SequenceManager';
import MarkersImportExport from '../markers/MarkersImportExport';
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
  onToggleMarkerPlacement,
  showMarkers,
  onToggleShowMarkers
}) {
  const { t } = useTranslation();
  const { applySequenceFromFile } = useMarkersContext();
  const { isAudioEnabled, toggleAudio } = useAudioContext();
  
  // Состояния для управления модальными окнами
  const [showMarkerManager, setShowMarkerManager] = useState(false);
  const [showSequenceManager, setShowSequenceManager] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Корректный обработчик клика для размещения маркера
  const handleToggleMarkerPlacement = () => {
    if (typeof onToggleMarkerPlacement === 'function') {
      onToggleMarkerPlacement(true); // Включаем режим размещения
    } else {
      console.error('onToggleMarkerPlacement не является функцией');
    }
  };

  // Обработчик быстрой загрузки последовательности
  const handleQuickLoad = async () => {
    if (currentCity && selectedRoute) {
      const result = await applySequenceFromFile(currentCity, selectedRoute.number);
      
      // Уведомление о результате
      if (result) {
        alert(t('sequences.quickLoadSuccess'));
      } else {
        alert(t('sequences.quickLoadNotFound'));
      }
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
          <h3>{t('audio.title')}</h3>
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
        
        {/* Раздел управления маркерами */}
        <div className="sidebar-section markers-section">
          <h3>{t('markers.title')}</h3>
          
          {/* Переключатель отображения маркеров */}
          <label className="toggle-container">
            <input 
              type="checkbox" 
              checked={showMarkers} 
              onChange={onToggleShowMarkers}
            />
            <span className="toggle-label">
              {showMarkers ? t('markers.show') : t('markers.hide')}
            </span>
          </label>
          
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
        
        {/* Раздел управления последовательностями */}
        <div className="sidebar-section sequences-section">
          <h3>{t('sequences.title')}</h3>
          <div className="sequence-buttons">
            <button 
              className="btn-sequence" 
              onClick={() => setShowSequenceManager(true)}
              title={t('sequences.manageSequences')}
            >
              <span className="icon">🔄</span>
              {t('sequences.manageSequences')}
            </button>
            
            {/* Кнопка быстрой загрузки последовательности для текущего маршрута */}
            {selectedRoute && (
              <button 
                className="btn-sequence btn-quick-load" 
                onClick={handleQuickLoad}
                title={t('sequences.quickLoad')}
              >
                <span className="icon">⚡</span>
                {t('sequences.quickLoad')}
              </button>
            )}
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
      
      {/* Компонент для управления последовательностями */}
      {showSequenceManager && (
        <SequenceManager
          isOpen={showSequenceManager}
          onClose={() => setShowSequenceManager(false)}
          currentCity={currentCity}
          selectedRoute={selectedRoute}
          routes={routes}
        />
      )}
      
      {/* Компонент для импорта/экспорта маркеров */}
      {showImportExport && (
        <MarkersImportExport 
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          currentCity={currentCity}
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
  onToggleMarkerPlacement: PropTypes.func,
  showMarkers: PropTypes.bool.isRequired,
  onToggleShowMarkers: PropTypes.func.isRequired
};

export default Sidebar;