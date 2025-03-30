/**
 * Контекст для управления маркерами
 * Обеспечивает доступ к маркерам из любого компонента
 */

import { createContext, useContext } from 'react';
import useMarkers from '../hooks/useMarkers';

// Создаем контекст маркеров
const MarkersContext = createContext(null);

/**
 * Провайдер контекста маркеров
 * @param {Object} props - Свойства компонента
 * @returns {JSX.Element} - JSX элемент
 */
export const MarkersProvider = ({ children }) => {
  const markersService = useMarkers();
  
  return (
    <MarkersContext.Provider value={markersService}>
      {children}
    </MarkersContext.Provider>
  );
};

/**
 * Хук для доступа к контексту маркеров
 * @returns {Object} - Объект с методами для работы с маркерами
 */
export const useMarkersContext = () => {
  const context = useContext(MarkersContext);
  if (!context) {
    throw new Error('useMarkersContext должен использоваться внутри MarkersProvider');
  }
  return context;
};