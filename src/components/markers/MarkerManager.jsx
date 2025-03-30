/**
 * Компонент для управления маркерами
 * Отображает список маркеров, позволяет их редактировать и удалять
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';
import MarkerForm from './MarkerForm';
import '../../styles/markers/MarkerManager.css';

function MarkerManager({ 
  isOpen, 
  onClose, 
  routes, 
  selectedRoute, 
  onMarkerSelect
}) {
  const { t } = useTranslation();
  const { markers, removeMarkerById } = useMarkersContext();
  const [editingMarker, setEditingMarker] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Фильтрованный список маркеров
  const filteredMarkers = useMemo(() => {
    if (filter === 'all') {
      return markers;
    } else if (filter === 'current' && selectedRoute) {
      return markers.filter(marker => 
        marker.routeIds.includes(selectedRoute.id)
      );
    }
    return markers;
  }, [markers, filter, selectedRoute]);
  
  // Обработчик клика по маркеру
  const handleMarkerClick = useCallback((marker) => {
    if (onMarkerSelect) {
      onMarkerSelect(marker);
    }
  }, [onMarkerSelect]);
  
  // Обработчик редактирования маркера
  const handleEditMarker = useCallback((marker) => {
    setEditingMarker(marker);
    setShowForm(true);
  }, []);
  
  // Обработчик удаления маркера
  const handleDeleteMarker = useCallback((markerId) => {
    if (window.confirm(t('markers.confirmDelete'))) {
      removeMarkerById(markerId);
    }
  }, [removeMarkerById, t]);
  
  // Обработчик добавления нового маркера
  const handleAddMarker = useCallback(() => {
    setEditingMarker(null);
    setShowForm(true);
  }, []);
  
  // Обработчик закрытия формы
  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingMarker(null);
  }, []);
  
  // Получение названия маршрутов для маркера
  const getRouteNames = useCallback((routeIds) => {
    return routeIds
      .map(routeId => {
        const route = routes.find(r => r.id === routeId);
        return route ? `${t('route')} ${route.number}` : routeId;
      })
      .join(', ');
  }, [routes, t]);
  
  if (!isOpen) return null;
  
  return (
    <div className="marker-manager-overlay">
      <div className="marker-manager">
        <div className="marker-manager-header">
          <h2>{t('markers.manageMarkers')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {showForm ? (
          <MarkerForm 
            marker={editingMarker}
            isEditing={!!editingMarker}
            onClose={handleCloseForm}
            routes={routes}
            selectedRoute={selectedRoute}
          />
        ) : (
          <>
            <div className="marker-controls">
              <button className="btn btn-primary" onClick={handleAddMarker}>
                {t('markers.addMarker')}
              </button>
              
              <div className="filter-controls">
                <label>{t('markers.filter')}:</label>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">{t('markers.showAll')}</option>
                  <option value="current" disabled={!selectedRoute}>
                    {t('markers.showCurrentRoute')}
                  </option>
                </select>
              </div>
            </div>
            
            {filteredMarkers.length === 0 ? (
              <p className="no-markers">{t('markers.noMarkers')}</p>
            ) : (
              <div className="markers-list">
                {filteredMarkers.map(marker => (
                  <div key={marker.id} className="marker-item">
                    <div className="marker-info" onClick={() => handleMarkerClick(marker)}>
                      <div className="marker-image">
                        <img src={marker.imageUrl} alt={marker.title} />
                      </div>
                      <div className="marker-details">
                        <h3>{marker.title}</h3>
                        <p className="marker-speech">{marker.speechText}</p>
                        <p className="marker-routes">
                          {t('markers.routes')}: {getRouteNames(marker.routeIds)}
                        </p>
                        <p className="marker-sequence">
                          {t('markers.sequence')}: {marker.sequence}
                        </p>
                      </div>
                    </div>
                    <div className="marker-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditMarker(marker)}
                        title={t('edit')}
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteMarker(marker.id)}
                        title={t('delete')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

MarkerManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onMarkerSelect: PropTypes.func
};

MarkerManager.defaultProps = {
  isOpen: false,
  routes: []
};

export default MarkerManager;