/**
 * =================================================================
 * ARCHIVO: script.js (Versión con Lógica Relacional)
 * =================================================================
 * ÍNDICE:
 * 1. CONFIGURACIÓN Y ESTADO GLOBAL
 * 2. LÓGICA DE CARGA Y PROCESAMIENTO DE DATOS
 * 3. FUNCIONES DE RENDERIZADO (Creación de HTML)
 * 4. LÓGICA DE LA APLICACIÓN (Manejo de eventos)
 * 5. INICIALIZACIÓN (Punto de entrada principal)
 * =================================================================
 */

// =================================================================
// 1. CONFIGURACIÓN Y ESTADO GLOBAL
// =================================================================

const GOOGLE_SHEET_URLS = {
    products: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=0&single=true&output=tsv', // <-- PEGA TU URL DE PRODUCTOS
    types: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=868992117&single=true&output=tsv',         // <-- PEGA TU URL DE TIPOS
    specs: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=63815658&single=true&output=tsv'// <-- PEGA TU URL DE ESPECIFICACIONES
};

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('techPartsCart')) || [];

// =================================================================
// 2. GESTIÓN DE DATOS (API & Procesamiento)
// =================================================================
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error de red al cargar: ${url}`);
    const tsvText = await response.text();
    return tsvText.trim().split('\n').slice(1).map(row => row.split('\t'));
}

function processData(productsData, typesData, specsData) {
    const typesMap = new Map(typesData.map(row => [row[0].trim(), row[1].trim()]));
    const specsMap = new Map();
    specsData.forEach(row => {
        const productId = row[0].trim();
        if (productId) {
            const spec = { name: row[1].trim(), value: row[2].trim() };
            if (!specsMap.has(productId)) specsMap.set(productId, []);
            specsMap.get(productId).push(spec);
        }
    });
    return productsData.map(pData => {
        const productId = pData[0].trim();
        return {
            id: productId,
            name: pData[1].trim(),
            description: pData[2].trim(),
            price: parseFloat(pData[3]) || 0.0,
            imageUrl: pData[4].trim(),
            category: typesMap.get(pData[5].trim()) || 'General',
            specifications: specsMap.get(productId) || []
        };
    });
}

// =================================================================
// 3. GESTIÓN DEL CARRITO (localStorage)
// =================================================================
function saveCart() {
    localStorage.setItem('techPartsCart', JSON.stringify(cart));
}

function addToCart(productId) {
    const productInCart = cart.find(item => item.id === productId);
    if (productInCart) {
        productInCart.quantity++;
    } else {
        const productToAdd = allProducts.find(p => p.id === productId);
        if (productToAdd) {
            cart.push({ ...productToAdd, quantity: 1 });
        }
    }
    saveCart();
    updateCartCount();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartPage(); // Vuelve a renderizar toda la página del carrito
}
function updateCartQuantity(productId, newQuantity) {
    const productInCart = cart.find(item => item.id === productId);
    if (productInCart) {
        productInCart.quantity = Math.max(1, newQuantity); // Asegura que la cantidad no sea menor a 1
    }
    saveCart();
    renderCartPage();
}
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 10.00; // O puedes hacerlo más complejo
    const total = subtotal + shipping;

    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;
}
// =================================================================
// 4. RENDERIZADO (Creación de HTML)
// =================================================================
function createProductCard(product) {
    return `
        <div class="product-card" id="card-${product.id}">
            <a href="product-details.html?id=${product.id}" class="product-card-link">
                <div class="product-image" style="background-image: url('${product.imageUrl}');"></div>
                <div class="product-card-info">
                    <h3>${product.name}</h3>
                    <p>${product.specifications.length > 0 ? product.specifications[0].value : product.category}</p>
                </div>
            </a>
            <div class="product-card-bottom">
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="btn-primary add-to-cart-small-btn" onclick="handlePurchase('${product.id}')">Añadir</button>
            </div>
        </div>
    `;
}

function createProductDetailView(product) {
    // ... (código de la función sin cambios)
    const specsHTML = product.specifications.map(spec => `
        <div class="spec-row"><dt class="spec-name">${spec.name}</dt><dd class="spec-value">${spec.value}</dd></div>
    `).join('');
    const keyFeaturesHTML = product.specifications.slice(0, 3).map(spec => `
        <li><strong>${spec.name}:</strong> ${spec.value}</li>
    `).join('');
    return `
        <div class="product-detail-layout">
            <div class="product-detail-image"><img src="${product.imageUrl}" alt="${product.name}"></div>
            <div class="product-detail-info">
                <span class="category-tag">${product.category}</span>
                <h1>${product.name}</h1>
                <p class="price">$${product.price.toFixed(2)}</p>
                <div class="description"><p>${product.description}</p><ul class="key-features">${keyFeaturesHTML}</ul></div>
                <button class="btn-primary add-to-cart-btn" onclick="handlePurchase('${product.id}')">Añadir al Carrito</button>
                <div class="specs-table"><h3>Especificaciones Técnicas</h3><dl>${specsHTML}</dl></div>
            </div>
        </div>
    `;
}

function displayCartItems() {
    const cartBody = document.getElementById('cart-items-body');
    if (!cartBody) return;
    if (cart.length === 0) {
        cartBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Tu carrito está vacío.</td></tr>';
        return;
    }
    cartBody.innerHTML = cart.map(item => `
        <tr>
            <td><div class="cart-item-info"><img src="${item.imageUrl}" alt="${item.name}"><div><h4>${item.name}</h4><p>${item.category}</p></div></div></td>
            <td>$${item.price.toFixed(2)}</td>
            <td><div class="quantity-selector"><input type="number" value="${item.quantity}" min="1"></div></td>
            <td class="total-col">$${(item.price * item.quantity).toFixed(2)}</td>
            <td><button class="remove-item-btn"><span class="material-symbols-outlined">delete</span></button></td>
        </tr>
    `).join('');
}
function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return; // Solo se ejecuta en la página del carrito

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Tu carrito está vacío.</p>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <article class="cart-item-card">
            <div class="cart-item-image">
                <img src="${item.imageUrl}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>${item.category}</p>
                <p class="stock-status">En Stock</p>
            </div>
            <div class="cart-item-actions">
                <p class="price">$${(item.price * item.quantity).toFixed(2)}</p>
                <div class="quantity-selector">
                    <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </article>
    `).join('');
}

// Nueva función que renderiza toda la página del carrito
function renderCartPage() {
    renderCartItems();
    updateCartSummary();
}

// =================================================================
// 5. LÓGICA DE LA APLICACIÓN
// =================================================================
function handlePurchase(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        addToCart(productId);
        alert(`${product.name} ha sido añadido al carrito.`);
    }
}

function showFeaturedProducts() {
    const featured = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 4);
    const container = document.getElementById('featured-products-grid');
    if (container) container.innerHTML = featured.map(createProductCard).join('');
}

function handleSearch(event, resultsContainerId) {
    // ... (código de la función sin cambios)
    const searchTerm = event.target.value.toLowerCase();
    const resultsContainer = document.getElementById(resultsContainerId);
    if (!resultsContainer) return;
    if (searchTerm.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }
    const matchedProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm)).slice(0, 5);
    if (matchedProducts.length > 0) {
        resultsContainer.innerHTML = matchedProducts.map(product => `
            <a href="product-details.html?id=${product.id}" class="search-result-item">
                <img src="${product.imageUrl}" alt="${product.name}"><div class="search-result-item__info"><h4>${product.name}</h4><p>$${product.price.toFixed(2)}</p></div>
            </a>
        `).join('');
    } else {
        resultsContainer.innerHTML = `<p style="padding: 1rem; text-align: center;">No se encontraron productos.</p>`;
    }
    resultsContainer.style.display = 'block';
}

// =================================================================
// 6. INICIALIZACIÓN
// =================================================================
async function main() {
    try {
        const [productsData, typesData, specsData] = await Promise.all([
            fetchData(GOOGLE_SHEET_URLS.products),
            fetchData(GOOGLE_SHEET_URLS.types),
            fetchData(GOOGLE_SHEET_URLS.specs)
        ]);
        allProducts = processData(productsData, typesData, specsData);
        initializeApp();
    } catch (error) {
        console.error("FALLO CRÍTICO al cargar datos:", error);
        document.body.innerHTML = `<p style="color: red; padding: 2rem; text-align: center;"><b>Error:</b> No se pudieron cargar los datos de la tienda.</p>`;
    }
}

function initializeApp() {
    // Lógica que se ejecuta en TODAS las páginas
    const mainSearchInput = document.getElementById('main-search-input');
    const innerSearchInput = document.getElementById('inner-search-input');
    if (mainSearchInput) mainSearchInput.addEventListener('input', (e) => handleSearch(e, 'main-search-results'));
    if (innerSearchInput) innerSearchInput.addEventListener('input', (e) => handleSearch(e, 'inner-search-results'));
    
    updateCartCount(); // <-- Actualiza el ícono del carrito

    // Lógica específica por página
    if (document.getElementById('featured-products-grid')) {
        showFeaturedProducts();
    }
    if (document.getElementById('product-detail-container')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = allProducts.find(p => p.id === productId);
        const container = document.getElementById('product-detail-container');
        if (product) container.innerHTML = createProductDetailView(product);
        else container.innerHTML = `<p style="text-align: center; padding: 4rem;">Producto no encontrado.</p>`;
    }
    if (document.getElementById('cart-items-container')) {
        renderCartPage();
    }
    updateCartCount();
}

// Listener para ocultar los resultados del buscador si se hace clic fuera
document.addEventListener('click', function(event) {
    const allSearchResults = document.querySelectorAll('.search-results-container');
    const allSearchBars = document.querySelectorAll('.center-search-bar, .header-search-bar');
    let clickedInsideSearch = false;
    allSearchBars.forEach(bar => {
        if (bar.contains(event.target)) clickedInsideSearch = true;
    });
    if (!clickedInsideSearch) {
        allSearchResults.forEach(results => results.style.display = 'none');
    }
});

document.addEventListener('DOMContentLoaded', main);