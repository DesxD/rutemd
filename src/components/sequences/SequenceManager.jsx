/**
 * Компонент для управления последовательностями маркеров
 * Объединяет функциональность импорта, экспорта и настройки последовательностей
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SequenceLoader from './SequenceLoader';
import SequenceExporter from './SequenceExporter';
import MarkersSequencer from '../markers/MarkersSequencer';
import "../../styles/sequences/SequenceManager.css"; // Создайте этот файл со стилями

function SequenceManager({ isOpen, onClose, currentCity, selectedRoute, routes }) {
  const { t } = useTranslation();
  const [showSequencer, setShowSequencer] = useState(false);

  // Обработчик закрытия настройщика последовательностей
  const handleCloseSequencer = () => {
    setShowSequencer(false);
  };

  if (!isOpen) return null;

  return (
    <div className="sequence-manager-overlay">
      <div className="sequence-manager-container">
        <div className="sequence-manager-header">
          <h2>{t('sequences.manageSequences')}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="sequence-manager-content">
          {!showSequencer ? (
            <>
              <div className="sequence-section">
                <h3>{t('sequences.loadSection')}</h3>
                <p>{t('sequences.loadDescription')}</p>
                <SequenceLoader 
                  currentCity={currentCity}
                  selectedRoute={selectedRoute}
                />
              </div>
              
              <div className="sequence-section">
                <h3>{t('sequences.exportSection')}</h3>
                <p>{t('sequences.exportDescription')}</p>
                <SequenceExporter 
                  currentCity={currentCity}
                  selectedRoute={selectedRoute}
                />
              </div>
              
              <div className="sequence-section">
                <h3>{t('sequences.configureSection')}</h3>
                <p>{t('sequences.configureDescription')}</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowSequencer(true)}
                  disabled={!selectedRoute}
                >
                  {t('sequences.openSequencer')}
                </button>
              </div>
              
              <div className="sequence-section">
                <h3>{t('sequences.infoSection')}</h3>
                <p>{t('sequences.infoDescription')}</p>
                <div className="sequence-info">
                  <p>
                    <strong>{t('sequences.currentCity')}:</strong> {currentCity || t('notSelected')}
                  </p>
                  <p>
                    <strong>{t('sequences.currentRoute')}:</strong> {selectedRoute 
                      ? `${t('route')} ${selectedRoute.number}` 
                      : t('notSelected')}
                  </p>
                  <p>
                    <strong>{t('sequences.filePath')}:</strong> {currentCity && selectedRoute 
                      ? `/data/sequences/${currentCity}/route-${selectedRoute.number}.json`
                      : t('notAvailable')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <MarkersSequencer 
              isOpen={true}
              onClose={handleCloseSequencer}
              selectedRoute={selectedRoute}
              routes={routes}
              currentCity={currentCity}
            />
          )}
        </div>
        
        <div className="sequence-manager-footer">
          {!showSequencer && (
            <button 
              className="btn-secondary"
              onClick={onClose}
            >
              {t('close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

SequenceManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentCity: PropTypes.string,
  selectedRoute: PropTypes.object,
  routes: PropTypes.array
};

SequenceManager.defaultProps = {
  routes: []
};

export default SequenceManager;