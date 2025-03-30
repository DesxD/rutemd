/**
 * Компонент для импорта и экспорта маркеров
 * Позволяет сохранять все данные о маркерах в файл и загружать их обратно
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useMarkersContext } from '../../contexts/MarkersContext.jsx';
import '../../styles/markers/MarkersImportExport.css';

function MarkersImportExport({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { markers, addMarker, updateMarkerById } = useMarkersContext();
  const [log, setLog] = useState('');
  const [preserveExisting, setPreserveExisting] = useState(true);

  // Добавление сообщения в лог
  const addToLog = (message) => {
    setLog(prev => `${prev}${message}\n`);
  };

  // Экспорт всех маркеров в JSON файл
  const handleExportMarkers = useCallback(() => {
    try {
      // Создаем объект для экспорта
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        markers: markers
      };

      // Преобразуем в JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Создаем blob и ссылку для скачивания
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Создаем элемент для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = `markers_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем ресурсы
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
      
      addToLog(t('markers.exportSuccess', { count: markers.length }));
    } catch (error) {
      console.error('Ошибка при экспорте маркеров:', error);
      addToLog(t('markers.exportError'));
    }
  }, [markers, t]);

  // Импорт маркеров из JSON файла
  const handleImportMarkers = useCallback(() => {
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
          
          // Проверяем, что данные имеют корректный формат
          if (!importData.markers || !Array.isArray(importData.markers)) {
            throw new Error('Некорректный формат данных');
          }
          
          // Маркеры для импорта
          const markersToImport = importData.markers;
          
          // Очищаем лог
          setLog('');
          
          // Обработка импорта в зависимости от режима
          if (!preserveExisting) {
            // Если не сохраняем существующие маркеры, просто заменяем их
            // Здесь мы полагаемся на то, что localStorage будет обновлен хуком useMarkers
            localStorage.setItem('route_markers', JSON.stringify(markersToImport));
            
            // Перезагружаем страницу для применения изменений
            addToLog(t('markers.importSuccess', { count: markersToImport.length }));
            addToLog(t('markers.reloadRequired'));
            
            // Предлагаем пользователю перезагрузить страницу
            setTimeout(() => {
              if (window.confirm(t('markers.confirmReload'))) {
                window.location.reload();
              }
            }, 1000);
          } else {
            // Если сохраняем существующие маркеры, обрабатываем каждый маркер
            let addedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;
            
            // Создаем Map с существующими маркерами для быстрого поиска
            const existingMarkersMap = new Map(
              markers.map(marker => [marker.id, marker])
            );
            
            // Обрабатываем каждый импортируемый маркер
            markersToImport.forEach(markerToImport => {
              // Проверяем, существует ли маркер с таким ID
              if (existingMarkersMap.has(markerToImport.id)) {
                // Если маркер существует, обновляем его
                updateMarkerById(markerToImport.id, markerToImport);
                updatedCount++;
              } else {
                // Если маркера нет, добавляем его
                addMarker(markerToImport);
                addedCount++;
              }
            });
            
            // Выводим статистику
            addToLog(t('markers.importStats', { 
              added: addedCount, 
              updated: updatedCount, 
              skipped: skippedCount 
            }));
          }
        } catch (error) {
          console.error('Ошибка при импорте маркеров:', error);
          addToLog(t('markers.importError') + ' ' + error.message);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }, [markers, preserveExisting, addMarker, updateMarkerById, t]);
  
  // Импорт маркеров из файла с заменой существующих
  const handleReplaceMarkers = useCallback(() => {
    if (window.confirm(t('markers.confirmReplace'))) {
      setPreserveExisting(false);
      handleImportMarkers();
    }
  }, [handleImportMarkers, t]);

  if (!isOpen) return null;

  return (
    <div className="import-export-overlay">
      <div className="import-export-container">
        <div className="import-export-header">
          <h2>{t('markers.importExport')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="import-export-content">
          <div className="import-export-actions">
            <div className="action-section">
              <h3>{t('markers.export')}</h3>
              <p>{t('markers.exportDescription')}</p>
              <button 
                className="btn btn-primary"
                onClick={handleExportMarkers}
              >
                {t('markers.exportAllMarkers')}
              </button>
            </div>
            
            <div className="action-section">
              <h3>{t('markers.import')}</h3>
              <p>{t('markers.importDescription')}</p>
              <div className="import-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setPreserveExisting(true);
                    handleImportMarkers();
                  }}
                >
                  {t('markers.importAndMerge')}
                </button>
                
                <button 
                  className="btn btn-danger"
                  onClick={handleReplaceMarkers}
                >
                  {t('markers.importAndReplace')}
                </button>
              </div>
            </div>
          </div>
          
          {log && (
            <div className="log-container">
              <h3>{t('markers.operationLog')}</h3>
              <pre className="log">{log}</pre>
            </div>
          )}
        </div>
        
        <div className="import-export-footer">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

MarkersImportExport.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default MarkersImportExport;