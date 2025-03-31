/**
 * Компонент для загрузки последовательностей маркеров
 * Отображает кнопку для загрузки последовательностей для выбранного маршрута
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';

function SequenceLoader({ currentCity, selectedRoute }) {
  const { t } = useTranslation();
  const { applySequenceFromFile } = useMarkersContext();
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Сбрасываем статус при смене маршрута
  useEffect(() => {
    setStatus(null);
  }, [selectedRoute]);

  // Функция загрузки последовательности
  const handleLoadSequence = async () => {
    if (!currentCity || !selectedRoute) {
      setStatus({
        type: 'error',
        message: t('sequences.noRouteSelected')
      });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const result = await applySequenceFromFile(currentCity, selectedRoute.number);
      if (result) {
        setStatus({
          type: 'success',
          message: t('sequences.loadSuccess', { route: selectedRoute.number })
        });
      } else {
        setStatus({
          type: 'warning',
          message: t('sequences.sequenceNotFound', { route: selectedRoute.number })
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: t('sequences.loadError', { error: error.message })
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выбора файла последовательности вручную
  const handleImportSequence = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setIsLoading(true);
      setStatus(null);
      
      try {
        const reader = new FileReader();
        
        // Оборачиваем FileReader в Promise для использования async/await
        const fileContent = await new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsText(file);
        });
        
        const data = JSON.parse(fileContent);
        
        // Проверяем формат данных
        if (!data.markersSequence || !Array.isArray(data.markersSequence)) {
          throw new Error(t('sequences.invalidFormat'));
        }
        
        // Создаем словарь последовательностей
        const sequenceMap = {};
        data.markersSequence.forEach(item => {
          sequenceMap[item.markerId] = item.sequence;
        });
        
        // Применяем последовательности
        const { updateSequenceForRoute } = useMarkersContext();
        updateSequenceForRoute(data.routeId, sequenceMap);
        
        setStatus({
          type: 'success',
          message: t('sequences.importSuccess', { route: data.routeNumber })
        });
      } catch (error) {
        setStatus({
          type: 'error',
          message: t('sequences.importError', { error: error.message })
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="sequence-loader">
      <button 
        className="btn-primary"
        onClick={handleLoadSequence}
        disabled={isLoading || !selectedRoute}
      >
        {isLoading ? t('loading') : t('sequences.loadSequence')}
      </button>
      
      {/* Дополнительная кнопка для импорта из файла (опционально) */}
      <button 
        className="btn-secondary"
        onClick={handleImportSequence}
        disabled={isLoading}
      >
        {t('sequences.importSequence')}
      </button>
      
      {status && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

SequenceLoader.propTypes = {
  currentCity: PropTypes.string,
  selectedRoute: PropTypes.object
};

export default SequenceLoader;