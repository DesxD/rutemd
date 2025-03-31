/**
 * Компонент для экспорта последовательностей маркеров
 * Позволяет экспортировать текущие последовательности маркеров в JSON файл
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';

function SequenceExporter({ currentCity, selectedRoute }) {
  const { t } = useTranslation();
  const { markers } = useMarkersContext();
  const [status, setStatus] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Функция экспорта последовательности
  const handleExportSequence = () => {
    if (!currentCity || !selectedRoute) {
      setStatus({
        type: 'error',
        message: t('sequences.noRouteSelected')
      });
      return;
    }

    setIsExporting(true);
    setStatus(null);

    try {
      // Фильтруем маркеры для текущего маршрута
      const routeMarkers = markers.filter(marker => 
        marker.routeIds.includes(selectedRoute.id)
      );
      
      if (!routeMarkers.length) {
        setStatus({
          type: 'warning',
          message: t('sequences.noMarkersForRoute')
        });
        setIsExporting(false);
        return;
      }
      
      // Сортируем маркеры по последовательности
      const sortedMarkers = [...routeMarkers].sort((a, b) => a.sequence - b.sequence);
      
      // Создаем объект данных для экспорта
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        city: currentCity,
        routeId: selectedRoute.id,
        routeNumber: selectedRoute.number,
        markersSequence: sortedMarkers.map((marker, index) => ({
          markerId: marker.id,
          title: marker.title,
          imageUrl: marker.imageUrl.replace('/images/markers/', ''),
          sequence: index // Используем индекс как последовательность
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
      a.download = `${currentCity}_route-${selectedRoute.number}_sequence.json`;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
      
      setStatus({
        type: 'success',
        message: t('sequences.exportSuccess', { count: sortedMarkers.length })
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: t('sequences.exportError', { error: error.message })
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="sequence-exporter">
      <button 
        className="btn-primary"
        onClick={handleExportSequence}
        disabled={isExporting || !selectedRoute}
      >
        {isExporting ? t('exporting') : t('sequences.exportSequence')}
      </button>
      
      {status && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

SequenceExporter.propTypes = {
  currentCity: PropTypes.string,
  selectedRoute: PropTypes.object
};

export default SequenceExporter;