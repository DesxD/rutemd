/**
 * Компонент боковой панели
 * Содержит элементы управления: выбор города и маршрута
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CitySelector from '../selectors/CitySelector';
import RouteSelector from '../selectors/RouteSelector';
import '../../styles/sidebar/Sidebar.css';

function Sidebar({ 
  currentCity, 
  onCityChange, 
  routes, 
  selectedRoute, 
  onRouteSelect,
  isOpen,
  onToggleShowAllRoutes,
  showAllRoutes
}) {
  const { t } = useTranslation();

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
      </div>
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
  showAllRoutes: PropTypes.bool.isRequired
};

export default Sidebar;