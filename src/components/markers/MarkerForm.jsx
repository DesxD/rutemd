/**
 * Компонент формы для создания или редактирования маркера
 * Позволяет задать название, текст для озвучивания, изображение и связанные маршруты
 * Улучшенный выбор изображений с предпросмотром
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';
import '../../styles/markers/MarkerForm.css';

// Константа для путей к изображениям маркеров
const MARKER_IMAGES_PATH = '/images/markers';

// Список доступных изображений маркеров
const MARKER_IMAGES = [
  '7.png', 
  '8.png', 
  '10.png', 
  '11.png', 
  'asp.png', 
  'bump.png', 
  'crosswalk.png', 
  'give-way.png', 
  'lights.png', 
  'main-road.png', 
  'one-way.png', 
  'roundabout.png', 
  'sign-30.png', 
  'sign-50.png', 
  'sign-off.png', 
  'stop.png'
];

function MarkerForm({ 
  marker, 
  isEditing, 
  onClose, 
  position, 
  routes,
  selectedRoute
}) {
  const { t } = useTranslation();
  const { addMarker, updateMarkerById } = useMarkersContext();
  
  // Состояние формы
  const [title, setTitle] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [imageUrl, setImageUrl] = useState(`${MARKER_IMAGES_PATH}/sign-off.png`);
  const [selectedRouteIds, setSelectedRouteIds] = useState([]);
  const [sequence, setSequence] = useState(0);
  const [showImagesGrid, setShowImagesGrid] = useState(false);
  
  // Инициализация формы при редактировании
  useEffect(() => {
    if (isEditing && marker) {
      setTitle(marker.title || '');
      setSpeechText(marker.speechText || '');
      setImageUrl(marker.imageUrl || `${MARKER_IMAGES_PATH}/sign-off.png`);
      setSelectedRouteIds(marker.routeIds || []);
      setSequence(marker.sequence || 0);
    } else if (!isEditing && selectedRoute) {
      // При создании нового маркера, выбираем текущий маршрут
      setSelectedRouteIds(selectedRoute ? [selectedRoute.id] : []);
    }
  }, [isEditing, marker, selectedRoute]);
  
  // Обработчик выбора изображения
  const handleImageSelect = (img) => {
    const newImageUrl = `${MARKER_IMAGES_PATH}/${img}`;
    setImageUrl(newImageUrl);
    setShowImagesGrid(false);
  };
  
  // Получаем имя файла из полного пути
  const getImageFileName = (path) => {
    return path.split('/').pop();
  };
  
  // Обработчик изменения выбранных маршрутов
  const handleRouteCheckboxChange = (routeId) => {
    setSelectedRouteIds(prevSelected => {
      if (prevSelected.includes(routeId)) {
        return prevSelected.filter(id => id !== routeId);
      } else {
        return [...prevSelected, routeId];
      }
    });
  };
  
  // Обработчик сохранения маркера
  const handleSave = useCallback(() => {
    if (!title.trim()) {
      alert(t('markers.titleRequired'));
      return;
    }
    
    const markerData = {
      title: title.trim(),
      speechText: speechText.trim(),
      imageUrl,
      routeIds: selectedRouteIds,
      sequence: parseInt(sequence, 10) || 0
    };
    
    if (position) {
      markerData.position = position;
    }
    
    if (isEditing && marker) {
      updateMarkerById(marker.id, markerData);
    } else {
      addMarker(markerData);
    }
    
    onClose();
  }, [
    title, speechText, imageUrl, selectedRouteIds, sequence, 
    position, isEditing, marker, updateMarkerById, addMarker, onClose, t
  ]);
  
  // Проверка доступности кнопки сохранения
  const isSaveDisabled = !title.trim() || selectedRouteIds.length === 0;
  
  return (
    <div className="marker-form">
      <h2>
        {isEditing 
          ? t('markers.editMarker') 
          : t('markers.addMarker')}
      </h2>
      
      <div className="form-group">
        <label htmlFor="title">{t('markers.title')}:</label>
        <input 
          id="title"
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('markers.enterTitle')}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="speechText">{t('markers.speechText')}:</label>
        <textarea 
          id="speechText"
          value={speechText} 
          onChange={(e) => setSpeechText(e.target.value)}
          placeholder={t('markers.enterSpeechText')}
          rows={3}
        />
      </div>
      
      <div className="form-group">
        <label>{t('markers.selectImage')}:</label>
        <div className="image-selector">
          <div 
            className="selected-image-preview"
            onClick={() => setShowImagesGrid(!showImagesGrid)}
          >
            <img src={imageUrl} alt="Selected marker" />
            <span className="image-filename">{getImageFileName(imageUrl)}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {showImagesGrid && (
            <div className="images-grid">
              {MARKER_IMAGES.map(img => (
                <div 
                  key={img} 
                  className={`image-item ${imageUrl === `${MARKER_IMAGES_PATH}/${img}` ? 'selected' : ''}`}
                  onClick={() => handleImageSelect(img)}
                >
                  <img 
                    src={`${MARKER_IMAGES_PATH}/${img}`} 
                    alt={img} 
                  />
                  <span className="image-name">{img}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="sequence">{t('markers.sequence')}:</label>
        <input 
          id="sequence"
          type="number" 
          value={sequence} 
          onChange={(e) => setSequence(e.target.value)}
          placeholder={t('markers.enterSequence')}
          min="0"
        />
      </div>
      
      <div className="form-group">
        <label>{t('markers.relatedRoutes')}:</label>
        <div className="routes-checkbox-group">
          {routes.map(route => (
            <div key={route.id} className="route-checkbox">
              <input 
                type="checkbox"
                id={`route-${route.id}`}
                checked={selectedRouteIds.includes(route.id)}
                onChange={() => handleRouteCheckboxChange(route.id)}
              />
              <label htmlFor={`route-${route.id}`}>
                {t('route')} {route.number}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={isSaveDisabled}
        >
          {t('save')}
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={onClose}
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

MarkerForm.propTypes = {
  marker: PropTypes.object,
  isEditing: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }),
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object
};

MarkerForm.defaultProps = {
  isEditing: false,
  routes: []
};

export default MarkerForm;