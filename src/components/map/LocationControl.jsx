/**
 * Компонент для управления геолокацией
 * Содержит кнопки для включения/выключения геолокации и следования за пользователем
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import '../../styles/map/LocationControl.css';

function LocationControl({ 
  onToggleLocation, 
  isLocationActive, 
  onToggleFollow, 
  isFollowActive 
}) {
  const { t } = useTranslation();

  return (
    <div className="location-controls">
      <button 
        className={`control-button location-button ${isLocationActive ? 'active' : ''}`}
        onClick={onToggleLocation}
        title={t('toggleLocation')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
      </button>

      <button 
        className={`control-button follow-button ${isFollowActive ? 'active' : ''}`}
        onClick={onToggleFollow}
        disabled={!isLocationActive}
        title={t('followMe')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </button>
    </div>
  );
}

LocationControl.propTypes = {
  onToggleLocation: PropTypes.func.isRequired,
  isLocationActive: PropTypes.bool.isRequired,
  onToggleFollow: PropTypes.func.isRequired,
  isFollowActive: PropTypes.bool.isRequired
};

export default LocationControl;