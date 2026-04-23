// ==========================================
// BookStore Catalog - Modern Product Display
// ==========================================

const ITEMS_PER_PAGE = 24;
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6m0-6 6 6"/></svg>',
        info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>'
    };
    
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
}

// ==========================================
// Dark Mode
// ==========================================
function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    document.getElementById('themeToggle').addEventListener('click', () => {
        const isDarkNow = document.documentElement.hasAttribute('data-theme');
        if (isDarkNow) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            showToast('Light mode enabled', 'info');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            showToast('Dark mode enabled', 'info');
        }
    });
}

// ==========================================
// CSV Parser
// ==========================================
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]);
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;
        
        const product = {};
        headers.forEach((h, idx) => {
            product[h.trim()] = values[idx]?.trim() || '';
        });
        
        const priceMatch = product.Price?.match(/[\d.]+/);
        product.priceNum = priceMatch ? parseFloat(priceMatch[0]) : 0;
        
        const ratingMatch = product.Rating?.match(/^(\d)/);
        product.ratingNum = ratingMatch ? parseInt(ratingMatch[1]) : 0;
        
        products.push(product);
    }
    
    return products;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// ==========================================
// Load Products
// ==========================================
async function loadProducts() {
    const paths = ['../products.csv', 'products.csv'];
    let lastErr = null;

    for (const path of paths) {
        try {
            const response = await fetch(path);
            if (!response.ok) continue;
            const text = await response.text();
            allProducts = parseCSV(text);
            filteredProducts = [...allProducts];
            updateStats();
            updateResultsCount();
            renderPage();
            showToast(`Loaded ${allProducts.length} products`, 'success');
            return;
        } catch (err) {
            lastErr = err;
        }
    }

    document.getElementById('productGrid').innerHTML = `
        <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6m0-6 6 6"/>
            </svg>
            <h3>Failed to load products</h3>
            <p>${lastErr?.message || 'Could not load CSV file'}. Make sure products.csv exists and you're running a local server.</p>
        </div>
    `;
    showToast('Failed to load products', 'error');
}

// ==========================================
// Stats Dashboard
// ==========================================
function updateStats() {
    const total = allProducts.length;
    const prices = allProducts.map(p => p.priceNum).filter(p => p > 0);
    const ratings = allProducts.map(p => p.ratingNum).filter(r => r > 0);
    const inStock = allProducts.filter(p => p.Availability?.toLowerCase().includes('in stock')).length;
    
    const avgPrice = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
    
    animateNumber('totalProducts', total, 0);
    animateNumber('avgPrice', avgPrice, 2, '£');
    animateNumber('avgRating', avgRating, 1);
    animateNumber('inStock', inStock, 0);
}

function animateNumber(id, value, decimals, prefix = '') {
    const el = document.getElementById(id);
    const duration = 1000;
    const start = performance.now();
    const from = 0;
    
    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = from + (value - from) * ease;
        el.textContent = prefix + current.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(tick);
    }
    
    requestAnimationFrame(tick);
}

// ==========================================
// Results Count
// ==========================================
function updateResultsCount() {
    const el = document.getElementById('resultsCount');
    const count = filteredProducts.length;
    const total = allProducts.length;
    
    if (count === total) {
        el.textContent = `Showing all ${total.toLocaleString()} products`;
    } else if (count === 0) {
        el.textContent = 'No products match your filters';
    } else {
        el.textContent = `Showing ${count.toLocaleString()} of ${total.toLocaleString()} products`;
    }
}

// ==========================================
// Clear Search
// ==========================================
function initClearSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    input.addEventListener('input', () => {
        clearBtn.classList.toggle('visible', input.value.length > 0);
    });
    
    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.classList.remove('visible');
        applyFilters();
        input.focus();
    });
}

// ==========================================
// Filter & Sort
// ==========================================
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const availability = document.getElementById('availabilityFilter').value;
    const minRating = document.getElementById('ratingFilter').value;
    const sort = document.getElementById('sortSelect').value;
    
    filteredProducts = allProducts.filter(p => {
        const matchesSearch = !search || p.Name?.toLowerCase().includes(search);
        const matchesAvail = availability === 'all' || p.Availability?.includes(availability);
        const matchesRating = minRating === 'all' || p.ratingNum >= parseInt(minRating);
        return matchesSearch && matchesAvail && matchesRating;
    });
    
    switch (sort) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.priceNum - b.priceNum);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.priceNum - a.priceNum);
            break;
        case 'rating-desc':
            filteredProducts.sort((a, b) => b.ratingNum - a.ratingNum);
            break;
        case 'rating-asc':
            filteredProducts.sort((a, b) => a.ratingNum - b.ratingNum);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
            break;
    }
    
    currentPage = 1;
    updateResultsCount();
    renderPage();
}

// ==========================================
// Render Stars
// ==========================================
function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return html;
}

// ==========================================
// Render Page
// ==========================================
function renderPage() {
    const grid = document.getElementById('productGrid');
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredProducts.slice(start, end);
    
    if (pageItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    grid.innerHTML = pageItems.map((p, idx) => {
        const availClass = p.Availability?.toLowerCase().includes('in stock') ? 'in-stock' : 'out-of-stock';
        const dotClass = availClass === 'in-stock' ? '' : 'out';
        const availText = p.Availability || 'Unknown';
        
        return `
            <article class="product-card" style="animation-delay: ${idx * 0.04}s">
                <div class="product-image-wrap">
                    <img src="${p.Image || ''}" alt="${p.Name}" class="product-image" loading="lazy" 
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="image-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                        </svg>
                        <span>No Image</span>
                    </div>
                    ${p.ratingNum > 0 ? `
                    <div class="rating-badge">
                        <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ${p.ratingNum}
                    </div>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title" title="${p.Name}">${p.Name}</h3>
                    <div class="product-meta">
                        <span class="product-price">${p.Price || 'N/A'}</span>
                        <span class="product-rating">${renderStars(p.ratingNum)}</span>
                    </div>
                    <span class="product-availability ${availClass}">
                        <span class="avail-dot ${dotClass}"></span>
                        ${availText}
                    </span>
                    <a href="${p.URL}" target="_blank" rel="noopener noreferrer" class="product-link">
                        View Product
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            </article>
        `;
    }).join('');
    
    renderPagination();
}

// ==========================================
// Pagination
// ==========================================
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Prev
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})" aria-label="Previous page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
    </button>`;
    
    // Page numbers
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        html += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<button disabled>...</button>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<button disabled>...</button>`;
        html += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})" aria-label="Next page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
    </button>`;
    
    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// Debounce
// ==========================================
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ==========================================
// Event Listeners
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initClearSearch();
    loadProducts();
    
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 250));
    document.getElementById('sortSelect').addEventListener('change', applyFilters);
    document.getElementById('availabilityFilter').addEventListener('change', applyFilters);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
});
