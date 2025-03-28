/**
 * Компонент для выбора маршрута из выпадающего списка
 * Отображает список доступных маршрутов для выбранного города
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function RouteSelector({ routes, selectedRoute, onRouteSelect }) {
  const { t } = useTranslation();
  
  return (
    <select 
      onChange={(e) => onRouteSelect(e.target.value)} 
      value={selectedRoute?.id || ''}
    >
      <option value="">{t('selectRoute')}</option>
      {routes.map(route => (
        <option key={route.id} value={route.id}>
          {t('route')} {route.number}
        </option>
      ))}
    </select>
  );
}

RouteSelector.propTypes = {
  routes: PropTypes.array.isRequired,
  selectedRoute: PropTypes.object,
  onRouteSelect: PropTypes.func.isRequired
};

export default RouteSelector;