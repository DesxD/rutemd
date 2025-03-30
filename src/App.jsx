/**
 * Главный компонент приложения
 * Управляет состоянием приложения и объединяет все компоненты
 * Добавлен провайдер маркеров для поддержки функциональности маркеров
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import MapComponent from './components/map/MapComponent';
import Sidebar from './components/sidebar/Sidebar';
import MenuButton from './components/ui/MenuButton';
import useRoutes from './hooks/useRoutes';
import { MarkersProvider } from './contexts/MarkersContext.jsx';

function App() {
  const { t, i18n } = useTranslation();
  // На больших экранах сайдбар всегда открыт, на мобильных - зависит от состояния
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  
  const { 
    routes, 
    selectedRoute, 
    currentCity, 
    setCurrentCity, 
    selectRoute 
  } = useRoutes('edinet');

  // Обновление заголовка страницы при смене языка
  useEffect(() => {
    document.title = t('appTitle');
  }, [t, i18n.language]);

  // Обработчик переключения состояния сайдбара (только для мобильных)
  const toggleSidebar = () => {
    // Переключаем состояние только на мобильных
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Обработчик переключения режима отображения маршрутов
  const toggleShowAllRoutes = () => {
    setShowAllRoutes(!showAllRoutes);
  };

  return (
    <MarkersProvider>
      <div className="app">
        {/* Кнопка-гамбургер для мобильных устройств */}
        <MenuButton 
          isOpen={isSidebarOpen}
          onClick={toggleSidebar}
        />
        
        <Sidebar 
          currentCity={currentCity}
          onCityChange={setCurrentCity}
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={selectRoute}
          isOpen={isSidebarOpen}
          showAllRoutes={showAllRoutes}
          onToggleShowAllRoutes={toggleShowAllRoutes}
        />
        
        <MapComponent 
          currentCity={currentCity}
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={selectRoute}
          showAllRoutes={showAllRoutes}
        />
      </div>
    </MarkersProvider>
  );
}

export default App;