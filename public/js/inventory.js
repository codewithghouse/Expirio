/**
 * Inventory Management Logic
 * Handles client-side filtering, sorting, and batch item addition.
 */

// --- Data Configuration ---
const categoryKeywords = {
    'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg', 'margarine'],
    'Produce': ['apple', 'banana', 'orange', 'fruit', 'veg', 'potato', 'onion', 'carrot', 'tomato', 'lettuce', 'spinach', 'broccoli', 'avocado', 'cucumber', 'garlic', 'lemon', 'lime', 'grape'],
    'Meat': ['chicken', 'beef', 'steak', 'pork', 'fish', 'salmon', 'tuna', 'meat', 'ham', 'bacon'],
    'Bakery': ['bread', 'bagel', 'bun', 'toast', 'croissant', 'cake', 'muffin', 'tortilla'],
    'Pantry': ['rice', 'pasta', 'cereal', 'oat', 'sugar', 'flour', 'oil', 'salt', 'pepper', 'spice', 'sauce', 'honey', 'jam', 'peanut', 'chocolate', 'snack', 'chip'],
    'Beverages': ['juice', 'soda', 'water', 'beer', 'wine', 'coffee', 'tea', 'drink']
};

const iconMap = {
    'Dairy': '🧀',
    'Produce': '🥬',
    'Meat': '🥩',
    'Bakery': '🍞',
    'Pantry': '🥫',
    'Beverages': '🧃',
    'Others': '📦',
    'all': '🏠'
};

// --- State ---
let currentCategory = 'all';
let currentSearch = '';
let pendingItems = [];

// --- Helpers ---
function getCategory(name) {
    name = name.toLowerCase();
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(k => name.includes(k))) return cat;
    }
    return 'Others';
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Item Categories and Icons
    const items = document.querySelectorAll('.inventory-item');
    const validCats = new Set();

    items.forEach(item => {
        const name = item.getAttribute('data-name');
        const cat = getCategory(name);
        item.setAttribute('data-category', cat);

        // Update icon if container exists
        const iconEl = item.querySelector('.item-icon');
        if (iconEl) iconEl.textContent = iconMap[cat] || '📦';

        validCats.add(cat);
    });

    // 2. Initialize Filter Categories Grid
    const grid = document.getElementById('unified-category-grid');
    if (grid) {
        // Clear existing except 'All' if strictly managed, but here appending is safer based on previous logic
        // We assume 'All' is hardcoded in HTML or we append others.
        // Let's keep 'All' in HTML and append others.
        validCats.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = "cat-btn bg-gray-50 text-gray-600 border border-transparent hover:bg-emerald-50 hover:border-emerald-200 flex flex-col items-center justify-center p-3 rounded-2xl shadow-sm transition-all";
            btn.dataset.cat = cat;
            btn.onclick = () => filterByCategory(cat);
            btn.innerHTML = `
                <div class="text-2xl mb-1">${iconMap[cat] || '📦'}</div>
                <span class="text-[10px] font-bold text-gray-600">${cat}</span>
            `;
            grid.appendChild(btn);
        });
    }

    // 3. Setup Search Listener
    const searchInput = document.getElementById('app-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            filterItems();
        });
    }

    // 4. Initial Sort (Logic Only, No UI trigger)
    applySort('expiry-asc');
});

// --- Core Filtering Logic ---
function filterByCategory(cat) {
    currentCategory = cat;

    // Update visual state of category buttons
    document.querySelectorAll('.cat-btn').forEach(btn => {
        const titleSpan = btn.querySelector('span');
        if (btn.dataset.cat === cat) {
            btn.className = "cat-btn bg-gray-900 text-white shadow-md transform scale-105 flex flex-col items-center justify-center p-3 rounded-2xl transition-all";
            if (titleSpan) titleSpan.className = "text-[10px] font-bold text-white";
        } else {
            btn.className = "cat-btn bg-gray-50 text-gray-600 border border-transparent hover:bg-emerald-50 hover:border-emerald-200 flex flex-col items-center justify-center p-3 rounded-2xl shadow-sm transition-all";
            if (titleSpan) titleSpan.className = "text-[10px] font-bold text-gray-600";
        }
    });

    filterItems();
}

function filterItems() {
    let visibleCount = 0;
    const items = document.querySelectorAll('.inventory-item');

    items.forEach(item => {
        const name = item.getAttribute('data-name');
        const cat = item.getAttribute('data-category');

        const matchSearch = name.includes(currentSearch);
        const matchCat = currentCategory === 'all' || cat === currentCategory;

        if (matchSearch && matchCat) {
            item.classList.remove('hidden');
            visibleCount++;
        } else {
            item.classList.add('hidden');
        }
    });

    // Toggle Empty State
    const noResults = document.getElementById('no-results');
    if (noResults) {
        if (visibleCount === 0) noResults.classList.remove('hidden');
        else noResults.classList.add('hidden');
    }

    updateIndicators();
}

function updateIndicators() {
    const indicator = document.getElementById('filter-active-indicator');
    if (indicator) {
        if (currentCategory !== 'all') indicator.classList.remove('hidden');
        else indicator.classList.add('hidden');
    }
}

// --- Sort & Filter Sheet UI Control ---
function openSortFilter() {
    const overlay = document.getElementById('sortFilterOverlay');
    const panel = document.getElementById('sortFilterPanel');
    if (overlay && panel) {
        overlay.classList.remove('hidden');
        panel.classList.remove('translate-y-full');
        document.body.style.overflow = 'hidden';
    }
}

function closeSortFilter() {
    const overlay = document.getElementById('sortFilterOverlay');
    const panel = document.getElementById('sortFilterPanel');
    if (overlay && panel) {
        overlay.classList.add('hidden');
        panel.classList.add('translate-y-full');
        document.body.style.overflow = '';
    }
}

// --- Sorting Logic ---
function handleSort(type) {
    applySort(type);
    closeSortFilter();
}

function applySort(type) {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;

    const items = Array.from(grid.children);

    items.sort((a, b) => {
        if (type === 'expiry-asc') {
            return parseInt(a.getAttribute('data-expiry-days')) - parseInt(b.getAttribute('data-expiry-days'));
        }
        if (type === 'expiry-desc') {
            return parseInt(b.getAttribute('data-expiry-days')) - parseInt(a.getAttribute('data-expiry-days'));
        }
        if (type === 'alpha-asc') {
            return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'));
        }
        // Fallback or other types
        return 0;
    });

    // Re-append sorted items
    items.forEach(i => grid.appendChild(i));

    // Update Sort Buttons UI
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50');
        const check = btn.querySelector('.check-icon');
        if (check) check.classList.add('opacity-0');
    });

    const activeBtn = document.querySelector(`.sort-btn[onclick*="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50');
        const check = activeBtn.querySelector('.check-icon');
        if (check) check.classList.remove('opacity-0');
    }
}

function resetFilters() {
    const searchInput = document.getElementById('app-search-input');
    if (searchInput) searchInput.value = '';

    currentSearch = '';
    filterByCategory('all');
    applySort('expiry-asc');
    closeSortFilter();
}

// --- Batch Add Modal Logic ---
function openModal() {
    const modal = document.getElementById('batchAddModal');
    if (modal) {
        modal.classList.remove('hidden');
        renderPendingList();
    }
}

function closeModal() {
    const modal = document.getElementById('batchAddModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function addToBatch(name, shelf) {
    // Add new item with default quantity 1 and age 0
    pendingItems.push({
        name,
        quantity: 1,
        shelfLife: shelf || 7,
        daysOld: 0,
        id: Date.now()
    });
    renderPendingList();
}

function removeFromBatch(idx) {
    pendingItems.splice(idx, 1);
    renderPendingList();
}

function updatePendingItem(idx, field, delta) {
    const item = pendingItems[idx];
    if (!item) return;

    if (field === 'quantity') {
        item.quantity = Math.max(1, item.quantity + delta);
    }
    if (field === 'daysOld') {
        item.daysOld = Math.max(0, item.daysOld + delta);
    }
    renderPendingList();
}

function renderPendingList() {
    const listEl = document.getElementById('pending-list');
    const section = document.getElementById('pending-section');
    const countLabel = document.getElementById('pending-count-label');
    const submitBtn = document.getElementById('btn-add-all');

    if (!listEl || !section) return;

    // Update Header
    if (countLabel) countLabel.textContent = `${pendingItems.length} items pending`;
    if (submitBtn) submitBtn.disabled = pendingItems.length === 0;

    // Show/Hide Section
    if (pendingItems.length === 0) {
        section.classList.add('hidden');
        listEl.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');

    // Render Items
    listEl.innerHTML = pendingItems.map((item, idx) => `
        <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-gray-900 capitalize">${item.name}</span>
                    <button onclick="removeFromBatch(${idx})" class="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="flex items-center space-x-4">
                    <!-- Quantity Control -->
                    <div class="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-8">
                        <button onclick="updatePendingItem(${idx}, 'quantity', -1)" class="px-2 text-gray-500 hover:text-emerald-600 border-r border-gray-200">
                            <i class="fas fa-minus text-[10px]"></i>
                        </button>
                        <span class="px-3 text-xs font-bold w-8 text-center text-gray-900">${item.quantity}</span>
                        <button onclick="updatePendingItem(${idx}, 'quantity', 1)" class="px-2 text-gray-500 hover:text-emerald-600 border-l border-gray-200">
                            <i class="fas fa-plus text-[10px]"></i>
                        </button>
                    </div>
                    
                    <!-- Age Control -->
                    <div class="flex items-center space-x-2">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Age</span>
                        <div class="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-8">
                            <button onclick="updatePendingItem(${idx}, 'daysOld', -1)" class="px-2 text-gray-500 hover:text-emerald-600 border-r border-gray-200">
                                <i class="fas fa-minus text-[10px]"></i>
                            </button>
                            <span class="px-3 text-xs font-bold w-8 text-center text-gray-900">${item.daysOld}d</span>
                            <button onclick="updatePendingItem(${idx}, 'daysOld', 1)" class="px-2 text-gray-500 hover:text-emerald-600 border-l border-gray-200">
                                <i class="fas fa-plus text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function submitBatch() {
    if (pendingItems.length === 0) return;

    const btn = document.getElementById('btn-add-all');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

    try {
        const res = await fetch('/inventory/add-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: pendingItems })
        });

        const data = await res.json();

        if (data.success) {
            pendingItems = [];
            closeModal();
            window.location.reload();
        } else {
            alert('Error: ' + (data.message || 'Failed to save items'));
        }
    } catch (e) {
        console.error(e);
        alert('Error connecting to server');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
