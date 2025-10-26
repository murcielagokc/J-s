// assets/js/main.js
import { GOOGLE_SHEET_URLS, CACHE_DURATION_MINUTES } from './modules/config.js';
import { loadAllData, processData } from './modules/api.js';
import { saveProductsToCache, loadProductsFromCache } from './modules/cache.js';
import * as ui from './modules/ui.js';
import * as cartLogic from './modules/cart.js';
import { initializeNavbar } from './modules/navbar.js';

// ESTADO GLOBAL DE LA APLICACIÓN
export let allProducts = [];
export let cart = JSON.parse(localStorage.getItem('J&SCart')) || [];

// HACEMOS GLOBALES LAS FUNCIONES LLAMADAS DESDE EL HTML (onclick)
window.handlePurchase = cartLogic.handlePurchase;
window.changeMainImage = ui.changeMainImage;
window.updateCartQuantity = cartLogic.updateCartQuantity;
window.removeFromCart = cartLogic.removeFromCart;

// PUNTO DE ENTRADA PRINCIPAL
document.addEventListener('DOMContentLoaded', async () => {
    ui.showLoadingState();

    // 1. Intentamos cargar los productos desde el caché
    let cachedProducts = loadProductsFromCache(CACHE_DURATION_MINUTES);

    if (cachedProducts) {
        allProducts = cachedProducts;
    } else {
        try {
            // 2. Si no hay caché, cargamos desde la red
            const data = await loadAllData(GOOGLE_SHEET_URLS);
            allProducts = processData(data);
            // 3. Y guardamos los nuevos datos en el caché para la próxima vez
            saveProductsToCache(allProducts);
        } catch (error) {
            console.error("FALLO CRÍTICO:", error);
            ui.showErrorState(error.message);
            return; // Detenemos la ejecución si hay un error
        }
    }
    initializeApp();
});

// FUNCIÓN DE INICIALIZACIÓN
function initializeApp() {
    // Inicializar la navbar mejorada
    initializeNavbar();
    
    // Inicializar páginas específicas
    if (document.getElementById('featured-products-grid')) ui.showFeaturedProducts();
    if (document.getElementById('results-grid')) ui.initializeSearchResultsPage();
    if (document.getElementById('product-detail-container')) ui.displayProductDetails();
    if (document.getElementById('cart-items-container')) ui.renderCartPage();

    updateCartCount();
    ui.initializeSearchBars();
    ui.initializeMobileMenu();
    ui.initializeCartPanel();
}

// FUNCIONES DE MANEJO DE ESTADO
export function saveCart() {
    localStorage.setItem('J&SCart', JSON.stringify(cart));
}

export function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = total;
        el.style.display = total > 0 ? 'flex' : 'none';
    });
}