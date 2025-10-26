// assets/js/modules/navbar.js

/**
 * Módulo para la navegación principal y el menú móvil
 */

// Importaciones
import { allProducts } from '../main.js';
import { showToast } from './ui.js';

// Variables para el manejo del DOM
let mobileMenuPanel = null;
let mobileMenuOverlay = null;
let mobileMenuButton = null;
let categoriesDropdown = null;
let brandsDropdown = null;

/**
 * Inicializa la barra de navegación
 */
export function initializeNavbar() {
    // Obtener referencias DOM
    mobileMenuButton = document.getElementById('mobile-menu-toggle');
    mobileMenuPanel = document.querySelector('.mobile-menu-panel');
    mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    categoriesDropdown = document.getElementById('categories-dropdown');
    brandsDropdown = document.getElementById('brands-dropdown');
    
    // Inicializar componentes
    setupDarkMode();
    setupMobileMenu();
    populateDropdowns();
    updateResponsiveVisibility();
    
    // Configurar escuchadores de eventos
    window.addEventListener('resize', updateResponsiveVisibility);
    
    // Iniciar con el menú móvil cerrado
    closeMobileMenu();
}

/**
 * Configura el modo oscuro
 */
function setupDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;
    
    // Verificar preferencia guardada
    const darkModeEnabled = localStorage.getItem('J&SDarkMode') === 'true';
    
    // También comprobar la preferencia del sistema
    const prefersDarkMode = window.matchMedia && 
                           window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aplicar modo oscuro si está guardado o si el usuario prefiere modo oscuro
    if (darkModeEnabled || 
        (prefersDarkMode && localStorage.getItem('J&SDarkMode') === null)) {
        document.documentElement.classList.add('dark-mode');
        darkModeToggle.querySelector('.material-symbols-outlined').textContent = 'light_mode';
    }
    
    // Añadir evento de click
    darkModeToggle.addEventListener('click', () => {
        const isDarkMode = document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem('J&SDarkMode', isDarkMode);
        darkModeToggle.querySelector('.material-symbols-outlined').textContent = 
            isDarkMode ? 'light_mode' : 'dark_mode';
        
        if (typeof showToast === 'function') {
            showToast(isDarkMode ? 'Modo oscuro activado' : 'Modo claro activado');
        }
    });
}

/**
 * Configura la funcionalidad del menú móvil
 */
function setupMobileMenu() {
    if (!mobileMenuButton || !mobileMenuPanel || !mobileMenuOverlay) {
        console.error('Elementos del menú móvil no encontrados');
        return;
    }
    
    // Botón de abrir menú
    mobileMenuButton.addEventListener('click', openMobileMenu);
    
    // Overlay para cerrar menú al hacer clic fuera
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    
    // Botón de cerrar dentro del menú
    const closeButton = document.querySelector('.close-mobile-menu');
    if (closeButton) {
        closeButton.addEventListener('click', closeMobileMenu);
    }
    
    // Sincronizar campos de búsqueda
    const mobileSearchInput = document.querySelector('.mobile-search input');
    const mainSearchInput = document.getElementById('main-search-input');
    
    if (mobileSearchInput && mainSearchInput) {
        mobileSearchInput.addEventListener('input', function() {
            mainSearchInput.value = this.value;
            // Disparar evento para activar la búsqueda
            mainSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }
}

/**
 * Abre el menú móvil
 */
function openMobileMenu() {
    if (!mobileMenuPanel || !mobileMenuOverlay) return;
    
    mobileMenuPanel.classList.add('is-open');
    mobileMenuOverlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
}

/**
 * Cierra el menú móvil
 */
function closeMobileMenu() {
    if (!mobileMenuPanel || !mobileMenuOverlay) return;
    
    mobileMenuPanel.classList.remove('is-open');
    mobileMenuOverlay.classList.remove('is-visible');
    document.body.style.overflow = ''; // Restaurar scroll
}

/**
 * Actualiza la visibilidad según el tamaño de pantalla
 */
function updateResponsiveVisibility() {
    const isMobileView = window.innerWidth <= 992;
    const headerNav = document.querySelector('.header-nav');
    
    // En modo escritorio
    if (!isMobileView) {
        // Cerrar menú móvil si está abierto
        closeMobileMenu();
        
        // Mostrar navegación horizontal
        if (headerNav) headerNav.style.display = 'flex';
        
        // Ocultar botón de hamburguesa
        if (mobileMenuButton) mobileMenuButton.style.display = 'none';
    } 
    // En modo móvil
    else {
        // Ocultar navegación horizontal
        if (headerNav) headerNav.style.display = 'none';
        
        // Mostrar botón de hamburguesa
        if (mobileMenuButton) mobileMenuButton.style.display = 'flex';
    }
}

/**
 * Llena los menús desplegables con datos dinámicos
 */
function populateDropdowns() {
    if (!allProducts || allProducts.length === 0) {
        console.warn('No hay productos disponibles para llenar los menús desplegables');
        return;
    }
    
    populateCategoriesDropdown();
    populateBrandsDropdown();
    populateMobileCategories();
}

/**
 * Llena el menú desplegable de categorías
 */
function populateCategoriesDropdown() {
    if (!categoriesDropdown) return;
    
    try {
        // Obtener categorías únicas
        const categories = [...new Set(allProducts.map(p => p.category))];
        
        // Limpiar el dropdown
        categoriesDropdown.innerHTML = '';
        
        // Crear elementos de menú
        categories.forEach(category => {
            if (!category) return;
            
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `search-results.html?category=${encodeURIComponent(category)}`;
            a.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            li.appendChild(a);
            categoriesDropdown.appendChild(li);
        });
    } catch (error) {
        console.error('Error al poblar categorías:', error);
    }
}

/**
 * Llena el menú desplegable de marcas
 */
function populateBrandsDropdown() {
    if (!brandsDropdown) return;
    
    try {
        // Obtener marcas únicas
        const brands = [...new Set(allProducts.map(p => p.brand))]
            .filter(brand => brand && brand !== 'Sin Marca');
        
        // Ordenar alfabéticamente
        brands.sort();
        
        // Limpiar el dropdown
        brandsDropdown.innerHTML = '';
        
        // Crear elementos de menú
        brands.forEach(brand => {
            if (!brand) return;
            
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `search-results.html?brand=${encodeURIComponent(brand)}`;
            a.textContent = brand;
            li.appendChild(a);
            brandsDropdown.appendChild(li);
        });
    } catch (error) {
        console.error('Error al poblar marcas:', error);
    }
}

/**
 * Llena el menú móvil con las categorías
 */
function populateMobileCategories() {
    const mobileCategories = document.getElementById('mobile-categories');
    if (!mobileCategories) return;
    
    try {
        // Limpiar el contenedor
        mobileCategories.innerHTML = '';
        
        // Si tenemos categorías en el dropdown, las usamos
        if (categoriesDropdown && categoriesDropdown.querySelectorAll('li a').length > 0) {
            const links = categoriesDropdown.querySelectorAll('li a');
            links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.href;
                a.className = 'nav-link';
                a.textContent = link.textContent;
                mobileCategories.appendChild(a);
            });
        } 
        // Si no, obtenemos las categorías directamente
        else if (allProducts && allProducts.length > 0) {
            const categories = [...new Set(allProducts.map(p => p.category))];
            categories.forEach(category => {
                if (!category) return;
                
                const a = document.createElement('a');
                a.href = `search-results.html?category=${encodeURIComponent(category)}`;
                a.className = 'nav-link';
                a.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                mobileCategories.appendChild(a);
            });
        }
    } catch (error) {
        console.error('Error al poblar categorías móviles:', error);
    }
}
