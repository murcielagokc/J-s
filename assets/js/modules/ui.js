// assets/js/modules/ui.js
import { CURRENCY_SYMBOL, PRODUCTS_PER_PAGE } from './config.js';
import { allProducts, cart } from '../main.js';
import { generateWhatsAppMessageAndRedirect } from './cart.js';

let currentFilteredProducts = [];
let productsVisibleCount = PRODUCTS_PER_PAGE;

// --- RENDERIZADO DE HTML ---
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check_circle' : 'error';
    
    toast.innerHTML = `
        <span class="material-symbols-outlined icon">${icon}</span>
        <p>${message}</p>
    `;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Pequeño delay para activar la transición

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000); // La notificación desaparece después de 4 segundos
}
export function renderPrice(product) {
    if (product.salePrice && product.salePrice < product.price) {
        return `<span class="price-sale">${CURRENCY_SYMBOL}${product.salePrice.toFixed(2)}</span><span class="price-original">${CURRENCY_SYMBOL}${product.price.toFixed(2)}</span>`;
    }
    return `<span class="price">${CURRENCY_SYMBOL}${product.price.toFixed(2)}</span>`;
}

export function renderProductCard(product) {
    return `<div class="product-card">
        <a href="product-details.html?id=${product.id}" class="product-card-link">
            <div class="product-image" style="background-image: url('${product.imageUrl}');"></div>
            <div class="product-card-info">
                <p class="product-card-brand">${product.brand}</p>
                <h3>${product.name}</h3>
            </div>
        </a>
        <div class="product-card-bottom">
            <div class="product-card-price">${renderPrice(product)}</div>
            <button class="btn-primary add-to-cart-small-btn" onclick="handlePurchase('${product.id}')">Añadir</button>
        </div>
    </div>`;
}

export function renderProductDetailView(product) {
    const gallery = product.images.map((img, i) => `<img src="${img}" alt="Thumbnail ${i + 1}" class="thumbnail-img ${i === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">`).join('');
    const variants = product.groupId ? allProducts.filter(p => p.groupId === product.groupId) : [];
    const variantsHTML = variants.map(v => `<a href="product-details.html?id=${v.id}" class="variant-link ${v.id === product.id ? 'active' : ''}">${v.name.replace(product.name.split(' - ')[0], '')}</a>`).join('');
    const specsHTML = product.specifications.map(spec => `<div class="spec-row"><dt class="spec-name">${spec.name}</dt><dd class="spec-value">${spec.value}</dd></div>`).join('');
    
    // Generamos el HTML principal
    const mainContentHTML = `<div class="product-detail-layout">
        <div class="product-detail-gallery">
            <div class="main-image-container"><img id="main-product-image" src="${product.imageUrl}" alt="${product.name}"></div>
            <div class="thumbnail-container">${gallery}</div>
        </div>
        <div class="product-detail-info">
            <p class="brand-name">${product.brand}</p>
            <h1>${product.name}</h1>
            <div class="price-container">${renderPrice(product)}</div>
            <p class="stock-status">Disponible</p>
            <p class="description">${product.description}</p>
            ${variants.length > 1 ? `<div class="variants-container"><h4>Otras Versiones:</h4><div class="variant-links-wrapper">${variantsHTML}</div></div>` : ''}
            <button class="btn-primary add-to-cart-btn" onclick="handlePurchase('${product.id}')">Añadir al Carrito</button>
            <div class="specs-table"><h3>Especificaciones Técnicas</h3><dl>${specsHTML}</dl></div>
        </div>
    </div>`;

    // Asignamos el HTML al contenedor principal
    const container = document.getElementById('product-detail-container');
    if(container) container.innerHTML = mainContentHTML;
    
    // --- NUEVA LÓGICA PARA PRODUCTOS RELACIONADOS ---
    renderRelatedProducts(product);
}
function renderRelatedProducts(currentProduct) {
    const container = document.getElementById('related-products-section');
    if (!container) return;

    // Filtramos productos de la misma categoría, excluyendo el actual
    const related = allProducts.filter(p => 
        p.category === currentProduct.category && p.id !== currentProduct.id
    );

    // Si no hay relacionados, ocultamos la sección
    if (related.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    // Mezclamos y tomamos los primeros 4
    const shuffled = related.sort(() => 0.5 - Math.random()).slice(0, 4);

    container.innerHTML = `
        <h2>Quizás también te interese</h2>
        <div class="product-grid">
            ${shuffled.map(renderProductCard).join('')}
        </div>
    `;
    container.style.display = 'block';
}

export function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Tu carrito está vacío.</p>';
        return;
    }
    container.innerHTML = cart.map(item => `<article class="cart-item-card">
        <div class="cart-item-image"><img src="${item.imageUrl}" alt="${item.name}"></div>
        <div class="cart-item-details">
            <h3>${item.name}</h3><p>${item.category}</p><p class="stock-status">En Stock</p>
        </div>
        <div class="cart-item-actions">
            <p class="price">${CURRENCY_SYMBOL}${(item.price * item.quantity).toFixed(2)}</p>
            <div class="quantity-selector">
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart('${item.id}')"><span class="material-symbols-outlined">delete</span></button>
        </div>
    </article>`).join('');
}

export function renderCartPanel() {
    const body = document.getElementById('cart-panel-body');
    const subtotalEl = document.getElementById('cart-panel-subtotal');
    if (!body || !subtotalEl) return;
    if (cart.length === 0) {
        body.innerHTML = '<p>Tu carrito está vacío.</p>';
        subtotalEl.textContent = `${CURRENCY_SYMBOL}0.00`;
        return;
    }
    const subtotal = cart.reduce((sum, item) => sum + ((item.salePrice || item.price) * item.quantity), 0);
    subtotalEl.textContent = `${CURRENCY_SYMBOL}${subtotal.toFixed(2)}`;
    body.innerHTML = cart.map(item => `<div class="cart-panel-item">
        <img src="${item.imageUrl}" alt="${item.name}">
        <div class="cart-panel-item-details">
            <h4>${item.name}</h4><p>${item.quantity} x ${CURRENCY_SYMBOL}${item.price.toFixed(2)}</p>
        </div>
        <p class="price">${CURRENCY_SYMBOL}${(item.price * item.quantity).toFixed(2)}</p>
    </div>`).join('');
}


// --- LÓGICA DE PÁGINAS ---
export function showFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (container) {
        const featured = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 8);
        container.innerHTML = featured.map(renderProductCard).join('');
    }
}

export function displayProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const product = allProducts.find(p => p.id === productId);

    if (product) {
        renderProductDetailView(product);
    } else {
        const container = document.getElementById('product-detail-container');
        if (container) container.innerHTML = '<p>Producto no encontrado.</p>';
        const relatedContainer = document.getElementById('related-products-section');
        if (relatedContainer) relatedContainer.style.display = 'none';
    }
}

export function renderCartPage() {
    renderCartItems();
    updateCartSummary();
    const whatsappBtn = document.getElementById('checkout-whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', generateWhatsAppMessageAndRedirect);
    }
}

export function updateCartSummary() {
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    if(subtotalEl && totalEl){
        const subtotal = cart.reduce((sum, item) => sum + ((item.salePrice || item.price) * item.quantity), 0);
        const shipping = 10.00;
        const total = subtotal ;
        subtotalEl.textContent = `${CURRENCY_SYMBOL}${subtotal.toFixed(2)}`;
        totalEl.textContent = `${CURRENCY_SYMBOL}${total.toFixed(2)}`;
    }
}

// --- FILTROS Y BÚSQUEDA ---
export function initializeSearchResultsPage() {
    const categoryFilter = document.getElementById('filter-category');
    const priceFilter = document.getElementById('filter-price');
    const priceValue = document.getElementById('price-value');
    const sortSelect = document.getElementById('sort-by');
    const brandsContainer = document.getElementById('filter-brands-container');
    const showMoreBtn = document.getElementById('show-more-btn');

    if (!categoryFilter || !priceFilter || !sortSelect || !brandsContainer) { 
        console.error("Faltan elementos de filtro en el HTML. Revisa los IDs."); 
        return; 
    }

    const uniqueCategories = [...new Set(allProducts.map(p => p.category))].sort();
    categoryFilter.innerHTML = '<option value="all">Todas</option>' + uniqueCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    
    const uniqueBrands = [...new Set(allProducts.map(p => p.brand))].sort();
    brandsContainer.innerHTML = uniqueBrands.map(brand => `<label><input type="checkbox" name="brand" value="${brand}"> ${brand}</label>`).join('');

    function applyFiltersAndRender() {
        let filtered = [...allProducts];
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) { const q = query.toLowerCase(); document.getElementById('results-page-title').innerHTML = `Resultados para <span style="color: var(--primary-color);">'${q}'</span>`; filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)); }
        else { document.getElementById('results-page-title').textContent = 'Todos los Productos'; }
        if (categoryFilter.value !== 'all') filtered = filtered.filter(p => p.category === categoryFilter.value);
        const selectedBrands = [...document.querySelectorAll('input[name="brand"]:checked')].map(el => el.value);
        if (selectedBrands.length > 0) filtered = filtered.filter(p => selectedBrands.includes(p.brand));
        const maxPrice = parseInt(priceFilter.value, 10);
        if (priceValue) priceValue.textContent = `${CURRENCY_SYMBOL}${maxPrice}`;
        filtered = filtered.filter(p => (p.salePrice || p.price) <= maxPrice);
        const sortBy = sortSelect.value;
        if (sortBy === 'price-asc') filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        else if (sortBy === 'price-desc') filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        currentFilteredProducts = filtered;
        productsVisibleCount = PRODUCTS_PER_PAGE;
        renderProductGrid();
    }

    categoryFilter.addEventListener('change', applyFiltersAndRender);
    priceFilter.addEventListener('input', applyFiltersAndRender);
    sortSelect.addEventListener('change', applyFiltersAndRender);
    brandsContainer.addEventListener('change', applyFiltersAndRender);
    if(showMoreBtn) showMoreBtn.addEventListener('click', () => {
        productsVisibleCount += PRODUCTS_PER_PAGE;
        renderProductGrid();
    });
    applyFiltersAndRender();
}

function renderProductGrid() {
    const grid = document.getElementById('results-grid');
    const showMoreContainer = document.getElementById('show-more-container');
    const productsToRender = currentFilteredProducts.slice(0, productsVisibleCount);
    if (!grid || !showMoreContainer) return;
    grid.innerHTML = productsToRender.length > 0 ? productsToRender.map(renderProductCard).join('') : '<p>No se encontraron productos.</p>';
    showMoreContainer.style.display = productsVisibleCount >= currentFilteredProducts.length ? 'none' : 'block';
    updateResultsCount();
}

function updateResultsCount(){
     const countEl = document.getElementById('results-count');
     if(countEl) countEl.textContent = `Mostrando ${Math.min(productsVisibleCount, currentFilteredProducts.length)} de ${currentFilteredProducts.length} resultados`;
}

export function initializeSearchBars() {
    document.querySelectorAll('#main-search-input, #desktop-search-input, #mobile-search-input').forEach(input => {
        const resultsId = input.id.replace('-input', '-results');
        input.addEventListener('input', (e) => handleSearchSuggestions(e, resultsId));
    });
}

function handleSearchSuggestions(event, resultsContainerId) {
    const searchTerm = event.target.value.toLowerCase();
    const resultsContainer = document.getElementById(resultsContainerId);
    if (!resultsContainer || searchTerm.length < 2) {
        if(resultsContainer) resultsContainer.style.display = 'none';
        return;
    }
    const matchedProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
    resultsContainer.innerHTML = matchedProducts.length > 0 ? matchedProducts.map(p => `<a href="product-details.html?id=${p.id}" class="search-result-item"><img src="${p.imageUrl}" alt="${p.name}"><h4>${p.name}</h4></a>`).join('') : '<p style="padding: 1rem;">No hay coincidencias.</p>';
    resultsContainer.style.display = 'block';
}

export function changeMainImage(imgUrl, clickedThumbnail) {
    document.getElementById('main-product-image').src = imgUrl;
    document.querySelectorAll('.thumbnail-img').forEach(img => img.classList.remove('active'));
    clickedThumbnail.classList.add('active');
}


// --- PANELES MÓVILES ---
export function initializeMobileMenu() {
    const openBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('mobile-menu-close-btn');
    const panel = document.getElementById('mobile-menu-panel');
    const overlay = document.getElementById('mobile-menu-overlay');
    if (openBtn && panel && overlay) {
        const open = () => { panel.classList.add('is-open'); overlay.classList.add('is-visible'); };
        const close = () => { panel.classList.remove('is-open'); overlay.classList.remove('is-visible'); };
        openBtn.addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', close);
    }
}

export function initializeCartPanel() {
    const cartIcons = document.querySelectorAll('a[href="cart.html"].icon-button');
    const closeBtn = document.getElementById('cart-panel-close-btn');
    const overlay = document.getElementById('cart-panel-overlay');
    if (closeBtn && overlay) {
        cartIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) { e.preventDefault(); openCartPanel(); }
            });
        });
        closeBtn.addEventListener('click', closeCartPanel);
        overlay.addEventListener('click', closeCartPanel);
    }
}

export function openCartPanel() {
    renderCartPanel();
    document.getElementById('cart-panel').classList.add('is-open');
    document.getElementById('cart-panel-overlay').classList.add('is-visible');
}

function closeCartPanel() {
    document.getElementById('cart-panel').classList.remove('is-open');
    document.getElementById('cart-panel-overlay').classList.remove('is-visible');
}


// --- ESTADOS DE UI ---
export function showLoadingState() {
    const sel = '#results-grid, #product-detail-container, #featured-products-grid';
    document.querySelectorAll(sel).forEach(c => { if(c) c.innerHTML = '<p style="text-align:center; padding: 2rem;">Cargando productos...</p>'; });
}

export function showErrorState(message) {
    const sel = '#results-grid, #product-detail-container, #featured-products-grid';
    document.querySelectorAll(sel).forEach(c => { if(c) c.innerHTML = `<p style="color: red; text-align:center; padding: 2rem;"><b>Error:</b> ${message}</p>`; });
}