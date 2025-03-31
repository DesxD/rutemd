/**
 * Компонент для настройки последовательности маркеров
 * Позволяет перетаскиванием изменять порядок озвучивания маркеров для конкретного маршрута
 * Обновлен для работы с новым подходом к последовательностям
 */

import { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';
import useExportSequence from '../../hooks/useExportSequence';
import '../../styles/markers/MarkersSequencer.css';

// Константы для типов перетаскивания
const MARKER_ITEM_TYPE = 'marker';

// Компонент элемента маркера с возможностью перетаскивания
const DraggableMarkerItem = ({ marker, index, moveMarker }) => {
  const [{ isDragging }, drag] = useDrag({
    type: MARKER_ITEM_TYPE,
    item: { id: marker.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: MARKER_ITEM_TYPE,
    hover: (item, monitor) => {
      if (!drag) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Не заменяем элементы сами с собой
      if (dragIndex === hoverIndex) {
        return;
      }

      moveMarker(dragIndex, hoverIndex);
      
      // Обновляем индекс при перетаскивании
      item.index = hoverIndex;
    },
  });

  return (
    <div 
      ref={(node) => drag(drop(node))}
      className={`sequencer-marker-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="sequencer-marker-handle">
        <span>&#8801;</span>
      </div>
      <div className="sequencer-marker-image">
        <img src={marker.imageUrl} alt={marker.title} />
      </div>
      <div className="sequencer-marker-info">
        <h4>{marker.title}</h4>
        <p className="sequencer-marker-speech">{marker.speechText}</p>
      </div>
      <div className="sequencer-marker-order">
        {index + 1}
      </div>
    </div>
  );
};

DraggableMarkerItem.propTypes = {
  marker: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  moveMarker: PropTypes.func.isRequired,
};

function MarkersSequencer({ isOpen, onClose, selectedRoute, routes, currentCity }) {
  const { t } = useTranslation();
  const { markers, updateMarkerById } = useMarkersContext();
  const { exportSequence, importSequence } = useExportSequence();
  
  // Локальное состояние для отображения маркеров в определенном порядке
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Инициализация списка маркеров при изменении выбранного маршрута
  useEffect(() => {
    if (selectedRoute) {
      const filteredMarkers = markers.filter(marker => 
        marker.routeIds.includes(selectedRoute.id)
      );
      
      // Сортируем маркеры по последовательности
      const sortedMarkers = [...filteredMarkers].sort((a, b) => a.sequence - b.sequence);
      
      setRouteMarkers(sortedMarkers);
      setHasChanges(false);
      setStatusMessage('');
    }
  }, [selectedRoute, markers]);

  // Функция для перемещения маркера в списке (при перетаскивании)
  const moveMarker = useCallback((dragIndex, hoverIndex) => {
    setRouteMarkers((prevMarkers) => {
      const result = [...prevMarkers];
      const [removed] = result.splice(dragIndex, 1);
      result.splice(hoverIndex, 0, removed);
      return result;
    });
    setHasChanges(true);
  }, []);

  // Сохранение обновленного порядка маркеров
  const handleSaveSequence = useCallback(() => {
    // Обновляем sequence для каждого маркера
    routeMarkers.forEach((marker, index) => {
      updateMarkerById(marker.id, { sequence: index });
    });
    
    setHasChanges(false);
    setStatusMessage(t('markers.sequenceSaved'));
    
    // Предлагаем экспортировать последовательность
    if (window.confirm(t('markers.exportSequencePrompt'))) {
      handleExportSequence();
    }
  }, [routeMarkers, updateMarkerById, t]);

  // Функция для экспорта последовательности маркеров
  const handleExportSequence = useCallback(() => {
    if (!selectedRoute || !routeMarkers.length || !currentCity) {
      setStatusMessage(t('markers.noDataForExport'));
      return;
    }
    
    exportSequence(selectedRoute, currentCity)
      .then(result => {
        setStatusMessage(result.message);
      })
      .catch(error => {
        setStatusMessage(t('markers.exportError') + ': ' + error);
      });
  }, [selectedRoute, routeMarkers, currentCity, exportSequence, t]);

  // Функция для импорта последовательности маркеров
  const handleImportSequence = useCallback(() => {
    // Создаем элемент для загрузки файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      importSequence(file)
        .then(result => {
          setStatusMessage(result.message);
          
          // Обновляем список маркеров, чтобы отразить изменения
          const filteredMarkers = markers.filter(marker => 
            marker.routeIds.includes(selectedRoute.id)
          );
          const sortedMarkers = [...filteredMarkers].sort((a, b) => a.sequence - b.sequence);
          
          setRouteMarkers(sortedMarkers);
          // Сбрасываем флаг изменений, так как мы только что загрузили последовательность
          setHasChanges(false);
        })
        .catch(error => {
          setStatusMessage(t('markers.importError') + ': ' + error);
        });
    };
    
    input.click();
  }, [selectedRoute, markers, importSequence, t]);

  if (!isOpen) return null;

  return (
    <div className="sequencer-overlay">
      <div className="sequencer-container">
        <div className="sequencer-header">
          <h2>{t('markers.sequenceTitle')} - {t('route')} {selectedRoute.number}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {routeMarkers.length === 0 ? (
          <div className="sequencer-empty">
            <p>{t('markers.noMarkersForRoute')}</p>
            <button 
              className="btn btn-primary"
              onClick={onClose}
            >
              {t('close')}
            </button>
          </div>
        ) : (
          <>
            <div className="sequencer-instructions">
              <p>{t('markers.sequencerInstructions')}</p>
              {statusMessage && (
                <div className="status-message">
                  {statusMessage}
                </div>
              )}
            </div>
            
            <div className="sequencer-list">
              <DndProvider backend={HTML5Backend}>
                {routeMarkers.map((marker, index) => (
                  <DraggableMarkerItem
                    key={marker.id}
                    marker={marker}
                    index={index}
                    moveMarker={moveMarker}
                  />
                ))}
              </DndProvider>
            </div>
            
            <div className="sequencer-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSaveSequence}
                disabled={!hasChanges}
              >
                {t('markers.saveSequence')}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={handleExportSequence}
              >
                {t('markers.exportSequence')}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={handleImportSequence}
              >
                {t('markers.importSequence')}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={onClose}
              >
                {t('cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

MarkersSequencer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedRoute: PropTypes.object,
  routes: PropTypes.array,
  currentCity: PropTypes.string
};

MarkersSequencer.defaultProps = {
  routes: [],
  currentCity: ''
};

export default MarkersSequencer;