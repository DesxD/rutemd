/**
 * Компонент для настройки последовательности маркеров
 * Позволяет перетаскиванием изменять порядок озвучивания маркеров для конкретного маршрута
 */

import { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';
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

function MarkersSequencer({ isOpen, onClose, selectedRoute, routes }) {
  const { t } = useTranslation();
  const { markers, updateMarkerById } = useMarkersContext();
  
  // Локальное состояние для отображения маркеров в определенном порядке
  const [routeMarkers, setRouteMarkers] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

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
    
    // Предлагаем экспортировать последовательность
    if (window.confirm(t('markers.exportSequencePrompt'))) {
      exportSequence();
    } else {
      onClose();
    }
  }, [routeMarkers, updateMarkerById, onClose, t]);

  // Функция для экспорта последовательности маркеров
  const exportSequence = useCallback(() => {
    try {
      // Создаем объект данных для экспорта
      const exportData = {
        routeId: selectedRoute.id,
        routeNumber: selectedRoute.number,
        markersSequence: routeMarkers.map((marker, index) => ({
          markerId: marker.id,
          title: marker.title,
          imageUrl: marker.imageUrl.replace('/images/markers/', ''),
          sequence: index
        }))
      };
      
      // Преобразуем в JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Создаем blob и ссылку для скачивания
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Создаем элемент для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = `route_${selectedRoute.number}_markers_sequence.json`;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
      
      onClose();
    } catch (error) {
      console.error('Ошибка при экспорте последовательности:', error);
      alert(t('markers.exportError'));
    }
  }, [selectedRoute, routeMarkers, onClose, t]);

  // Функция для импорта последовательности маркеров
  const handleImportSequence = useCallback(() => {
    // Создаем элемент для загрузки файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          
          // Проверяем соответствие маршрута
          if (importData.routeId !== selectedRoute.id) {
            if (!window.confirm(t('markers.importRouteMismatch'))) {
              return;
            }
          }
          
          // Обновляем последовательность маркеров
          importData.markersSequence.forEach((item) => {
            const marker = markers.find(m => m.id === item.markerId);
            if (marker) {
              updateMarkerById(marker.id, { sequence: item.sequence });
            }
          });
          
          // Обновляем локальный список
          const updatedMarkers = [...markers].filter(marker => 
            marker.routeIds.includes(selectedRoute.id)
          ).sort((a, b) => {
            const aSeq = importData.markersSequence.find(m => m.markerId === a.id)?.sequence || a.sequence;
            const bSeq = importData.markersSequence.find(m => m.markerId === b.id)?.sequence || b.sequence;
            return aSeq - bSeq;
          });
          
          setRouteMarkers(updatedMarkers);
          setHasChanges(true);
          
          alert(t('markers.importSuccess'));
        } catch (error) {
          console.error('Ошибка при импорте последовательности:', error);
          alert(t('markers.importError'));
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }, [selectedRoute, markers, updateMarkerById, t]);

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
  routes: PropTypes.array
};

MarkersSequencer.defaultProps = {
  routes: []
};

export default MarkersSequencer;