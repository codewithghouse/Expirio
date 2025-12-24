/**
 * Inventory Management Logic
 * Handles client-side filtering, sorting, search, and quantity management.
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
let currentStatus = 'all';  // NEW: for status filtering (all, fresh, expiring, expired)
let currentCategory = 'all';
let currentSearch = '';
let pendingItems = [];
let html5QrcodeScanner = null;


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

    // 2. Initialize Filter Categories Grid (in Sort/Filter panel)
    const grid = document.getElementById('unified-category-grid');
    if (grid) {
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

    // 4. Initial Sort
    applySort('expiry-asc');

    // 5. Set initial tab state
    updateTabPillStyles();
});


// --- NEW: Status-based Filtering (All/Fresh/Expiring/Expired) ---
function filterByStatus(status) {
    currentStatus = status;
    updateTabPillStyles();
    filterItems();
}

// Alias for the filterByCategory function called by tabs
// The horizontal tabs now filter by STATUS, not product category
function filterByCategory(input) {
    // If input is a status value (all, fresh, expiring, expired), use status filtering
    if (['all', 'fresh', 'expiring', 'expired'].includes(input)) {
        filterByStatus(input);
        return;
    }

    // Otherwise it's a product category filter (from the Sort/Filter panel)
    currentCategory = input;

    // Update visual state of category buttons in the sort/filter panel
    document.querySelectorAll('.cat-btn').forEach(btn => {
        const titleSpan = btn.querySelector('span');
        if (btn.dataset.cat === input) {
            btn.className = "cat-btn bg-gray-900 text-white shadow-md transform scale-105 flex flex-col items-center justify-center p-3 rounded-2xl transition-all";
            if (titleSpan) titleSpan.className = "text-[10px] font-bold text-white";
        } else {
            btn.className = "cat-btn bg-gray-50 text-gray-600 border border-transparent hover:bg-emerald-50 hover:border-emerald-200 flex flex-col items-center justify-center p-3 rounded-2xl shadow-sm transition-all";
            if (titleSpan) titleSpan.className = "text-[10px] font-bold text-gray-600";
        }
    });

    filterItems();
}


// --- Update Tab Pill Styles ---
function updateTabPillStyles() {
    const pills = document.querySelectorAll('.cat-pill');

    pills.forEach(pill => {
        // Get the status from the onclick attribute
        const onclickAttr = pill.getAttribute('onclick') || '';
        let pillStatus = 'all';

        if (onclickAttr.includes("'all'")) pillStatus = 'all';
        else if (onclickAttr.includes("'fresh'")) pillStatus = 'fresh';
        else if (onclickAttr.includes("'expiring'")) pillStatus = 'expiring';
        else if (onclickAttr.includes("'expired'")) pillStatus = 'expired';

        if (pillStatus === currentStatus) {
            // Active state
            pill.className = "cat-pill whitespace-nowrap px-6 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-200/50 transition-all transform active:scale-95 border border-transparent";
        } else {
            // Inactive state
            pill.className = "cat-pill whitespace-nowrap px-6 py-2.5 rounded-full bg-white text-gray-600 border border-gray-100 text-sm font-bold shadow-sm transition-all transform active:scale-95 active:bg-gray-50";
        }
    });
}


// --- Core Filtering Logic ---
function filterItems() {
    let visibleCount = 0;
    const items = document.querySelectorAll('.inventory-item');

    items.forEach(item => {
        const name = item.getAttribute('data-name');
        const cat = item.getAttribute('data-category');
        const status = item.getAttribute('data-status');

        // Match search
        const matchSearch = !currentSearch || name.includes(currentSearch);

        // Match status (all/fresh/expiring/expired)
        const matchStatus = currentStatus === 'all' || status === currentStatus;

        // Match category (from sort/filter panel)
        const matchCat = currentCategory === 'all' || cat === currentCategory;

        if (matchSearch && matchStatus && matchCat) {
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
        if (currentCategory !== 'all' || currentStatus !== 'all') {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
}


// --- NEW: Quantity Increment Function ---
async function incrementQuantity(itemId) {
    const itemEl = document.querySelector(`[data-id="${itemId}"]`);
    if (!itemEl) return;

    // Get current quantity
    let currentQty = parseInt(itemEl.getAttribute('data-quantity')) || 1;
    const newQty = currentQty + 1;

    // Optimistic UI update
    itemEl.setAttribute('data-quantity', newQty);
    const qtyDisplays = itemEl.querySelectorAll('.qty-display, span:contains("pcs")');

    // Update the quantity display text
    const qtyText = itemEl.querySelector('.text-gray-400');
    if (qtyText && qtyText.textContent.includes('pcs')) {
        qtyText.textContent = newQty + ' pcs';
    }

    // Also update any qty-display elements
    itemEl.querySelectorAll('.qty-display').forEach(el => {
        el.textContent = newQty;
    });

    // Find and update the mobile display (format: "X pcs")
    const infoDiv = itemEl.querySelector('.flex.items-center.text-xs.font-semibold.gap-2');
    if (infoDiv) {
        const pcsSpan = infoDiv.querySelector('.text-gray-400');
        if (pcsSpan) {
            pcsSpan.textContent = newQty + ' pcs';
        }
    }

    // Visual feedback on button
    const btn = itemEl.querySelector('.qty-btn');
    if (btn) {
        btn.classList.add('ring-2', 'ring-emerald-300');
        setTimeout(() => {
            btn.classList.remove('ring-2', 'ring-emerald-300');
        }, 200);
    }

    // Send to backend (fire-and-forget with error handling)
    try {
        const res = await fetch(`/inventory/${itemId}/increment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            // Revert on failure
            itemEl.setAttribute('data-quantity', currentQty);
            console.error('Failed to increment quantity');
        }
    } catch (e) {
        console.error('Network error incrementing quantity:', e);
        // Revert on failure
        itemEl.setAttribute('data-quantity', currentQty);
    }
}


// --- Sort & Filter Sheet UI Control ---
function openSortFilter() {
    const overlay = document.getElementById('sortFilterOverlay');
    const panel = document.getElementById('sortFilterPanel');
    if (overlay && panel) {
        overlay.classList.remove('hidden');
        panel.classList.remove('hidden');
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
    // Sort both mobile and desktop lists
    const mobileList = document.getElementById('mobile-inventory-list');
    const desktopGrid = document.getElementById('desktop-inventory-grid');

    [mobileList, desktopGrid].forEach(container => {
        if (!container) return;

        const items = Array.from(container.querySelectorAll('.inventory-item'));

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
            return 0;
        });

        // Re-append sorted items
        items.forEach(i => container.appendChild(i));
    });

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
    currentStatus = 'all';
    currentCategory = 'all';

    updateTabPillStyles();
    filterItems();
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
    stopScanner();
    const modal = document.getElementById('batchAddModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}


// --- Barcode Scanner Logic ---
function startScanner() {
    const container = document.getElementById('scanner-container');
    const buttons = document.getElementById('scan-buttons');
    const instruction = document.getElementById('scan-instruction');

    if (container) container.classList.remove('hidden');
    if (buttons) buttons.classList.add('hidden');
    if (instruction) instruction.innerText = "Point camera at a barcode";

    if (!html5QrcodeScanner) {
        if (typeof Html5QrcodeScanner === 'undefined') {
            alert("Scanner library not loaded. Please refresh.");
            return;
        }

        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }
}

function stopScanner() {
    const container = document.getElementById('scanner-container');
    const buttons = document.getElementById('scan-buttons');
    const instruction = document.getElementById('scan-instruction');

    if (html5QrcodeScanner) {
        try {
            html5QrcodeScanner.clear().then(() => {
                html5QrcodeScanner = null;
            }).catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        } catch (e) {
            console.warn("Scanner clear error", e);
            html5QrcodeScanner = null;
        }
    }

    if (container) container.classList.add('hidden');
    if (buttons) buttons.classList.remove('hidden');
    if (instruction) instruction.innerText = "Can't find what you're looking for?";
}

function onScanSuccess(decodedText, decodedResult) {
    stopScanner();
    addToBatch(`Item ${decodedText}`, 7);
    alert(`Scanned: ${decodedText}`);
}

function onScanFailure(error) {
    // Ignore scan failures, keep scanning
}


function addToBatch(name, shelf) {
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

    if (countLabel) countLabel.textContent = `${pendingItems.length} items pending`;
    if (submitBtn) submitBtn.disabled = pendingItems.length === 0;

    if (pendingItems.length === 0) {
        section.classList.add('hidden');
        listEl.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');

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
