/**
 * Главный компонент приложения
 * Управляет состоянием приложения и объединяет все компоненты
 * Добавлены провайдеры для маркеров и аудио
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import MapComponent from './components/map/MapComponent';
import Sidebar from './components/sidebar/Sidebar';
import MenuButton from './components/ui/MenuButton';
import useRoutes from './hooks/useRoutes';
import { MarkersProvider } from './contexts/MarkersContext.jsx';
import { AudioProvider } from './contexts/AudioContext.jsx';

function App() {
  const { t, i18n } = useTranslation();
  // На больших экранах сайдбар всегда открыт, на мобильных - зависит от состояния
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  
  // Состояние режима размещения маркеров
  const [isMarkerPlacementMode, setIsMarkerPlacementMode] = useState(false);

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

  // Обработчик переключения режима размещения маркеров
  const toggleMarkerPlacement = (value) => {
    // Если передано значение, устанавливаем его, иначе переключаем
    if (typeof value === 'boolean') {
      setIsMarkerPlacementMode(value);
    } else {
      setIsMarkerPlacementMode(!isMarkerPlacementMode);
    }
  };

  return (
    <MarkersProvider>
      <AudioProvider>
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
            onToggleMarkerPlacement={toggleMarkerPlacement}
          />
          
          <MapComponent 
            currentCity={currentCity}
            routes={routes}
            selectedRoute={selectedRoute}
            onRouteSelect={selectRoute}
            showAllRoutes={showAllRoutes}
            isMarkerPlacementMode={isMarkerPlacementMode}
            onToggleMarkerPlacement={toggleMarkerPlacement}
          />
        </div>
      </AudioProvider>
    </MarkersProvider>
  );
}

export default App;