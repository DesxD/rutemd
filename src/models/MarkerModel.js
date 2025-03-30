/**
 * Модель данных маркера для маршрутов
 * Определяет структуру объекта маркера и методы для работы с ним
 */

// Генерация уникального ID для маркера
export const generateMarkerId = () => `marker_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

/**
 * Создание нового маркера с заданными свойствами
 * @param {Object} data - Данные маркера
 * @returns {Object} - Объект маркера
 */
export const createMarker = (data = {}) => {
  return {
    id: data.id || generateMarkerId(),
    title: data.title || '',
    speechText: data.speechText || '',
    imageUrl: data.imageUrl || '',
    position: data.position || { lat: 0, lng: 0 },
    routeIds: data.routeIds || [],
    sequence: data.sequence || 0, // Порядок озвучивания в маршруте
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Обновление существующего маркера
 * @param {Object} marker - Существующий маркер
 * @param {Object} updates - Обновления для маркера
 * @returns {Object} - Обновленный маркер
 */
export const updateMarker = (marker, updates) => {
  return {
    ...marker,
    ...updates,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Проверка принадлежности маркера к маршруту
 * @param {Object} marker - Маркер для проверки
 * @param {string} routeId - ID маршрута
 * @returns {boolean} - true, если маркер принадлежит маршруту
 */
export const isMarkerInRoute = (marker, routeId) => {
  return marker.routeIds.includes(routeId);
};

/**
 * Фильтрация массива маркеров по ID маршрута
 * @param {Array} markers - Массив маркеров
 * @param {string} routeId - ID маршрута
 * @returns {Array} - Массив маркеров, принадлежащих маршруту
 */
export const filterMarkersByRoute = (markers, routeId) => {
  return markers.filter(marker => isMarkerInRoute(marker, routeId));
};

/**
 * Сортировка маркеров по последовательности в маршруте
 * @param {Array} markers - Массив маркеров
 * @returns {Array} - Отсортированный массив маркеров
 */
export const sortMarkersBySequence = (markers) => {
  return [...markers].sort((a, b) => a.sequence - b.sequence);
};