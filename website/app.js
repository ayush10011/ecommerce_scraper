// ==========================================
// BookStore Catalog - Product Display App
// ==========================================

const ITEMS_PER_PAGE = 24;
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;

// CSV Parser
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
        
        // Parse numeric fields
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

// Load CSV data
async function loadProducts() {
    // Try multiple paths to locate products.csv
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
            renderPage();
            return;
        } catch (err) {
            lastErr = err;
        }
    }

    document.getElementById('productGrid').innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m15 9-6 6"/><path d="m9 9 6 6"/>
            </svg>
            <p>Error loading products: ${lastErr?.message || 'Failed to load CSV'}</p>
            <p style="font-size:0.85rem;margin-top:0.5rem">Make sure products.csv exists in the parent folder, or run a local HTTP server (e.g., <code>python -m http.server</code> or VS Code Live Server).</p>
        </div>
    `;
}

// Update statistics dashboard
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
    const duration = 800;
    const start = performance.now();
    const from = 0;
    
    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = from + (value - from) * ease;
        el.textContent = prefix + current.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(tick);
    }
    
    requestAnimationFrame(tick);
}

// Filter & Sort
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
    
    // Sort
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
    renderPage();
}

// Render stars
function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return html;
}

// Render page
function renderPage() {
    const grid = document.getElementById('productGrid');
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredProducts.slice(start, end);
    
    if (pageItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>No products match your filters.</p>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    grid.innerHTML = pageItems.map(p => {
        const availClass = p.Availability?.toLowerCase().includes('in stock') ? 'in-stock' : 'out-of-stock';
        const dot = p.Availability?.toLowerCase().includes('in stock') 
            ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:4px;"></span>' 
            : '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:4px;opacity:0.5;"></span>';
        
        return `
            <article class="product-card">
                <img src="${p.Image || ''}" alt="${p.Name}" class="product-image" loading="lazy" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display:none;height:320px;align-items:center;justify-content:center;background:var(--gray-100);color:var(--gray-400);font-size:0.9rem;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="m21 15-5-5L5 21"/>
                    </svg>
                </div>
                <div class="product-info">
                    <h3 class="product-title" title="${p.Name}">${p.Name}</h3>
                    <div class="product-meta">
                        <span class="product-price">${p.Price}</span>
                        <span class="product-rating">${renderStars(p.ratingNum)} ${p.ratingNum > 0 ? p.ratingNum + '/5' : ''}</span>
                    </div>
                    <span class="product-availability ${availClass}">${dot}${p.Availability}</span>
                    <a href="${p.URL}" target="_blank" rel="noopener" class="product-link">View Product</a>
                </div>
            </article>
        `;
    }).join('');
    
    renderPagination();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Prev
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">←</button>`;
    
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
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">→</button>`;
    
    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 250));
    document.getElementById('sortSelect').addEventListener('change', applyFilters);
    document.getElementById('availabilityFilter').addEventListener('change', applyFilters);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
});

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

