/**
 * Компонент для выбора города из выпадающего списка
 * Отображает список доступных городов
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function CitySelector({ currentCity, onCityChange }) {
  const { t } = useTranslation();
  
  const cities = [
    { id: 'edinet', name: t('cities.edinet') },
    { id: 'balti', name: t('cities.balti') },
    { id: 'chisinau', name: t('cities.chisinau') },
    { id: 'soroca', name: t('cities.soroca') }
  ];

  return (
    <select 
      onChange={(e) => onCityChange(e.target.value)} 
      value={currentCity}
    >
      {cities.map(city => (
        <option key={city.id} value={city.id}>
          {city.name}
        </option>
      ))}
    </select>
  );
}

CitySelector.propTypes = {
  currentCity: PropTypes.string.isRequired,
  onCityChange: PropTypes.func.isRequired
};

export default CitySelector;