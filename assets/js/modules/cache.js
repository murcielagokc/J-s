// assets/js/modules/cache.js

const CACHE_KEY = 'j&s-products-cache';

/**
 * Guarda los productos y la fecha actual en el caché del navegador.
 * @param {Array<object>} products - La lista de productos a guardar.
 */
export function saveProductsToCache(products) {
    const cacheData = {
        timestamp: new Date().getTime(), // Guarda la hora actual
        products: products
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

/**
 * Carga los productos desde el caché si aún son válidos.
 * @param {number} cacheDurationInMinutes - Cuántos minutos es válido el caché.
 * @returns {Array<object>|null} La lista de productos o null si el caché no es válido.
 */
export function loadProductsFromCache(cacheDurationInMinutes) {
    const cachedDataJSON = localStorage.getItem(CACHE_KEY);
    if (!cachedDataJSON) {
        return null; // No hay nada en el caché
    }

    const cachedData = JSON.parse(cachedDataJSON);
    const now = new Date().getTime();
    const cacheAgeInMinutes = (now - cachedData.timestamp) / 1000 / 60;

    if (cacheAgeInMinutes > cacheDurationInMinutes) {
        localStorage.removeItem(CACHE_KEY); // El caché es muy viejo, lo borramos
        return null;
    }

    return cachedData.products; // El caché es válido, devolvemos los productos
}