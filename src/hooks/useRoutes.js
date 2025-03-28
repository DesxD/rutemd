/**
 * Хук для работы с маршрутами
 * Управляет выбором маршрута и получением данных маршрутов для выбранного города
 */

import { useState, useEffect } from 'react';
import edinetRoutes from '../data/edinet.json';

// Словарь с данными маршрутов для каждого города
const citiesData = {
  edinet: edinetRoutes,
  // В будущем сюда будут добавлены другие города
};

/**
 * Хук для управления маршрутами
 * @param {string} initialCity - Начальный выбранный город
 * @returns {Object} - Объект с данными маршрутов и методами для работы с ними
 */
export default function useRoutes(initialCity = 'edinet') {
  const [currentCity, setCurrentCity] = useState(initialCity);
  const [routes, setRoutes] = useState(citiesData[initialCity] || []);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Обновление маршрутов при смене города
  useEffect(() => {
    setRoutes(citiesData[currentCity] || []);
    setSelectedRoute(null);
  }, [currentCity]);

  // Выбор маршрута по ID
  const selectRoute = (routeId) => {
    if (!routeId) {
      setSelectedRoute(null);
      return;
    }
    
    const route = routes.find(r => r.id === routeId);
    setSelectedRoute(route || null);
  };

  return {
    routes,
    selectedRoute,
    currentCity,
    setCurrentCity,
    selectRoute
  };
}