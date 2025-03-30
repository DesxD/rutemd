/**
 * Компонент кнопок управления маркерами
 * Управляет режимом размещения маркеров и открытием менеджера маркеров
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MarkerManager from './MarkerManager';
import '../../styles/markers/MarkerControl.css';

function MarkerControl({ 
  onToggleMarkerPlacement, 
  isMarkerPlacementMode,
  routes,
  selectedRoute,
  onMarkerSelect
}) {
  const { t } = useTranslation();
  const [showMarkerManager, setShowMarkerManager] = useState(false);
  
  // Обработчик открытия/закрытия менеджера маркеров
  const handleToggleMarkerManager = () => {
    setShowMarkerManager(!showMarkerManager);
  };
  
  return (
    <>
      <div className="marker-controls">
        {/* Кнопка для размещения нового маркера */}
        <button 
          className={`control-button marker-button ${isMarkerPlacementMode ? 'active' : ''}`}
          onClick={onToggleMarkerPlacement}
          title={t('markers.placeMarker')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </button>
        
        {/* Кнопка для открытия менеджера маркеров */}
        <button 
          className={`control-button manager-button ${showMarkerManager ? 'active' : ''}`}
          onClick={handleToggleMarkerManager}
          title={t('markers.manageMarkers')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/>
          </svg>
        </button>
      </div>
      
      {/* Компонент менеджера маркеров */}
      <MarkerManager 
        isOpen={showMarkerManager}
        onClose={() => setShowMarkerManager(false)}
        routes={routes}
        selectedRoute={selectedRoute}
        onMarkerSelect={onMarkerSelect}
      />
    </>
  );
}

MarkerControl.propTypes = {
  onToggleMarkerPlacement: PropTypes.func.isRequired,
  isMarkerPlacementMode: PropTypes.bool.isRequired,
  routes: PropTypes.array,
  selectedRoute: PropTypes.object,
  onMarkerSelect: PropTypes.func
};

MarkerControl.defaultProps = {
  routes: [],
  selectedRoute: null
};

export default MarkerControl;