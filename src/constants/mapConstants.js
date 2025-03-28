/**
 * Константы для работы с картой и маршрутами
 * Содержит координаты центров городов, цвета для маршрутов и прочие константы
 */

// Координаты центров городов
export const CITY_CENTERS = {
  edinet: { center: [48.1724, 27.3030], zoom: 14 },
  balti: { center: [47.7632, 27.9285], zoom: 14 },
  chisinau: { center: [47.0105, 28.8638], zoom: 13 },
  soroca: { center: [48.1569, 28.2853], zoom: 14 }
};

// Цвета для маршрутов
export const ROUTE_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', '#33FFF6',
  '#FF8C33', '#33A2FF', '#9933FF', '#FF3367', '#33FFD1', '#FF33D4'
];

// Настройки для выбранного маршрута
export const SELECTED_ROUTE_STYLE = {
  weight: 7,
  opacity: 0.9
};

// Настройки для невыбранного маршрута
export const DEFAULT_ROUTE_STYLE = {
  weight: 4,
  opacity: 0.6
};