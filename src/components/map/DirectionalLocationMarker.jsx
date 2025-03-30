/**
 * Компонент маркера местоположения с уменьшенной SVG-стрелкой направления
 * Продакшн-версия для использования в приложении
 */

import { Marker, Circle, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import '../../styles/map/DirectionalLocationMarker.css';

function DirectionalLocationMarker({ position, followUser }) {
  const map = useMap();
  
  // Центрируем карту на пользователе, если включен режим следования
  useEffect(() => {
    if (position && followUser) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [position, followUser, map]);
  
  // Создаем пользовательскую иконку с SVG индикатором направления
  const directionIcon = useMemo(() => {
    if (!position) return null;
    
    const hasDirection = position.heading !== null && position.heading !== undefined;
    // Определяем, двигается ли пользователь (если есть скорость)
    const isMoving = position.speed && position.speed > 0.5; // скорость > 0.5 м/с
    
    // Применяем класс пульсации при низкой скорости
    const pulsingClass = hasDirection && position.speed && position.speed < 2 ? 'pulsing' : '';
    
    // Стиль вращения, если есть данные о направлении
    const rotationStyle = hasDirection 
      ? `transform: rotate(${position.heading}deg); transform-origin: center center;`
      : '';
    
    // Уменьшенная SVG-стрелка направления
    const svgArrow = hasDirection 
      ? `
        <svg width="30" height="30" viewBox="0 0 309 344" fill="none" xmlns="http://www.w3.org/2000/svg" class="direction-svg ${pulsingClass}" style="${rotationStyle}">
          <path d="M159 7.00002C155.4 -4.19998 152.167 2.33335 151 7.00002C103.5 109.333 7.09999 317.2 1.49999 330C-1.30001 342.8 10.3333 343.667 16.5 342.5L149 260.5H161C200.667 285 282.8 335.7 294 342.5C306.8 346.5 308.667 335.833 308 330C260.333 226.833 163.8 17.8 159 7.00002Z" fill="#ff0b34" stroke="white" stroke-width="2"/>
        </svg>
      `
      : '';
    
    return divIcon({
      className: 'user-location-icon-container',
      html: `
        <div class="user-location-dot"></div>
        ${svgArrow}
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, [position]);
  
  if (!position) {
    return null;
  }

  return (
    <>
      {/* Маркер местоположения пользователя с индикатором направления */}
      <Marker 
        position={[position.latitude, position.longitude]} 
        icon={directionIcon}
        zIndexOffset={1000}
      />
      
      {/* Круг, показывающий точность определения местоположения */}
      {position.accuracy && (
        <Circle 
          center={[position.latitude, position.longitude]}
          radius={position.accuracy}
          pathOptions={{ 
            color: '#4285F4', 
            fillColor: '#4285F4', 
            fillOpacity: 0.15 
          }}
        />
      )}
    </>
  );
}

DirectionalLocationMarker.propTypes = {
  position: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    accuracy: PropTypes.number,
    heading: PropTypes.number,
    speed: PropTypes.number,
    timestamp: PropTypes.number
  }),
  followUser: PropTypes.bool
};

DirectionalLocationMarker.defaultProps = {
  followUser: false
};

export default DirectionalLocationMarker;