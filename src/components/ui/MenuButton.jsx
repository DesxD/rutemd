/**
 * Компонент кнопки меню (гамбургер/крестик)
 * Используется для открытия и закрытия боковой панели на мобильных устройствах
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import '../../styles/ui/MenuButton.css';

function MenuButton({ isOpen, onClick }) {
  const { t } = useTranslation();
  
  return (
    <button 
      className={`menu-button ${isOpen ? 'open' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? t('sidebar.closeMenu') : t('sidebar.openMenu')}
    >
      <div className="menu-button-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
  );
}

MenuButton.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

export default MenuButton;