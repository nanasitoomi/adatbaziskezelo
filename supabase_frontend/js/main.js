// Supabase Client Initialization
const supabaseUrl = 'https://phbqdjkprftqtshsatce.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoYnFkamtwcmZ0cXRzaHNhdGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODQ4NzksImV4cCI6MjA1OTc2MDg3OX0.XaYvCiHvov5ze1LFXOPGlK7VO9bF1o03_B5uLn72P0E';

// Fontos: A production kódban az anon kulcsot és az URL-t biztonságosabb módon kell kezelni (pl. környezeti változók).
// Initialize the Supabase client with the loaded library
const _supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

// DOM Elemek
const appContent = document.getElementById('app-content');
const navHome = document.getElementById('nav-home');
const navLogo = document.getElementById('nav-logo');
const navProducts = document.getElementById('nav-products');
const navCompare = document.getElementById('nav-compare');

// Globális változók
let initialAppContentHTML = ''; // To store the landing page content
let allProducts = [];
let distinctProductTypes = [];
let distinctBrands = [];
let distinctOrigins = [];
let distinctVintages = [];
let distinctVolumes = [];
let distinctAlcoholRanges = ["0-5", "5-10", "10-20", "20-40", "40-100"];
let distinctTastes = [];
let distinctAdminCategories = [];
let distinctAgingMethods = [];
let distinctGrapeVarieties = [];
let currentFilters = {
    search: '',
    product_type: '',
    brand: '',
    origin: '',
    vintage: '',
    volume: '',
    min_alcohol: '0',
    max_alcohol: '100',
    taste: '',
    category: '',
    aging_method: '',
    grape_variety: ''
};

// CSS classes for view states
const LIST_VIEW_CLASS = 'list-view';
const ACTIVE_CLASS = 'active';

// Táblázat rendezési állapot
let currentSort = {
    shopifyField: 'SKU',
    bcField: 'Szám',
    direction: 'asc'
};

// Termék adatok tárolására
let allShopifyProducts = [];
let allBCProducts = [];
let shopifyProducts = [];  // Shopify termékek az összehasonlító nézethez
let bcProducts = [];       // Business Central termékek az összehasonlító nézethez
let mergedProducts = [];
let currentPage = 1;
let pageSize = 20;
// Keresés és szűrés
let searchQuery = "";
// Nézetkezelés
let currentView = 'products';
let currentTab = 'all-products';

// --- Helper Függvények ---

// Helper to safely access potentially missing data using original column names
const safeGet = (obj, key, fallback = 'N/A') => obj ? (obj[key] !== null && obj[key] !== undefined ? obj[key] : fallback) : fallback;

function createFilterOptions(items, selectedValue) {
    // Helper function to generate <option> elements
    return items.map(item =>
        `<option value="${item}" ${item === selectedValue ? 'selected' : ''}>${item}</option>`
    ).join('');
}

// Modosított createProductCard, ami a pre-fetched feedback adatokat használja
function createProductCard(product, feedbackMap = {}) {
    // Helper function to generate a product card HTML
    const productHandle = safeGet(product, 'Product Handle');
    const title = safeGet(product, 'Title');
    const brand = safeGet(product, 'Brand');
    const sku = safeGet(product, 'SKU');
    const productType = safeGet(product, 'Product Type (Custom)');
    const origin = safeGet(product, 'Származási hely');
    const alcohol = safeGet(product, 'Alkoholtartalom');
    const volume = safeGet(product, 'Kiszerelés');
    const vintage = safeGet(product, 'Évjárat');
    const taste = safeGet(product, 'Ízjegyek');

    // Get feedback from the pre-fetched map
    const feedbackData = feedbackMap[productHandle] || { approved: false, comment: '' };

    // Determine comment field attributes based on approval status
    const commentDisabled = feedbackData.approved ? 'disabled' : '';
    const commentPlaceholder = feedbackData.approved ? 'Jóváhagyva - nincs szükség megjegyzésre' : 'Megjegyzés/hiba';
    // Use comment from feedbackData, ensure it's not null/undefined
    const commentValue = feedbackData.approved ? '' : (feedbackData.comment || '');

    return `
        <div class="col-md-3 mb-2 product-item">
            <div class="card product-card h-100 border-light hover-shadow">
                <div class="card-body py-2">
                    <!-- Title and Brand container -->
                    <div class="product-title-line d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title mb-0">
                                <a href="#" class="text-decoration-none product-link" data-product-id="${productHandle}">${title}</a>
                            </h6>
                            ${brand !== 'N/A' ? `<p class="card-text text-muted brand-info mb-0"><small>${brand}</small></p>` : ''}
                        </div>
                        <div class="approval-container d-flex align-items-center">
                            <span class="approval-label me-1" style="color: #28a745; font-weight: 600; font-size: 0.9rem;">Jóváhagyva:</span>
                            <div class="form-check">
                                <input class="form-check-input product-approve" type="checkbox" value="" id="approve-${productHandle}" 
                                  data-product-id="${productHandle}" ${feedbackData.approved ? 'checked' : ''}
                                  style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
                                <label class="form-check-label" for="approve-${productHandle}">
                                    <span class="visually-hidden">Jóváhagyva</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <hr class="my-1">
                    <div class="product-details small">
                        ${sku !== 'N/A' ? `<p><i class="bi bi-upc-scan me-1 text-muted"></i><span class="text-muted">SKU:</span> ${sku}</p>` : ''}
                        ${productType !== 'N/A' ? `<p><i class="bi bi-tag me-1 text-muted"></i><span class="text-muted">Kategória:</span> ${productType}</p>` : ''}
                        ${origin !== 'N/A' ? `<p><i class="bi bi-globe me-1 text-muted"></i><span class="text-muted">Származás:</span> ${origin}</p>` : ''}
                        ${alcohol !== 'N/A' ? `<p><i class="bi bi-percent me-1 text-muted"></i><span class="text-muted">Alkohol:</span> ${alcohol}%</p>` : ''}
                        ${volume !== 'N/A' ? `<p><i class="bi bi-cup me-1 text-muted"></i><span class="text-muted">Kiszerelés:</span> ${volume}</p>` : ''}
                        ${vintage !== 'N/A' ? `<p><i class="bi bi-calendar-event me-1 text-muted"></i><span class="text-muted">Évjárat:</span> ${vintage}</p>` : ''}
                        ${taste !== 'N/A' ? `<p class="taste-note"><i class="bi bi-cup-hot me-1 text-muted"></i><span class="text-muted">Ízjegyek:</span> ${taste}</p>` : ''}
                    </div>
                    
                    <!-- Feedback section -->
                    <div class="product-feedback mt-2 pt-2 border-top d-flex align-items-center">
                        <div class="flex-grow-1 me-2">
                            <input type="text" class="form-control form-control-sm product-comment" placeholder="${commentPlaceholder}" 
                                id="comment-${productHandle}" data-product-id="${productHandle}" 
                                value="${commentValue}" ${commentDisabled}>
                        </div>
                        <button class="btn btn-sm btn-primary save-feedback" data-product-id="${productHandle}">
                            <i class="bi bi-save"></i> Mentés
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function applyGridView() {
    const productItems = document.querySelectorAll('.product-item');
    const productsContainer = document.getElementById('products-container');
    
    // Remove list-view class from the container
    if (productsContainer) {
        productsContainer.classList.remove(LIST_VIEW_CLASS);
    }
    
    productItems.forEach(item => {
        // Először töröljünk minden oszlop-osztályt
        item.classList.forEach(className => {
            if (className.startsWith('col-')) {
                item.classList.remove(className);
            }
        });
        
        // Majd adjuk hozzá a grid osztályokat
        item.classList.add('col-md-3', 'mb-2', 'product-item');
        
        const card = item.querySelector('.product-card');
        if (card) card.classList.remove('list-card');
        
        const cardBody = card?.querySelector('.card-body');
        if (cardBody) {
            cardBody.classList.remove('py-2');
            cardBody.classList.add('p-3'); // Restore grid padding
        }

        // Reset potential list view styles (ensure details are not limited)
        const detailsContainer = item.querySelector('.product-details');
        if (detailsContainer) {
             detailsContainer.classList.remove('details-expanded');
             detailsContainer.style.maxHeight = ''; 
        }
        
        // Reset feedback section styles for grid view
        const feedbackSection = item.querySelector('.product-feedback');
        if (feedbackSection) {
            // Az inline stílusok eltávolítása már nem szükséges,
            // mivel a CSS osztályok kezelik az elrendezést
        }
        
        const showMoreBtn = item.querySelector('.show-more-details');
        if (showMoreBtn) {
            showMoreBtn.style.display = 'none';
        }
    });
}

function applyListView() {
    const productItems = document.querySelectorAll('.product-item');
    const productsContainer = document.getElementById('products-container');
    
    // Add list-view class to the container
    if (productsContainer) {
        productsContainer.classList.add(LIST_VIEW_CLASS);
    }
    
    productItems.forEach(item => {
        // Először töröljünk minden oszlop-osztályt
        item.classList.forEach(className => {
            if (className.startsWith('col-')) {
                item.classList.remove(className);
            }
        });
        
        // Majd adjuk hozzá a lista osztályokat
        item.classList.add('col-12', 'mb-2', 'product-item');
        
        const card = item.querySelector('.product-card');
        if (card) card.classList.add('list-card');
        
        const cardBody = card?.querySelector('.card-body');
        if (cardBody) {
            cardBody.classList.remove('p-3'); // Remove grid padding
            cardBody.classList.add('py-2');   // Keep vertical padding
        }
        
        // Ensure details container allows wrapping (CSS handles the layout)
        const detailsContainer = item.querySelector('.product-details');
        if (detailsContainer) {
             detailsContainer.classList.remove('details-expanded'); // Clean up just in case
             detailsContainer.style.maxHeight = ''; // Remove any inline max-height
        }
        
        // Adjust feedback section for list view
        const feedbackSection = item.querySelector('.product-feedback');
        if (feedbackSection) {
            // A width: 100% már nem szükséges, mivel a flexbox kezeli az elrendezést
            // és a CSS-ben már beállítottuk a megfelelő stílusokat
        }
        
        // Remove button logic entirely
        const showMoreBtn = item.querySelector('.show-more-details');
        if (showMoreBtn) {
            showMoreBtn.style.display = 'none';
            // Optionally remove the button from DOM if it exists from previous render?
            // showMoreBtn.remove(); // Or just hide it reliably
        }
    });
}

function createAlcoholRangeButtons() {
    return distinctAlcoholRanges.map(range => {
        const [min, max] = range.split('-');
        return `
            <button type="button" class="btn btn-outline-secondary btn-sm alcohol-preset" 
                   data-min="${min}" data-max="${max}">${min}-${max}%</button>
        `;
    }).join('');
}

function setupFilterHandlers() {
    // Helper function to safely add event listeners
    const safeAddEventListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            // Remove existing listener to prevent duplicates if re-called
            element.removeEventListener(event, handler);
            element.addEventListener(event, handler);
        } else {
            console.error(`setupFilterHandlers: Elem nem található az eseménykezelő hozzáadásához: #${id}`);
        }
    };

    // Set up event handlers for all filters using the safe helper
    safeAddEventListener('search-input', 'input', handleSearchChange);
    safeAddEventListener('product-type-select', 'change', handleFilterChange);
    safeAddEventListener('brand-select', 'change', handleFilterChange);
    safeAddEventListener('origin-select', 'change', handleFilterChange);
    safeAddEventListener('vintage-select', 'change', handleFilterChange);
    safeAddEventListener('volume-select', 'change', handleFilterChange);
    safeAddEventListener('taste-select', 'change', handleFilterChange);
    safeAddEventListener('category-select', 'change', handleFilterChange);
    safeAddEventListener('aging_method-select', 'change', handleFilterChange);
    safeAddEventListener('grape_variety-select', 'change', handleFilterChange);
    
    // Min/max alcohol handlers
    safeAddEventListener('min-alcohol', 'change', handleFilterChange);
    safeAddEventListener('max-alcohol', 'change', handleFilterChange);
    
    // Alcohol preset buttons
    const alcoholPresets = document.querySelectorAll('.alcohol-preset');
    if (alcoholPresets.length > 0) {
        alcoholPresets.forEach(btn => {
            btn.removeEventListener('click', handleAlcoholPresetClick); // Remove first
            btn.addEventListener('click', handleAlcoholPresetClick);
        });
    } // else { console.warn('setupFilterHandlers: Nem találhatóak alkohol preset gombok.'); }
    
    // View toggle buttons - Use safeAddEventListener
    safeAddEventListener('grid-view-btn', 'click', function(event) {
        // event.currentTarget should be the button itself
        const clickedButton = event.currentTarget;
        const otherButton = document.getElementById('list-view-btn');
        if (!clickedButton.classList.contains(ACTIVE_CLASS)) {
            clickedButton.classList.add(ACTIVE_CLASS);
            otherButton?.classList.remove(ACTIVE_CLASS);
            applyGridView();
            localStorage.setItem('productViewPreference', 'grid');
        }
    });
    safeAddEventListener('list-view-btn', 'click', function(event) {
        const clickedButton = event.currentTarget;
        const otherButton = document.getElementById('grid-view-btn');
        if (!clickedButton.classList.contains(ACTIVE_CLASS)) {
            clickedButton.classList.add(ACTIVE_CLASS);
            otherButton?.classList.remove(ACTIVE_CLASS);
            applyListView();
            localStorage.setItem('productViewPreference', 'list');
        }
    });
    
    // Product detail link handlers need to be attached after products are rendered
    // This is handled inside renderProductList function.
}

/**
 * Applies current filters to the product list.
 * @param {Array} products - The array of products to filter.
 * @returns {Array} The filtered array of products.
 */
function applyFilters(products) {
    return products.filter(p => {
        // Keresés
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const titleMatch = safeGet(p, 'Title', '').toLowerCase().includes(searchLower);
            const brandMatch = safeGet(p, 'Brand', '').toLowerCase().includes(searchLower);
            const descMatch = safeGet(p, 'Description', '').toLowerCase().includes(searchLower);
            const skuMatch = safeGet(p, 'SKU', '').toLowerCase().includes(searchLower);
            if (!(titleMatch || brandMatch || descMatch || skuMatch)) return false;
        }
        
        // Kategória
        if (currentFilters.product_type && safeGet(p, 'Product Type (Custom)') !== currentFilters.product_type) {
            return false;
        }
        
        // Márka
        if (currentFilters.brand && safeGet(p, 'Brand') !== currentFilters.brand) {
            return false;
        }
        
        // Származási hely
        if (currentFilters.origin && safeGet(p, 'Származási hely') !== currentFilters.origin) {
            return false;
        }
        
        // Évjárat
        if (currentFilters.vintage && safeGet(p, 'Évjárat') !== currentFilters.vintage) {
            return false;
        }
        
        // Kiszerelés
        if (currentFilters.volume && safeGet(p, 'Kiszerelés') !== currentFilters.volume) {
            return false;
        }
        
        // Alkoholtartalom
        const alcoholContent = parseFloat(String(safeGet(p, 'Alkoholtartalom', '0')).replace(',', '.').replace(/[^\d.]/g, ''));
        if (currentFilters.min_alcohol && alcoholContent < parseFloat(currentFilters.min_alcohol)) {
            return false;
        }
        if (currentFilters.max_alcohol && alcoholContent > parseFloat(currentFilters.max_alcohol)) {
            return false;
        }
        
        // Ízjegyek
        if (currentFilters.taste && safeGet(p, 'Ízjegyek') !== currentFilters.taste) {
            return false;
        }
        
        // Admin kategória
        if (currentFilters.category && safeGet(p, 'admin_category') !== currentFilters.category) {
            return false;
        }
        
        // Érlelési mód - ellenőrizzük mindkét mezőt (kategória és alkategória)
        if (currentFilters.aging_method) {
            const categoryMatch = safeGet(p, 'aging_method_category') === currentFilters.aging_method;
            const subcategoryMatch = safeGet(p, 'aging_method_subcategory') === currentFilters.aging_method;
            if (!categoryMatch && !subcategoryMatch) return false;
        }
        
        // Szőlőfajta kategória - ellenőrizzük a grape_variety_categories mezőt
        if (currentFilters.grape_variety) {
            const categoriesStr = safeGet(p, 'grape_variety_categories', '');
            const categoryMatch = categoriesStr.split(',').map(v => v.trim()).includes(currentFilters.grape_variety);
            if (!categoryMatch) return false;
        }
        
        return true; // Ha minden szűrőn átment
    });
}

/**
 * Renders the provided list of products into the container.
 * @param {Array} productsToRender - The array of products to display.
 */
async function renderProductList(productsToRender) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    let feedbackMap = {};
    try {
        // Fetch feedback for all products being rendered in one go
        const productHandles = productsToRender.map(p => safeGet(p, 'Product Handle')).filter(handle => handle !== 'N/A');
        if (productHandles.length > 0) {
            const { data: feedbackData, error } = await _supabase
                .from('product_feedback')
                .select('product_handle, approved, comment')
                .in('product_handle', productHandles);

            if (error) {
                console.error("Hiba a visszajelzések lekérdezésekor:", error);
            } else if (feedbackData) {
                feedbackData.forEach(fb => {
                    feedbackMap[fb.product_handle] = { approved: fb.approved, comment: fb.comment };
                });
            }
        }
    } catch (e) {
        console.error("Hiba történt a visszajelzések feldolgozása közben:", e);
    }

    // Render the products using the fetched feedback map
    if (productsToRender.length > 0) {
        // Pass feedbackMap to createProductCard
        productsContainer.innerHTML = productsToRender.map(product => createProductCard(product, feedbackMap)).join('');
    } else {
        productsContainer.innerHTML = '<div class=\"col-12\"><p class=\"text-center text-muted mt-5\">Nincs a szűrőnek megfelelő termék.</p></div>';
    }

    // Apply the currently selected view AFTER the products are in the DOM
    const viewPreference = localStorage.getItem('productViewPreference') || 'grid';
    if (viewPreference === 'list') {
        applyListView();
    } else {
        applyGridView();
    }
    
    // Re-attach product link handlers
    document.querySelectorAll('.product-link').forEach(link => {
        link.removeEventListener('click', handleProductLinkClick); // Prevent duplicates
        link.addEventListener('click', handleProductLinkClick);
    });
    
    // Add feedback event handlers
    setupFeedbackHandlers();
}

// Helper function to handle saving product feedback
function setupFeedbackHandlers() {
    // Handle save button clicks
    document.querySelectorAll('.save-feedback').forEach(button => {
        button.removeEventListener('click', handleSaveFeedbackClick); // Remove potential old listener
        button.addEventListener('click', handleSaveFeedbackClick);
    });

    // Handle checkbox changes
    document.querySelectorAll('.product-approve').forEach(checkbox => {
        checkbox.removeEventListener('change', handleApproveChange); // Remove potential old listener
        checkbox.addEventListener('change', handleApproveChange);
    });

    // Handle comment input changes (autosave when focus is lost)
    document.querySelectorAll('.product-comment').forEach(textarea => {
        textarea.removeEventListener('blur', handleCommentBlur); // Remove potential old listener
        textarea.addEventListener('blur', handleCommentBlur);
    });

    // Removed the initial setup part that relied on localStorage.
    // The state is now set correctly by createProductCard using data fetched in renderProductList.
}

// Extracted event handler functions to avoid anonymous functions issues with removeEventListener
async function handleSaveFeedbackClick(e) {
    const productId = e.currentTarget.getAttribute('data-product-id');
    await saveFeedback(productId);
}

async function handleApproveChange(e) {
    const productId = e.currentTarget.getAttribute('data-product-id');
    const commentField = document.getElementById(`comment-${productId}`);
    const checkbox = e.currentTarget; // Use currentTarget which is the checkbox

    // If approved, disable the comment field and clear it
    if (checkbox.checked && commentField) {
        commentField.disabled = true;
        commentField.value = '';
        commentField.placeholder = 'Jóváhagyva - nincs szükség megjegyzésre';
    } else if (commentField) {
        // If not approved, enable the comment field
        commentField.disabled = false;
        commentField.placeholder = 'Megjegyzés/hiba';
    }

    await saveFeedback(productId);
}

async function handleCommentBlur(e) {
    const productId = e.currentTarget.getAttribute('data-product-id');
    await saveFeedback(productId);
}

// Modosított saveFeedback: async és Supabase upsert használata
async function saveFeedback(productId) {
    const checkbox = document.getElementById(`approve-${productId}`);
    const textarea = document.getElementById(`comment-${productId}`);

    if (!checkbox || !textarea) return;

    // If checkbox is checked, ensure comment is cleared before saving
    if (checkbox.checked) {
        textarea.value = ''; // Clear value visually
        textarea.disabled = true; // Ensure it stays disabled
        textarea.placeholder = 'Jóváhagyva - nincs szükség megjegyzésre';
    } else {
         textarea.disabled = false; // Ensure enabled if unchecked
         textarea.placeholder = 'Megjegyzés/hiba';
    }

    const feedbackData = {
        product_handle: productId, // Az adatbázisban product_handle a mező neve, nem product_id
        approved: checkbox.checked,
        // Save null to the database if approved, otherwise save trimmed comment
        comment: checkbox.checked ? null : textarea.value.trim()
        // created_at automatikusan beállítódik az adatbázisban
    };

    // Save to Supabase using upsert
    const saveButton = document.querySelector(`.save-feedback[data-product-id="${productId}"]`);
    if (saveButton) {
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mentés...';
        saveButton.disabled = true;
    }

    try {
        const { error } = await _supabase
            .from('product_feedback')
            .upsert(feedbackData, { onConflict: 'product_handle' }); // A product_handle az elsődleges kulcs

        if (error) {
            console.error('Supabase hiba a mentés során:', error);
            if (saveButton) {
                 saveButton.innerHTML = '<i class="bi bi-x-circle"></i> Hiba';
                 saveButton.classList.remove('btn-primary', 'btn-success');
                 saveButton.classList.add('btn-danger');
            }
            
            // Lokális tárolás hiba esetén
            try {
                const timestamp = new Date().toISOString();
                const localFeedbackData = {
                    productId,
                    approved: checkbox.checked,
                    comment: checkbox.checked ? '' : textarea.value.trim(),
                    timestamp,
                    localOnly: true
                };
                localStorage.setItem(`product_feedback_${productId}`, JSON.stringify(localFeedbackData));
                
                if (saveButton) {
                    saveButton.innerHTML = '<i class="bi bi-save"></i> Lokálisan mentve';
                    saveButton.classList.remove('btn-danger', 'btn-primary');
                    saveButton.classList.add('btn-warning');
                    setTimeout(() => {
                        saveButton.innerHTML = '<i class="bi bi-save"></i> Mentés';
                        saveButton.classList.remove('btn-warning');
                        saveButton.classList.add('btn-primary');
                        saveButton.disabled = false;
                    }, 2000);
                }
            } catch (localError) {
                console.error('Lokális mentési hiba:', localError);
            }
        } else {
            // Visual feedback on success
            if (saveButton) {
                saveButton.innerHTML = '<i class="bi bi-check-lg"></i> Mentve';
                saveButton.classList.remove('btn-primary', 'btn-danger');
                saveButton.classList.add('btn-success');

                // Reset button after 2 seconds
                setTimeout(() => {
                    saveButton.innerHTML = '<i class="bi bi-save"></i> Mentés';
                    saveButton.classList.remove('btn-success');
                    saveButton.classList.add('btn-primary');
                    saveButton.disabled = false; // Re-enable button
                }, 2000);
            }
        }
    } catch (e) {
         console.error('Hiba a visszajelzés mentésekor:', e);
         if (saveButton) {
             saveButton.innerHTML = '<i class="bi bi-x-circle"></i> Hiba';
             saveButton.classList.remove('btn-primary', 'btn-success');
             saveButton.classList.add('btn-danger');
             
             // Lokális tárolás hiba esetén
             try {
                 const timestamp = new Date().toISOString();
                 const localFeedbackData = {
                     productId,
                     approved: checkbox.checked,
                     comment: checkbox.checked ? '' : textarea.value.trim(),
                     timestamp,
                     localOnly: true
                 };
                 localStorage.setItem(`product_feedback_${productId}`, JSON.stringify(localFeedbackData));
                 
                 setTimeout(() => {
                     saveButton.innerHTML = '<i class="bi bi-save"></i> Lokálisan mentve';
                     saveButton.classList.remove('btn-danger', 'btn-primary');
                     saveButton.classList.add('btn-warning');
                     
                     setTimeout(() => {
                         saveButton.innerHTML = '<i class="bi bi-save"></i> Mentés';
                         saveButton.classList.remove('btn-warning');
                         saveButton.classList.add('btn-primary');
                         saveButton.disabled = false;
                     }, 2000);
                 }, 1000);
             } catch (localError) {
                 console.error('Lokális mentési hiba:', localError);
                 setTimeout(() => {
                      saveButton.innerHTML = '<i class="bi bi-save"></i> Mentés';
                      saveButton.classList.remove('btn-danger');
                      saveButton.classList.add('btn-primary');
                      saveButton.disabled = false;
                  }, 2000);
             }
         }
    }
}

// --- Filter Event Handlers --- (Update calls inside these)

async function handleSearchChange(e) {
    currentFilters.search = e.target.value;
    currentPage = 1; // Reset to first page
    await updateProductDisplay(); // Call new function to update list and pagination
}

async function handleFilterChange(e) {
    const target = e.target;
    const filterName = target.id.replace('-select', '').replace('-', '_');
    currentFilters[filterName] = target.value;

    if (filterName === 'min_alcohol' || filterName === 'max_alcohol') {
        document.querySelectorAll('.alcohol-preset.active').forEach(btn => btn.classList.remove(ACTIVE_CLASS));
    }

    currentPage = 1; // Reset to first page
    await updateProductDisplay(); // Call new function
}

async function handleAlcoholPresetClick(e) {
    const min = e.target.getAttribute('data-min');
    const max = e.target.getAttribute('data-max');

    document.getElementById('min-alcohol').value = min;
    document.getElementById('max-alcohol').value = max;

    currentFilters.min_alcohol = min;
    currentFilters.max_alcohol = max;

    document.querySelectorAll('.alcohol-preset').forEach(btn => {
        btn.classList.remove(ACTIVE_CLASS);
    });
    e.target.classList.add(ACTIVE_CLASS);

    currentPage = 1; // Reset to first page
    await updateProductDisplay(); // Call new function
}

// --- Refactored function to update product list and pagination ---
async function updateProductDisplay() {
    // 1. Szűrő opciók frissítése (az *összes* termék alapján)
    updateFilterOptions(allProducts);

    // 2. Aktív szűrők renderelése
    renderActiveFilters();

    // 3. Szűrt termékek meghatározása és az aktuális oldal kiválasztása
    const filteredProducts = applyFilters(allProducts);
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    // Biztosítjuk, hogy a currentPage ne legyen nagyobb, mint a totalPages
    if (currentPage > totalPages) {
        currentPage = Math.max(1, totalPages);
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const productsForCurrentPage = filteredProducts.slice(startIndex, endIndex);

    // Logoljuk a szűrt termékeket és az oldalt
    console.log(`Frissítés: Összes szűrt: ${filteredProducts.length}, Oldal: ${currentPage}/${totalPages}, Megjelenítve: ${productsForCurrentPage.length}`);

    // 4. Termékek renderelése az aktuális oldalhoz
    await renderProductList(productsForCurrentPage); // Csak a listát frissítjük

    // 5. Lapozó renderelése
    renderPagination(totalPages, currentPage); // Csak a lapozót frissítjük

    // Itt már nem kell eseménykezelőket újra hozzáadni, mert a fő struktúra nem változott
}

// --- Initial View Rendering --- (Only called once per view load)

async function renderProductsAndFilters() {
    // Build the complete products view HTML string (including filter panel, buttons, containers)
    // Note: Added a placeholder for pagination below the products container
    appContent.innerHTML = `
        <div class="container-fluid">
           <!-- Szűrő Panel HTML -->
           <div class="row mb-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Termékek szűrése</h5>
                            <button class="btn btn-outline-secondary btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#filterCollapse" aria-expanded="true" aria-controls="filterCollapse">
                                <i class="bi bi-chevron-up"></i>
                            </button>
                        </div>
                        <div class="collapse show" id="filterCollapse">
                            <div class="card-body">
                                <div class="row">
                                    <!-- Keresés -->
                                    <div class="col-md-12 mb-3">
                                        <div class="input-group">
                                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                                            <input type="text" class="form-control" id="search-input" placeholder="Keresés terméknév, márka vagy leírás alapján..." value="${currentFilters.search}">
                                        </div>
                                    </div>
                                    
                                    <!-- Kategória -->
                                    <div class="col-md-4 mb-3">
                                        <label for="product-type-select" class="form-label">Kategória</label>
                                        <select class="form-select" id="product-type-select">
                                            <option value="">Minden kategória</option>
                                            ${createFilterOptions(distinctProductTypes, currentFilters.product_type)}
                                        </select>
                                    </div>
                                    
                                    <!-- Márka -->
                                    <div class="col-md-4 mb-3">
                                        <label for="brand-select" class="form-label">Márka</label>
                                        <select class="form-select" id="brand-select">
                                            <option value="">Minden márka</option>
                                            ${createFilterOptions(distinctBrands, currentFilters.brand)}
                                        </select>
                                    </div>
                                    
                                    <!-- Származási hely -->
                                    <div class="col-md-4 mb-3">
                                        <label for="origin-select" class="form-label">Származási hely</label>
                                        <select class="form-select" id="origin-select">
                                            <option value="">Minden származási hely</option>
                                            ${createFilterOptions(distinctOrigins, currentFilters.origin)}
                                        </select>
                                    </div>
                                    
                                    <!-- Évjárat -->
                                    <div class="col-md-4 mb-3">
                                        <label for="vintage-select" class="form-label">Évjárat</label>
                                        <select class="form-select" id="vintage-select">
                                            <option value="">Minden évjárat</option>
                                            ${createFilterOptions(distinctVintages, currentFilters.vintage)}
                                        </select>
                                    </div>
                                    
                                    <!-- Kiszerelés -->
                                    <div class="col-md-4 mb-3">
                                        <label for="volume-select" class="form-label">Kiszerelés</label>
                                        <select class="form-select" id="volume-select">
                                            <option value="">Minden kiszerelés</option>
                                            ${createFilterOptions(distinctVolumes, currentFilters.volume)}
                                        </select>
                                    </div>
                                    
                                    <!-- Ízjegyek -->
                                    <div class="col-md-4 mb-3">
                                        <label for="taste-select" class="form-label">Ízjegyek</label>
                                        <select class="form-select" id="taste-select">
                                            <option value="">Minden ízjegy</option>
                                            ${createFilterOptions(distinctTastes, currentFilters.taste)}
                                        </select>
                                    </div>
                                    
                                    <!-- Admin Kategória -->
                                    <div class="col-md-4 mb-3">
                                        <label for="category-select" class="form-label">Admin Kategória</label>
                                        <select class="form-select" id="category-select">
                                            <option value="">Minden admin kategória</option>
                                            ${createFilterOptions(distinctAdminCategories, currentFilters.category)}
                                        </select>
                                    </div>
                                    
                                    <!-- Érlelési mód -->
                                    <div class="col-md-4 mb-3">
                                        <label for="aging_method-select" class="form-label">Érlelési mód</label>
                                        <select class="form-select" id="aging_method-select">
                                            <option value="">Minden érlelési mód</option>
                                            ${createFilterOptions(distinctAgingMethods, currentFilters.aging_method)}
                                        </select>
                                    </div>
                                    
                                    <!-- Szőlőfajta -->
                                    <div class="col-md-4 mb-3">
                                        <label for="grape_variety-select" class="form-label">Szőlőfajta</label>
                                        <select class="form-select" id="grape_variety-select">
                                            <option value="">Minden szőlőfajta</option>
                                            ${createFilterOptions(distinctGrapeVarieties, currentFilters.grape_variety)}
                                        </select>
                                    </div>
                                    
                                    <!-- Alkoholtartalom -->
                                    <div class="col-md-12 mb-3">
                                        <label class="form-label">Alkoholtartalom (%)</label>
                                        <div class="row align-items-center">
                                            <div class="col-md-2">
                                                <div class="input-group">
                                                    <input type="number" class="form-control" id="min-alcohol" min="0" max="100" step="0.1" value="${currentFilters.min_alcohol}">
                                                    <span class="input-group-text">%</span>
                                                </div>
                                            </div>
                                            <div class="col-md-1 text-center">
                                                <span>-</span>
                                            </div>
                                            <div class="col-md-2">
                                                <div class="input-group">
                                                    <input type="number" class="form-control" id="max-alcohol" min="0" max="100" step="0.1" value="${currentFilters.max_alcohol}">
                                                    <span class="input-group-text">%</span>
                                                </div>
                                            </div>
                                            <div class="col-md-7">
                                                <div class="btn-group btn-group-sm alcohol-preset-buttons">
                                                    ${createAlcoholRangeButtons()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Aktív Szűrők Szekció -->
            <div class="row mb-3">
                <div class="col-12" id="active-filters-container" style="min-height: 40px;">
                    <!-- Ide kerülnek a dinamikusan generált aktív szűrők -->
                </div>
            </div>

            <!-- Nézet Váltás és Akciók -->
            <div class="row mb-3 align-items-center">
                <div class="col-md-6">
                    <button id="show-feedback-summary" class="btn btn-info text-white">
                        <i class="bi bi-clipboard-data"></i> Visszajelzések összesítése
                    </button>
                    <button id="export-feedback" class="btn btn-outline-secondary ms-2">
                        <i class="bi bi-download"></i> Exportálás
                    </button>
                </div>
                <div class="col-md-6 d-flex justify-content-end align-items-center">
                    <!-- Oldalméret választó -->
                    <div class="me-3">
                         <label for="page-size-select" class="form-label form-label-sm me-1">Oldalméret:</label>
                         <select id="page-size-select" class="form-select form-select-sm" style="width: auto; display: inline-block;">
                             <option value="20" ${pageSize === 20 ? 'selected' : ''}>20</option>
                             <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                             <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
                             <option value="200" ${pageSize === 200 ? 'selected' : ''}>200</option>
                         </select>
                    </div>
                    <!-- Nézet váltó -->
                    <div class="btn-group" role="group" aria-label="Nézet váltás">
                        <button type="button" class="btn btn-outline-secondary" id="grid-view-btn">
                            <i class="bi bi-grid-3x3-gap-fill"></i> Kártyás nézet
                        </button>
                        <button type="button" class="btn btn-outline-secondary" id="list-view-btn">
                            <i class="bi bi-list-ul"></i> Lista nézet
                        </button>
                    </div>
                </div>
            </div>

            <!-- Termékek konténer -->
            <div class="row" id="products-container">
                <!-- Termékek helye - renderProductList függvény tölti fel -->
            </div>

            <!-- Lapozó konténer -->
            <div class="row mt-4">
                 <div class="col-12 d-flex justify-content-center" id="pagination-container">
                     <!-- Lapozó gombok helye - renderPagination tölti fel -->
                 </div>
            </div>
        </div>
    `;

    // A HTML struktúra beállítása UTÁN futtatjuk a többi DOM manipulációt és eseménykezelő beállítást

    // 1. Szűrő opciók frissítése (az *összes* termék alapján, hogy a letiltott opciók látszódjanak)
    updateFilterOptions(allProducts);

    // 2. Aktív szűrők renderelése
    renderActiveFilters();

    // 3. Szűrt termékek meghatározása és az aktuális oldal kiválasztása
    const filteredProducts = applyFilters(allProducts);
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    // Biztosítjuk, hogy a currentPage ne legyen nagyobb, mint a totalPages
    if (currentPage > totalPages) {
        currentPage = Math.max(1, totalPages); // Visszaugrás az utolsó oldalra, vagy 1-re, ha nincs termék
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const productsForCurrentPage = filteredProducts.slice(startIndex, endIndex);

    // Logoljuk a szűrt termékeket és az oldalt
    console.log(`Összes szűrt termék: ${filteredProducts.length}, Oldal: ${currentPage}/${totalPages}, Megjelenítve: ${productsForCurrentPage.length}`);
    console.log('Aktuális oldal termékei:', productsForCurrentPage.slice(0, 5));

    // 4. Termékek renderelése az aktuális oldalhoz
    await renderProductList(productsForCurrentPage);

    // 5. Lapozó renderelése
    renderPagination(totalPages, currentPage);

    // 6. Eseménykezelők beállítása
    setupFilterHandlers(); // Filter handlers
    setupActionHandlers(); // Feedback, export, view toggle, page size handlers

    // 7. Kezdeti nézet beállítása
    const viewPreference = localStorage.getItem('productViewPreference') || 'grid';
    const gridBtn = document.getElementById('grid-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    if (gridBtn && listBtn) {
        if (viewPreference === 'list') {
            listBtn.classList.add(ACTIVE_CLASS);
            gridBtn.classList.remove(ACTIVE_CLASS);
            // applyListView(); // renderProductList már alkalmazza a nézetet
        } else {
            gridBtn.classList.add(ACTIVE_CLASS);
            listBtn.classList.remove(ACTIVE_CLASS);
            // applyGridView(); // renderProductList már alkalmazza a nézetet
        }
    }

    // 8. Központi eseménykezelő (filter remove, clear all, pagination)
    appContent.removeEventListener('click', handleAppContentClick); // Remove old listener first
    appContent.addEventListener('click', handleAppContentClick);
}

// Új függvény az akciógombok eseménykezelőinek beállításához
function setupActionHandlers() {
    const showFeedbackBtn = document.getElementById('show-feedback-summary');
    const exportFeedbackBtn = document.getElementById('export-feedback');
    const pageSizeSelect = document.getElementById('page-size-select');
    const gridViewButton = document.getElementById('grid-view-btn');
    const listViewButton = document.getElementById('list-view-btn');

    if (showFeedbackBtn) {
        showFeedbackBtn.removeEventListener('click', showFeedbackSummary);
        showFeedbackBtn.addEventListener('click', showFeedbackSummary);
    }
    if (exportFeedbackBtn) {
        exportFeedbackBtn.removeEventListener('click', exportFeedback);
        exportFeedbackBtn.addEventListener('click', exportFeedback);
    }
    if (pageSizeSelect) {
        pageSizeSelect.removeEventListener('change', handlePageSizeChange);
        pageSizeSelect.addEventListener('change', handlePageSizeChange);
    }
     // Nézetváltó gombok kezelése (korábban setupFilterHandlers-ben volt)
    if (gridViewButton) {
        gridViewButton.removeEventListener('click', handleGridViewClick);
        gridViewButton.addEventListener('click', handleGridViewClick);
    }
    if (listViewButton) {
        listViewButton.removeEventListener('click', handleListViewClick);
        listViewButton.addEventListener('click', handleListViewClick);
    }
}

// Új eseménykezelő az oldalméret változtatásához
async function handlePageSizeChange(e) {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1; // Vissza az első oldalra
    await updateProductDisplay(); // Call new function
}

// Nézetváltó eseménykezelők kiemelve
function handleGridViewClick(event) {
    const clickedButton = event.currentTarget;
    const otherButton = document.getElementById('list-view-btn');
    if (!clickedButton.classList.contains(ACTIVE_CLASS)) {
        clickedButton.classList.add(ACTIVE_CLASS);
        otherButton?.classList.remove(ACTIVE_CLASS);
        applyGridView();
        localStorage.setItem('productViewPreference', 'grid');
    }
}

function handleListViewClick(event) {
    const clickedButton = event.currentTarget;
    const otherButton = document.getElementById('grid-view-btn');
    if (!clickedButton.classList.contains(ACTIVE_CLASS)) {
        clickedButton.classList.add(ACTIVE_CLASS);
        otherButton?.classList.remove(ACTIVE_CLASS);
        applyListView();
        localStorage.setItem('productViewPreference', 'list');
    }
}


function renderActiveFilters() {
    const container = document.getElementById('active-filters-container');
    if (!container) return;
    
    let hasActiveFilters = false;
    let filterHTML = '';
    
    // Szűrők fordított kulcsainak létrehozása a megjelenítéshez
    const filterLabels = {
        search: 'Keresés',
        product_type: 'Kategória',
        brand: 'Márka',
        origin: 'Származási hely',
        vintage: 'Évjárat',
        volume: 'Kiszerelés',
        min_alcohol: 'Min Alkohol',
        max_alcohol: 'Max Alkohol',
        taste: 'Ízjegyek',
        category: 'Admin Kategória',
        aging_method: 'Érlelési mód',
        grape_variety: 'Szőlőfajta'
    };

    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && filterLabels[key] && !(key === 'min_alcohol' && value === '0') && !(key === 'max_alcohol' && value === '100')) {
            hasActiveFilters = true;
            let displayValue = value;
            if (key === 'min_alcohol' || key === 'max_alcohol') {
                displayValue += '%';
            }
            filterHTML += `
                <span class="badge bg-light text-dark rounded-pill p-2 px-3 m-1 d-inline-flex align-items-center">
                    ${filterLabels[key]}: <strong>${displayValue}</strong>
                    <button type="button" class="btn-close ms-2 remove-filter-btn" aria-label="Close" 
                            data-filter-key="${key}"></button> 
                </span>
            `;
        }
    });
    
    if (hasActiveFilters) {
        container.innerHTML = `
            <div class="col-12">
                <span class="text-muted me-2"><i class="bi bi-funnel-fill"></i> Aktív szűrők:</span>
                ${filterHTML}
                <button class="btn btn-sm btn-outline-danger ms-2" id="clear-all-filters-btn">
                    <i class="bi bi-x-lg"></i> Összes törlése
                </button>
            </div>
        `;
    } else {
        container.innerHTML = ''; // Ha nincs aktív szűrő, ürítsük ki a konténert
    }

    // Eseménykezelők eltávolítva innen
    // const activeFiltersContainer = document.getElementById('active-filters-container');
    // if (activeFiltersContainer) {
    //     activeFiltersContainer.removeEventListener('click', handleRemoveFilterClick);
    //     activeFiltersContainer.addEventListener('click', handleRemoveFilterClick);
    // }
    // const clearAllButton = container.querySelector('.btn-outline-danger');
    // if (clearAllButton) {
    //     clearAllButton.removeEventListener('click', clearAllFilters);
    //     clearAllButton.addEventListener('click', clearAllFilters);
    // }
}

// Ezt a függvényt most a központi eseménykezelő váltja fel
// function handleRemoveFilterClick(event) {
//     if (event.target.classList.contains('remove-filter-btn')) {
//         const filterKey = event.target.getAttribute('data-filter-key');
//         if (filterKey) {
//             removeFilter(filterKey);
//         }
//     }
// }

async function removeFilter(filterKey) { // Made async
    // Alapértékek a törléshez
    const defaultValues = {
        search: '',
        product_type: '',
        brand: '',
        origin: '',
        vintage: '',
        volume: '',
        min_alcohol: '0',
        max_alcohol: '100',
        taste: '',
        category: '',
        aging_method: '',
        grape_variety: ''
    };
    
    currentFilters[filterKey] = defaultValues[filterKey];
    
    // Frissítjük a kapcsolódó UI elemet
    const elementId = filterKey.replace('_', '-');
    const inputElement = document.getElementById(elementId === 'search' ? 'search-input' : `${elementId}-select`) || 
                       document.getElementById(elementId);
    if (inputElement) {
        inputElement.value = defaultValues[filterKey];
    }
    
    // Ha alkohol preset gombot törlünk, töröljük az aktív állapotot
    if (filterKey === 'min_alcohol' || filterKey === 'max_alcohol') {
        document.querySelectorAll('.alcohol-preset.active').forEach(btn => btn.classList.remove(ACTIVE_CLASS));
        // Explicit beállítjuk a min/max alkohol inputokat is
        document.getElementById('min-alcohol').value = defaultValues.min_alcohol;
        document.getElementById('max-alcohol').value = defaultValues.max_alcohol;
    }

    // Lapozás visszaállítása az 1. oldalra
    currentPage = 1;

    // Újrarendereljük a teljes nézetet
    await renderProductsAndFilters(); // Added await
}

async function clearAllFilters() { // Made async
    // Reset all filters in currentFilters object
    const defaultValues = {
        search: '', product_type: '', brand: '', origin: '', vintage: '', volume: '',
        min_alcohol: '0', max_alcohol: '100', taste: '', category: '', aging_method: '', grape_variety: ''
    };
    // Create a new object with default values
    Object.keys(currentFilters).forEach(key => {
        currentFilters[key] = defaultValues[key];
    });

    // Reset UI elements (dropdowns, inputs)
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const minAlcoholInput = document.getElementById('min-alcohol');
    if (minAlcoholInput) minAlcoholInput.value = '0'; // Külön ellenőrzés és értékadás

    const maxAlcoholInput = document.getElementById('max-alcohol');
    if (maxAlcoholInput) maxAlcoholInput.value = '100'; // Külön ellenőrzés és értékadás

    document.querySelectorAll('.alcohol-preset.active').forEach(btn => btn.classList.remove(ACTIVE_CLASS));
    document.querySelectorAll('select.form-select').forEach(select => {
        if (select.id !== 'page-size-select') { // Don't reset page size select
           select.value = '';
        }
    });

    // Lapozás visszaállítása az 1. oldalra
    currentPage = 1;

    // Újrarendereljük a teljes nézetet
    await renderProductsAndFilters(); // Added await
}

async function loadProductDetail(productId) {
    setActiveNav(null); // No specific nav item is active on detail view
    appContent.innerHTML = '<p class="text-center py-5"><i class="bi bi-hourglass-split fs-1 d-block mb-3"></i>Termék betöltése...</p>';
    
    try {
        // Javított lekérdezés: `normalized_product_view`-ból kérdezi le az adatokat
        // Győződj meg róla, hogy a Supabase nézet/tábla neve helyes és tartalmazza ezeket az oszlopokat!
        const { data: product, error } = await _supabase
            .from('normalized_product_view') // Updated source view/table
            .select(`
                "Product Handle", Title, SKU, Brand, Vendor, 
                "Product Type (Custom)", "Származási hely", Kiszerelés, 
                Alkoholtartalom, normalized_grape_varieties, 
                aging_method_category, dryness_level, Ízjegyek, 
                Évjárat, Flavor, Description, "Primary Image"
            `)
            .eq('Product Handle', productId)
            .single();

        if (error) throw error;
        if (!product) throw new Error("A termék nem található.");

        // Render product detail page
        renderProductDetail(product); // A renderProductDetail már kezeli ezeket a mezőneveket

    } catch (error) {
        console.error('Hiba a termék betöltése közben:', error);
        appContent.innerHTML = `
            <div class="container">
                <div class="alert alert-danger my-5">
                    <h4>Hiba történt a termék betöltése közben</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-outline-primary" onclick="document.getElementById('nav-products').click()">
                        <i class="bi bi-arrow-left"></i> Vissza a termékekhez
                    </button>
                </div>
            </div>
        `;
    }
}

function renderProductDetail(product) {
    // Alkohol kategória meghatározása
    let alcoholCategory = 'N/A';
    let alcoholCategoryClass = '';
    if (product.Alkoholtartalom && product.Alkoholtartalom !== 'N/A') {
        const alcoholValue = parseFloat(product.Alkoholtartalom);
        if (!isNaN(alcoholValue)) {
            if (alcoholValue >= 0 && alcoholValue <= 5) {
                alcoholCategory = 'Alacsony';
                alcoholCategoryClass = 'text-success';
            } else if (alcoholValue > 5 && alcoholValue <= 10) {
                alcoholCategory = 'Mérsékelt';
                alcoholCategoryClass = 'text-info';
            } else if (alcoholValue > 10 && alcoholValue <= 20) {
                alcoholCategory = 'Közepes';
                alcoholCategoryClass = 'text-warning';
            } else if (alcoholValue > 20 && alcoholValue <= 40) {
                alcoholCategory = 'Magas';
                alcoholCategoryClass = 'text-dark fw-bold';
            } else if (alcoholValue > 40) {
                alcoholCategory = 'Nagyon magas';
                alcoholCategoryClass = 'text-danger';
            }
        }
    }
    
    // Build product detail view based on product_detail.html
    appContent.innerHTML = `
        <div class="container">
            <div class="row mb-4">
                <div class="col-md-12">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="#" onclick="event.preventDefault(); document.getElementById('nav-products').click()">Termékek</a></li>
                            ${product["Product Type (Custom)"] ? 
                              `<li class="breadcrumb-item"><a href="#" onclick="event.preventDefault(); currentFilters.product_type='${product["Product Type (Custom)"]}'; document.getElementById('nav-products').click()">${product["Product Type (Custom)"]}</a></li>` : ''}
                            <li class="breadcrumb-item active" aria-current="page">${product.Title}</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div class="row">
                <div class="col-md-5">
                    ${product["Primary Image"] ? 
                      `<img src="${product["Primary Image"]}" class="img-fluid rounded" alt="${product.Title}">` :
                      `<div class="bg-light rounded d-flex align-items-center justify-content-center" style="height: 400px;">
                           <span class="text-muted">Nincs kép</span>
                       </div>`}
                </div>

                <div class="col-md-7">
                    <h1>${product.Title}</h1>

                    <style>
                        .product-table th {
                            background-color: #f0f0f0;
                            color: #282828;
                            width: 30%;
                            font-weight: 500;
                        }
                        .product-table td {
                            background-color: #ffffff;
                        }
                        .grape-tag, .aging-tag, .dryness-tag {
                            display: inline-block;
                            padding: 0.25rem 0.5rem;
                            margin: 0.1rem;
                            border-radius: 0.25rem;
                            background-color: #f8f9fa;
                            border: 1px solid #dee2e6;
                            font-size: 0.875rem;
                        }
                        .grape-tag {
                            background-color: #e9f7ef;
                            border-color: #c5e1d0;
                            color: #1e7e34;
                        }
                        .aging-tag {
                            background-color: #e8f4f8;
                            border-color: #c6dbe7;
                            color: #0c5460;
                        }
                        .dryness-tag {
                            background-color: #f8f0e8;
                            border-color: #e7d2c6;
                            color: #856404;
                        }
                    </style>
                    <table class="table table-striped product-table">
                        <tbody>
                            ${product.SKU ? `<tr><th>SKU</th><td><strong>${product.SKU}</strong></td></tr>` : ''}
                            ${product.Brand ? `<tr><th>Márka</th><td>${product.Brand}</td></tr>` : ''}
                            ${product.Vendor ? `<tr><th>Gyártó</th><td>${product.Vendor}</td></tr>` : ''}
                            ${product["Product Type (Custom)"] ? `<tr><th>Kategória</th><td>${product["Product Type (Custom)"]}</td></tr>` : ''}
                            ${product["Származási hely"] ? `<tr><th>Származási hely</th><td>${product["Származási hely"]}</td></tr>` : ''}
                            ${product.Kiszerelés ? `<tr><th>Kiszerelés</th><td>${product.Kiszerelés}</td></tr>` : ''}
                            ${product.Alkoholtartalom ? `<tr><th>Alkoholtartalom</th><td>${product.Alkoholtartalom}%</td></tr>` : ''}
                            ${alcoholCategory !== 'N/A' ? `<tr><th>Alkohol kategória</th><td class="${alcoholCategoryClass}">${alcoholCategory}</td></tr>` : ''}
                            
                            ${product.Szőlőfatja || product.normalized_grape_varieties ? 
                              `<tr>
                                <th>Szőlőfajták</th>
                                <td>${product.normalized_grape_varieties || product.Szőlőfatja}</td>
                              </tr>` : ''
                            }
                            
                            ${product["Érlelési mód"] || product.aging_method_category ? 
                              `<tr>
                                <th>Érlelési mód</th>
                                <td>${product.aging_method_category || product["Érlelési mód"]}</td>
                              </tr>` : ''
                            }

                            ${product.dryness_level ? 
                              `<tr>
                                <th>Szárazsági fok</th>
                                <td><span class="dryness-tag">${product.dryness_level}</span></td>
                              </tr>` : ''
                            }
                            
                            ${product.Ízjegyek ? `<tr><th>Ízjegyek</th><td>${product.Ízjegyek}</td></tr>` : ''}
                            ${product.Évjárat ? `<tr><th>Évjárat</th><td>${product.Évjárat}</td></tr>` : ''}
                            ${product.Flavor ? `<tr><th>Íz</th><td>${product.Flavor}</td></tr>` : ''}
                        </tbody>
                    </table>

                    <div class="mt-4">
                        <h4>Termékleírás</h4>
                        <div>${product.Description || 'Nincs termékleírás.'}</div>
                    </div>
                    
                    <div class="mt-4">
                        <button class="btn btn-primary" onclick="document.getElementById('nav-products').click()">
                            <i class="bi bi-arrow-left"></i> Vissza a termékekhez
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- HTML Generáló Függvények (Összehasonlítás) ---

function renderCompareTable(stats, shopifyProducts, bcProducts, shopifyLastUpdated, bcLastUpdated) {
    // Shows ALL products from both sources side-by-side, no matching
    
    // Formázd a dátumokat
    const formatDate = (date) => {
        return date.toLocaleString('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };
    
    // Használjuk az átadott dátumokat, ha nincsenek, akkor az aktuális dátumot
    const shopifyFormattedDate = shopifyLastUpdated ? formatDate(shopifyLastUpdated) : formatDate(new Date());
    const bcFormattedDate = bcLastUpdated ? formatDate(bcLastUpdated) : formatDate(new Date());
    
    // Define separate headers for each table
    const shopifyTableHeader = `
        <tr>
            <th style="min-width: 120px;">SKU</th>
            <th style="min-width: 300px;">Terméknév</th>
            <th style="min-width: 150px;">Márka</th>
            <th style="min-width: 150px;">Típus</th>
            <th style="min-width: 150px;">Származás</th>
            <th style="min-width: 100px;">Kiszerelés</th>
            <th style="min-width: 120px;">Alkohol %</th>
            <th style="min-width: 80px;">Évjárat</th>
        </tr>
    `;
    
    // Updated header for the new 'bc' table structure
    const bcTableHeader = `
        <tr>
            <th style="min-width: 120px;">Szám</th>
            <th style="min-width: 300px;">Megnevezés</th>
            <th style="min-width: 150px;">Termékkategória</th>
            <th style="min-width: 150px;">Terület</th>
            <th style="min-width: 100px;">Kiszerelés</th>
            <th style="min-width: 80px;">Évjárat</th>
        </tr>
    `;
    
    // Shopify termékek sorai hiányos adatok kiemelésének lehetőségével
    const shopifyRows = shopifyProducts.map(sp => {
        // Debug: console.log a Shopify objektumra
        console.log("Shopify item fields:", Object.keys(sp));
        
        // Elmentjük az értékeket változókba
        const productHandle = safeGet(sp, 'Product Handle');
        const spSKU = safeGet(sp, 'SKU');
        const spTitle = safeGet(sp, 'Title');
        const spBrand = safeGet(sp, 'Brand');
        const spType = safeGet(sp, 'Product Type (Custom)');
        const spOrigin = safeGet(sp, 'Származási hely');
        const spVolume = safeGet(sp, 'Kiszerelés');
        const spAlcohol = safeGet(sp, 'Alkoholtartalom');
        const spVintage = safeGet(sp, 'Évjárat');

        // Alkohol kategória kód eltávolítása, ez a rész már nem szükséges
        
        const titleLink = productHandle !== 'N/A' ? 
            `<a href="#" class="product-detail-link" data-product-id="${productHandle}">${spTitle}</a>` : 
            spTitle;
            
        // Ellenőrizzük, hogy az adott mező hiányzik-e, de 0 értéket ne tekintsünk hiányzónak
        const isSKUEmpty = spSKU === 'N/A';
        const isTitleEmpty = spTitle === 'N/A';
        const isBrandEmpty = spBrand === 'N/A';
        const isTypeEmpty = spType === 'N/A';
        const isOriginEmpty = spOrigin === 'N/A';
        // Speciális ellenőrzés a 0 értékekre
        const isVolumeEmpty = spVolume === 'N/A' && spVolume !== 0 && spVolume !== '0';
        const isAlcoholEmpty = spAlcohol === 'N/A' && spAlcohol !== 0 && spAlcohol !== '0';
        const isVintageEmpty = spVintage === 'N/A' && spVintage !== 0 && spVintage !== '0';
        
        // Debug: console.log az üres cellákról
        console.log("Shopify empty cells:", {
            isSKUEmpty, isTitleEmpty, isBrandEmpty, 
            isTypeEmpty, isOriginEmpty, isVolumeEmpty, 
            isAlcoholEmpty, isVintageEmpty,
            spVolume, spAlcohol, spVintage
        });

        return `
            <tr>
                <td class="${isSKUEmpty ? 'missing-data' : ''}">${spSKU}</td>
                <td class="${isTitleEmpty ? 'missing-data' : ''}">${titleLink}</td>
                <td class="${isBrandEmpty ? 'missing-data' : ''}">${spBrand}</td>
                <td class="${isTypeEmpty ? 'missing-data' : ''}">${spType}</td>
                <td class="${isOriginEmpty ? 'missing-data' : ''}">${spOrigin}</td>
                <td class="${isVolumeEmpty ? 'missing-data' : ''}">${spVolume}</td>
                <td class="${isAlcoholEmpty ? 'missing-data' : ''}">${spAlcohol}</td>
                <td class="${isVintageEmpty ? 'missing-data' : ''}">${spVintage}</td>
            </tr>
        `;
    }).join('');

    // BC termékek sorai hiányos adatok kiemelésének lehetőségével
    const bcRows = bcProducts.map(bc => { 
        // Debug: console.log a BC objektumra, hogy ellenőrizzük a mezők létezését
        console.log("BC item fields:", Object.keys(bc));
        
        // Ellenőrizzük, hogy az adott mező hiányzik-e, de 0 értéket ne tekintsünk hiányzónak
        // A 0 érték a kiszerelésnél is lehet valid adat, ezért külön kezelést igényel
        const bcSzam = safeGet(bc, 'Szám');
        const bcMegnevezes = safeGet(bc, 'Megnevezés');
        const bcTermekkategoria = safeGet(bc, 'Termékkategória');
        const bcTerulet = safeGet(bc, 'Terület');
        const bcKiszereles = safeGet(bc, 'Kiszerelés');
        const bcEvjarat = safeGet(bc, 'Évjárat');
        
        const isNumberEmpty = bcSzam === 'N/A';
        const isNameEmpty = bcMegnevezes === 'N/A';
        const isCategoryEmpty = bcTermekkategoria === 'N/A';
        const isAreaEmpty = bcTerulet === 'N/A';
        // Speciális ellenőrzés a kiszerelésnél - ha 0 vagy "0", az is valid
        const isVolumeEmpty = bcKiszereles === 'N/A' && bcKiszereles !== 0 && bcKiszereles !== '0';
        const isVintageEmpty = bcEvjarat === 'N/A' && bcEvjarat !== 0 && bcEvjarat !== '0';
        
        // Debug: console.log az üres cellákról
        console.log("BC empty cells:", {
            isNumberEmpty, isNameEmpty, isCategoryEmpty, 
            isAreaEmpty, isVolumeEmpty, isVintageEmpty,
            bcKiszereles, bcEvjarat
        });
        
        return `
            <tr>
                <td class="${isNumberEmpty ? 'missing-data' : ''}">${bcSzam}</td>
                <td class="${isNameEmpty ? 'missing-data' : ''}">${bcMegnevezes}</td>
                <td class="${isCategoryEmpty ? 'missing-data' : ''}">${bcTermekkategoria}</td>
                <td class="${isAreaEmpty ? 'missing-data' : ''}">${bcTerulet}</td>
                <td class="${isVolumeEmpty ? 'missing-data' : ''}">${bcKiszereles}</td>
                <td class="${isVintageEmpty ? 'missing-data' : ''}">${bcEvjarat}</td>
            </tr>
        `;
    }).join('');

    // CSS style a hiányzó adatok jelöléséhez
    const missingDataStyle = `
        <style>
            .missing-data-highlight .missing-data {
                background-color: rgba(255, 0, 0, 0.15) !important;
            }
            /* Felülírjuk a striped table stílusát is, hogy a hiányzó cellák láthatóak legyenek */
            .missing-data-highlight .table-striped > tbody > tr:nth-of-type(odd) > .missing-data,
            .missing-data-highlight .table-striped > tbody > tr:nth-of-type(even) > .missing-data {
                background-color: rgba(255, 0, 0, 0.15) !important;
            }
            .form-switch.highlight-switch {
                display: flex;
                align-items: center;
                margin-top: 15px;
            }
            .form-switch.highlight-switch .form-check-input {
                margin-right: 10px;
                cursor: pointer;
            }
            .form-check-label {
                cursor: pointer;
            }
        </style>
    `;

    // Main HTML structure - uses the updated bcTableHeader
    appContent.innerHTML = `
        ${missingDataStyle}
        <div class="stats-container container-fluid">
             <div class="container-fluid"> <!-- Changed to container-fluid for full width -->
                 <div class="row text-center">
                    <div class="col-md-4">
                        <h5>Shopify Termékek</h5>
                        <h2>${stats.totalShopify}</h2>
                    </div>
                    <div class="col-md-4">
                        <h5>Business Central Termékek</h5>
                        <h2>${stats.totalBC}</h2>
                    </div>
                    <div class="col-md-4">
                        <h5>Adatteljesség</h5>
                        <h2>
                            <span class="text-primary" title="Shopify adatteljesség">${stats.shopifyCompleteness}%</span> / 
                            <span class="text-success" title="BC adatteljesség">${stats.bcCompleteness}%</span>
                        </h2>
                        <small class="text-muted">Shopify / Business Central</small>
                    </div>
                 </div>
             </div>
        </div>

        <div class="container-fluid"> <!-- Added new container-fluid for all content below stats -->
            <!-- Hiányos adatok kiemelésének kapcsolója és Fullscreen gomb -->
            <div class="row mb-3">
                <div class="col-md-6 d-flex">
                    <button id="fullscreen-btn" class="btn btn-sm btn-primary me-2">
                        <i class="bi bi-arrows-fullscreen me-1"></i>Teljes képernyő
                    </button>
                    <!-- Nézetváltó gombok eltávolítva
                    <div class="view-toggle-buttons d-none d-md-flex">
                        <button class="btn btn-sm active" data-view="split">50-50%</button>
                        <button class="btn btn-sm" data-view="shopify">Shopify fókusz</button>
                        <button class="btn btn-sm" data-view="bc">BC fókusz</button>
                    </div>
                    -->
                </div>
                <div class="col-md-6 d-flex justify-content-end">
                    <div class="form-check form-switch highlight-switch">
                        <input class="form-check-input" type="checkbox" id="highlight-missing-data" role="switch" checked>
                        <label class="form-check-label" for="highlight-missing-data">Hiányzó adatok kiemelése</label>
                    </div>
                </div>
            </div>
            
            <div class="row" id="tables-container"> 
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header compare-card-header d-flex justify-content-between align-items-center">
                             <h3>
                                <svg width="1.2em" height="1.2em" viewBox="0 0 109.5 124.5" style="vertical-align: -0.125em; margin-right: 0.25em; fill: #95BF47;">
                                    <g>
                                        <path d="M74.7,14.8c0,0-1.4,0.4-3.7,1.1c-0.4-1.3-1-2.8-1.8-4.4c-2.6-5-6.5-7.7-11.1-7.7c0,0,0,0,0,0c-0.3,0-0.6,0-1,0.1
                                            c-0.1-0.2-0.3-0.3-0.4-0.5c-2-2.2-4.6-3.2-7.7-3.1c-6,0.2-12,4.5-16.8,12.2c-3.4,5.4-6,12.2-6.7,17.5c-6.9,2.1-11.7,3.6-11.8,3.7
                                            c-3.5,1.1-3.6,1.2-4,4.5C9.1,40.7,0,111.2,0,111.2l75.6,13.1V14.6C75.2,14.7,74.9,14.7,74.7,14.8z M57.2,20.2
                                            c-4,1.2-8.4,2.6-12.7,3.9c1.2-4.7,3.6-9.4,6.4-12.5c1.1-1.1,2.6-2.4,4.3-3.2C56.9,12,57.3,16.9,57.2,20.2z M49.1,4.3
                                            c1.4,0,2.6,0.3,3.6,0.9c-1.6,0.8-3.2,2.1-4.7,3.6c-3.8,4.1-6.7,10.5-7.9,16.6c-3.6,1.1-7.2,2.2-10.5,3.2
                                            C31.7,19.1,39.8,4.6,49.1,4.3z M37.4,59.3c0.4,6.4,17.3,7.8,18.3,22.9c0.7,11.9-6.3,20-16.4,20.6c-12.2,0.8-18.9-6.4-18.9-6.4
                                            l2.6-11c0,0,6.7,5.1,12.1,4.7c3.5-0.2,4.8-3.1,4.7-5.1c-0.5-8.4-14.3-7.9-15.2-21.7C23.8,51.8,31.4,40.1,48.2,39
                                            c6.5-0.4,9.8,1.2,9.8,1.2l-3.8,14.4c0,0-4.3-2-9.4-1.6C37.4,53.5,37.3,58.2,37.4,59.3z M61.2,19c0-3-0.4-7.3-1.8-10.9
                                            c4.6,0.9,6.8,6,7.8,9.1C65.4,17.7,63.4,18.3,61.2,19z"/>
                                        <path d="M78.1,123.9l31.4-7.8c0,0-13.5-91.3-13.6-91.9c-0.1-0.6-0.6-1-1.1-1c-0.5,0-9.3-0.2-9.3-0.2s-5.4-5.2-7.4-7.2V123.9z"/>
                                    </g>
                                </svg>
                                Shopify Termékek (${stats.totalShopify})
                             </h3>
                             <span class="text-muted"><small>Frissítve: ${shopifyFormattedDate}</small></span>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped table-sm mb-0" id="shopify-table">
                                <thead>${shopifyTableHeader}</thead>
                                <tbody>${shopifyRows.length > 0 ? shopifyRows : '<tr><td colspan="8">Nincsenek termékek.</td></tr>'}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header compare-card-header d-flex justify-content-between align-items-center">
                            <h3>BC Termékek (${stats.totalBC})</h3>
                            <span class="text-muted"><small>Frissítve: ${bcFormattedDate}</small></span>
                        </div>
                         <div class="table-responsive">
                            <table class="table table-striped table-sm mb-0" id="bc-table">
                                <thead>${bcTableHeader}</thead>
                                <tbody>${bcRows.length > 0 ? bcRows : `<tr><td colspan="6">Nincsenek BC termékek.</td></tr>`}</tbody>
                             </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fullscreen nézet -->
        <div id="fullscreen-container" class="fullscreen-mode d-none">
            <div class="fullscreen-header">
                <h3>Összehasonlító nézet (Teljes képernyő)</h3>
                <div class="d-flex align-items-center">
                     <!-- Nézetváltó gombok eltávolítva
                    <div class="view-toggle-buttons me-3">
                        <button class="btn btn-sm active" data-fs-view="split">50-50%</button>
                        <button class="btn btn-sm" data-fs-view="shopify">Shopify fókusz</button>
                        <button class="btn btn-sm" data-fs-view="bc">BC fókusz</button>
                    </div>
                    -->
                    <div class="form-check form-switch me-3">
                        <input class="form-check-input" type="checkbox" id="fs-highlight-missing-data" role="switch" checked>
                        <label class="form-check-label text-white" for="fs-highlight-missing-data">Hiányzó adatok</label>
                    </div>
                    <button id="exit-fullscreen-btn" class="btn btn-outline-light btn-sm">
                        <i class="bi bi-fullscreen-exit me-1"></i>Kilépés
                    </button>
                </div>
            </div>
            <div class="fullscreen-content">
                <div class="fullscreen-table-container" id="fs-shopify-container">
                    <table class="table table-striped table-sm" id="fs-shopify-table">
                        <thead>${shopifyTableHeader}</thead>
                        <tbody>${shopifyRows.length > 0 ? shopifyRows : '<tr><td colspan="8">Nincsenek termékek.</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="fullscreen-table-container" id="fs-bc-container">
                    <table class="table table-striped table-sm" id="fs-bc-table">
                        <thead>${bcTableHeader}</thead>
                        <tbody>${bcRows.length > 0 ? bcRows : `<tr><td colspan="6">Nincsenek BC termékek.</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Attach event listeners for the newly created product detail links
    appContent.querySelectorAll('.product-detail-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                loadProductDetail(productId);
            }
        });
    });

    // Hiányos adatok kiemelésére szolgáló kapcsoló eseménykezelője
    const highlightMissingDataCheckbox = document.getElementById('highlight-missing-data');
    if (highlightMissingDataCheckbox) {
        // Mivel alapértelmezetten be van kapcsolva, aktiváljuk a kiemelést betöltéskor
        const tablesContainer = document.getElementById('tables-container');
        if (tablesContainer && highlightMissingDataCheckbox.checked) {
            tablesContainer.classList.add('missing-data-highlight');
        }
        
        // Eseménykezelő a kapcsolóhoz
        highlightMissingDataCheckbox.addEventListener('change', function(e) {
            const tablesContainer = document.getElementById('tables-container');
            if (this.checked) {
                tablesContainer.classList.add('missing-data-highlight');
            } else {
                tablesContainer.classList.remove('missing-data-highlight');
            }
        });
    }

    // Fullscreen mód eseménykezelői
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
    const fullscreenContainer = document.getElementById('fullscreen-container');
    const fsHighlightCheckbox = document.getElementById('fs-highlight-missing-data');

    if (fullscreenBtn && exitFullscreenBtn && fullscreenContainer) {
        // Teljes képernyő indítása
        fullscreenBtn.addEventListener('click', function() {
            // Először eltávolítjuk a d-none osztályt
            fullscreenContainer.classList.remove('d-none');
            document.body.style.overflow = 'hidden';
            
            // Szinkronizáljuk a hiányzó adatok kiemelése állapotot
            if (highlightMissingDataCheckbox && fsHighlightCheckbox) {
                fsHighlightCheckbox.checked = highlightMissingDataCheckbox.checked;
                if (fsHighlightCheckbox.checked) {
                    fullscreenContainer.classList.add('missing-data-highlight');
                }
            }

            // Táblázatok szinkronizált görgetésének beállítása
            syncScrolling();
            
            // Explicit frissítés kényszerítése a konténeren
            fullscreenContainer.style.display = 'none';
            fullscreenContainer.offsetHeight; // Trigger reflow
            fullscreenContainer.style.display = '';
            
            // Kényszerített kezdeti újrarendereléssel állítjuk be a táblázatok méretét
            setTimeout(() => {
                // Explicit beállítjuk mindkét konténer méretét alaphelyzetbe
                const shopifyContainer = document.getElementById('fs-shopify-container');
                const bcContainer = document.getElementById('fs-bc-container');
                if (shopifyContainer && bcContainer) {
                    shopifyContainer.style.flex = '1 1 50%';
                    bcContainer.style.flex = '1 1 50%';
                }
                
                // Aktiváljuk a "split" gombot
                document.querySelectorAll('.view-toggle-buttons button[data-fs-view]').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-fs-view') === 'split') {
                        btn.classList.add('active');
                    }
                });
                
                // Ha támogatott, valódi fullscreent is kérünk
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log("Fullscreen kérés nem sikerült: ", err);
                    });
                }
            }, 100);
        });
        
        // Kilépés teljes képernyőből
        exitFullscreenBtn.addEventListener('click', function() {
            // Először kilépünk a fullscreenből, ha aktív
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.log("Fullscreen kilépés nem sikerült: ", err);
                });
            }
            
            // Azonnali vizuális visszajelzés
            fullscreenContainer.style.opacity = '0.5';
            
            // Kis késleltetéssel kapcsoljuk ki teljesen
            setTimeout(() => {
                fullscreenContainer.classList.add('d-none');
                document.body.style.overflow = '';
                fullscreenContainer.style.opacity = '1';
            }, 100);
        });
        
        // Fullscreen hiányzó adatok kapcsoló
        if (fsHighlightCheckbox) {
            fsHighlightCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    fullscreenContainer.classList.add('missing-data-highlight');
                } else {
                    fullscreenContainer.classList.remove('missing-data-highlight');
                }
            });
        }
        
        // Normál nézet nézetváltók
        document.querySelectorAll('.view-toggle-buttons button[data-view]').forEach(btn => {
            btn.addEventListener('click', function() {
                // Minden gombot inaktívvá teszünk
                document.querySelectorAll('.view-toggle-buttons button[data-view]').forEach(b => {
                    b.classList.remove('active');
                });
                
                // A kiválasztott gombot aktívvá tesszük
                this.classList.add('active');
                
                // Beállítjuk a nézetet a data-view attribútum alapján
                const view = this.getAttribute('data-view');
                const tablesContainer = document.getElementById('tables-container');
                
                if (tablesContainer) {
                    const shopifyCol = tablesContainer.querySelector('.col-lg-6:first-child');
                    const bcCol = tablesContainer.querySelector('.col-lg-6:last-child');
                    
                    if (shopifyCol && bcCol) {
                        // Eltávolítjuk az összes col-lg-* osztályt mindkét elemről
                        shopifyCol.classList.forEach(className => {
                            if (className.startsWith('col-lg-')) {
                                shopifyCol.classList.remove(className);
                            }
                        });
                        
                        bcCol.classList.forEach(className => {
                            if (className.startsWith('col-lg-')) {
                                bcCol.classList.remove(className);
                            }
                        });
                        
                        // Beállítjuk a kiválasztott nézetet
                        if (view === 'split') {
                            shopifyCol.classList.add('col-lg-6');
                            bcCol.classList.add('col-lg-6');
                        } else if (view === 'shopify') {
                            shopifyCol.classList.add('col-lg-8');
                            bcCol.classList.add('col-lg-4');
                        } else if (view === 'bc') {
                            shopifyCol.classList.add('col-lg-4');
                            bcCol.classList.add('col-lg-8');
                        }
                        
                        // Győződjünk meg, hogy a mb-4 ott van
                        if (!shopifyCol.classList.contains('mb-4')) {
                            shopifyCol.classList.add('mb-4');
                        }
                        
                        if (!bcCol.classList.contains('mb-4')) {
                            bcCol.classList.add('mb-4');
                        }
                        
                        console.log('Normál nézet frissítve:', view);
                    }
                }
            });
        });
        
        // Fullscreen nézet nézetváltók
        document.querySelectorAll('.view-toggle-buttons button[data-fs-view]').forEach(btn => {
            btn.addEventListener('click', function() {
                // Minden gombot inaktívvá teszünk
                document.querySelectorAll('.view-toggle-buttons button[data-fs-view]').forEach(b => {
                    b.classList.remove('active');
                });
                
                // A kiválasztott gombot aktívvá tesszük
                this.classList.add('active');
                
                // Beállítjuk a nézetet a data-fs-view attribútum alapján
                const view = this.getAttribute('data-fs-view');
                const shopifyContainer = document.getElementById('fs-shopify-container');
                const bcContainer = document.getElementById('fs-bc-container');
                const fullscreenContent = document.querySelector('.fullscreen-content');
                
                if (shopifyContainer && bcContainer && fullscreenContent) {
                    // Forcing layout recalculation by accessing offsetHeight
                    fullscreenContent.offsetHeight;
                    
                    // Teljesen eltávolítjuk a korábbi flex beállításokat
                    shopifyContainer.style.removeProperty('flex');
                    bcContainer.style.removeProperty('flex');
                    
                    // Kis késleltetéssel állítjuk be az új értékeket
                    setTimeout(() => {
                        if (view === 'split') {
                            shopifyContainer.style.flex = '1 1 50%';
                            bcContainer.style.flex = '1 1 50%';
                        } else if (view === 'shopify') {
                            shopifyContainer.style.flex = '3 1 75%';
                            bcContainer.style.flex = '1 1 25%';
                        } else if (view === 'bc') {
                            shopifyContainer.style.flex = '1 1 25%';
                            bcContainer.style.flex = '3 1 75%';
                        }
                        
                        // Explicit értékekkel is beállítjuk a flex shorthand mellett
                        // ez segít bizonyos böngészőkben, ahol problémás a flex shorthand
                        if (view === 'split') {
                            shopifyContainer.style.flexGrow = '1';
                            shopifyContainer.style.flexBasis = '50%';
                            bcContainer.style.flexGrow = '1';
                            bcContainer.style.flexBasis = '50%';
                        } else if (view === 'shopify') {
                            shopifyContainer.style.flexGrow = '3';
                            shopifyContainer.style.flexBasis = '75%';
                            bcContainer.style.flexGrow = '1';
                            bcContainer.style.flexBasis = '25%';
                        } else if (view === 'bc') {
                            shopifyContainer.style.flexGrow = '1';
                            shopifyContainer.style.flexBasis = '25%';
                            bcContainer.style.flexGrow = '3';
                            bcContainer.style.flexBasis = '75%';
                        }
                        
                        console.log('Fullscreen nézet frissítve:', view);
                    }, 50);
                }
            });
        });
        
        // Táblázatok szinkronizált görgetésének beállítása
        function syncScrolling() {
            const shopifyContainer = document.getElementById('fs-shopify-container');
            const bcContainer = document.getElementById('fs-bc-container');
            const shopifyTable = document.getElementById('fs-shopify-table');
            const bcTable = document.getElementById('fs-bc-table');
            
            if (shopifyContainer && bcContainer && shopifyTable && bcTable) {
                // Shopify táblázat görgetése esetén szinkronizáljuk a BC táblázatot
                shopifyContainer.addEventListener('scroll', function() {
                    // Vízszintes görgetés szinkronizálása
                    bcContainer.scrollLeft = shopifyContainer.scrollLeft;
                    
                    // Függőleges görgetés szinkronizálása
                    bcContainer.scrollTop = shopifyContainer.scrollTop;
                    
                    // Sor kiemelése
                    highlightRows(shopifyContainer.scrollTop);
                });
                
                // BC táblázat görgetése esetén szinkronizáljuk a Shopify táblázatot
                bcContainer.addEventListener('scroll', function() {
                    // Vízszintes görgetés szinkronizálása
                    shopifyContainer.scrollLeft = bcContainer.scrollLeft;
                    
                    // Függőleges görgetés szinkronizálása
                    shopifyContainer.scrollTop = bcContainer.scrollTop;
                    
                    // Sor kiemelése
                    highlightRows(bcContainer.scrollTop);
                });
                
                // Sorok kiemelésének funkciója
                function highlightRows(scrollTop) {
                    // Meghatározzuk a látható sorokat
                    const shopifyRows = shopifyTable.querySelectorAll('tbody tr');
                    const bcRows = bcTable.querySelectorAll('tbody tr');
                    
                    // Törölünk minden korábbi kiemelést
                    shopifyRows.forEach(row => row.classList.remove('highlighted-row'));
                    bcRows.forEach(row => row.classList.remove('highlighted-row'));
                    
                    // Ha nincsenek sorok, kilépünk
                    if (!shopifyRows.length || !bcRows.length) return;
                    
                    // Meghatározzuk a középső sort a látható területen
                    const rowHeight = shopifyRows[0].offsetHeight;
                    const containerHeight = shopifyContainer.clientHeight;
                    const visibleRowsCount = Math.floor(containerHeight / rowHeight);
                    const middleVisibleRowIndex = Math.floor(scrollTop / rowHeight) + Math.floor(visibleRowsCount / 2);
                    
                    // Kiemeljük a középső sort mindkét táblázatban, ha létezik
                    if (shopifyRows[middleVisibleRowIndex]) {
                        shopifyRows[middleVisibleRowIndex].classList.add('highlighted-row');
                    }
                    
                    if (bcRows[middleVisibleRowIndex]) {
                        bcRows[middleVisibleRowIndex].classList.add('highlighted-row');
                    }
                }
            }
        }
    }
}

// --- Nézet Betöltő Függvények ---

function loadHomePage() {
    setActiveNav(navHome);
    appContent.innerHTML = initialAppContentHTML;
    
    // Re-attach landing page specific handlers
    document.getElementById('browse-products-btn')?.addEventListener('click', function() {
        document.getElementById('nav-products').click();
    });
    document.getElementById('browse-compare-btn')?.addEventListener('click', function() {
        document.getElementById('nav-compare').click();
    });

    // Re-attach card link handlers
    document.getElementById('search-info-card')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('nav-products').click();
    });
    
    document.getElementById('compare-info-card')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('nav-compare').click();
    });
    
    // Re-apply hover effects
    const cards = document.querySelectorAll('.hover-shadow');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('shadow');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('shadow');
        });
    });
    
    // Re-initialize dynamic badges
    populateDataBadges();
}

async function loadProductsView() {
    try {
        appContent.innerHTML = '<p class="text-center py-5"><i class="bi bi-hourglass-split fs-1 d-block mb-3"></i>Termékek betöltése...</p>';

        // Betöltjük az összes terméket a normalized_product_view nézetből
        const { data, error } = await _supabase
            .from('normalized_product_view')
            .select('*');

        if (error) throw error;

        // Globális változóban tároljuk
        allProducts = data || [];
        
        // Minden egyedi érték kinyerése a szűrőkhöz
        distinctProductTypes = [...new Set(allProducts.map(p => safeGet(p, 'Product Type (Custom)', '')).filter(Boolean))].sort();
        distinctBrands = [...new Set(allProducts.map(p => safeGet(p, 'Brand', '')).filter(Boolean))].sort();
        distinctOrigins = [...new Set(allProducts.map(p => safeGet(p, 'Származási hely', '')).filter(Boolean))].sort();
        distinctVintages = [...new Set(allProducts.map(p => safeGet(p, 'Évjárat', '')).filter(Boolean))].sort();
        distinctVolumes = [...new Set(allProducts.map(p => safeGet(p, 'Kiszerelés', '')).filter(Boolean))].sort();
        distinctTastes = [...new Set(allProducts.map(p => safeGet(p, 'Ízjegyek', '')).filter(Boolean))].sort();
        distinctAdminCategories = [...new Set(allProducts.map(p => safeGet(p, 'admin_category', '')).filter(Boolean))].sort();
        
        // Szőlőfajta kategóriák használata a szőlőfajták helyett
        distinctGrapeVarieties = [...new Set(allProducts
            .filter(p => p.grape_variety_categories && p.grape_variety_categories.trim() !== '')
            .flatMap(p => p.grape_variety_categories.split(', ').map(item => item.trim()))
            .filter(item => item !== '')
        )].sort();
        
        // Érlelési módok
        distinctAgingMethods = [...new Set([
            ...allProducts.filter(p => p.aging_method_category && p.aging_method_category.trim() !== '').map(p => p.aging_method_category.trim()),
            ...allProducts.filter(p => p.aging_method_subcategory && p.aging_method_subcategory.trim() !== '').map(p => p.aging_method_subcategory.trim())
        ].filter(item => item !== ''))].sort();

        console.log("🔄 Egyedi értékek:", {
            Kategóriák: distinctProductTypes.length,
            Márkák: distinctBrands.length,
            "Szőlőfajta kategóriák": distinctGrapeVarieties.length,
            "Érlelési módok": distinctAgingMethods.length
        });

        // Feedback adatok betöltése (ha vannak)
        await loadFeedbackData();
        
        // Rendereljük a termékeket és a szűrőket
        await renderProductsAndFilters();
        
        // Beállítjuk az aktív navigációs elemet
        setActiveNav(navProducts);

    } catch (error) {
        console.error('Hiba a termékek betöltésekor:', error);
        showErrorMessage(`Hiba a termékek betöltésekor: ${error.message}`);
    }
}

async function loadCompareView() {
    setActiveNav(navCompare);
    appContent.innerHTML = '<p class="text-center py-5"><i class="bi bi-hourglass-split fs-1 d-block mb-3"></i>Összehasonlító nézet betöltése...</p>';
    try {
        // Egyszerűsített logika: Mindig a normalized_product_view-t használjuk a Shopify adatokhoz
        const { data: normalizedProducts, error: normalizedError, count: shopifyCount } = await _supabase
            .from('normalized_product_view') // Primary source for Shopify-like data
            .select('*', { count: 'exact' })
            .order('SKU', { ascending: true });

        if (normalizedError) {
            console.error("Hiba a normalizált adatok lekérésekor:", normalizedError);
            throw new Error(`Nem sikerült lekérni a normalizált termékadatokat: ${normalizedError.message}`);
        }

        // BC adatok lekérése
        const { data: bcProducts, error: bcError, count: bcCount } = await _supabase
            .from('bc')
            .select('*', { count: 'exact' })
            .order('"Szám"', { ascending: true });

        if (bcError) {
            console.error("Hiba a BC adatok lekérésekor:", bcError);
            throw new Error(`Nem sikerült lekérni a Business Central adatokat: ${bcError.message}`);
        }

        // Lekérjük a legutolsó módosítási dátumokat
        let shopifyLastUpdated = new Date(); // Default to now
        let bcLastUpdated = new Date(); // Default to now

        try {
            // Shopify utolsó módosítás dátuma (a source táblából, ha van `updated_at`)
            // HASZNÁLJUK AZ 'all_products' VAGY 'shopify_products' TÁBLÁT ITT, HA VAN UPDATED_AT OSZLOPUK
            // Vagy ha a normalized_product_view tartalmazza, akkor onnan
            const { data: shopifyUpdateData } = await _supabase
                 .from('shopify_products') // Assuming shopify_products has updated_at
                 .select('updated_at')
                 .order('updated_at', { ascending: false })
                 .limit(1)
                 .maybeSingle(); // Use maybeSingle to avoid error if table is empty

            if (shopifyUpdateData && shopifyUpdateData.updated_at) {
                 shopifyLastUpdated = new Date(shopifyUpdateData.updated_at);
            }

            // BC utolsó módosítás dátuma
            const { data: bcUpdateData } = await _supabase
                 .from('bc')
                 .select('updated_at')
                 .order('updated_at', { ascending: false })
                 .limit(1)
                 .maybeSingle();

            if (bcUpdateData && bcUpdateData.updated_at) {
                 bcLastUpdated = new Date(bcUpdateData.updated_at);
            }
        } catch (updateError) {
            console.warn('Hiba a frissítési dátumok lekérdezése közben (nem kritikus):', updateError);
            // Ha hiba történt, marad az aktuális dátum (fentebb beállítva)
        }

        // Adatteljességi mutatók számítása
        let shopifyCompleteness = 0;
        if (normalizedProducts && normalizedProducts.length > 0) {
            const relevantFields = [
                'Title', 'SKU', 'Brand', 'Product Type (Custom)',
                'Származási hely', 'Kiszerelés', 'Alkoholtartalom', 'Évjárat',
                 // Add fields from normalized view if they exist and are relevant for completeness
                 // e.g., 'normalized_grape_varieties', 'aging_method_category'
            ];
            let filledFields = 0;
            let totalFields = normalizedProducts.length * relevantFields.length;
            normalizedProducts.forEach(product => {
                relevantFields.forEach(field => {
                    const value = product[field];
                    if (value === 0 || value === '0' || (value !== null && value !== undefined && value !== '' && value !== 'N/A')) {
                        filledFields++;
                    }
                });
            });
            shopifyCompleteness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
        }

        let bcCompleteness = 0;
        if (bcProducts && bcProducts.length > 0) {
            const relevantFields = [
                'Szám', 'Megnevezés', 'Termékkategória',
                'Terület', 'Kiszerelés', 'Évjárat'
            ];
            let filledFields = 0;
            let totalFields = bcProducts.length * relevantFields.length;
            bcProducts.forEach(product => {
                relevantFields.forEach(field => {
                    const value = product[field];
                    if (value === 0 || value === '0' || (value !== null && value !== undefined && value !== '' && value !== 'N/A')) {
                        filledFields++;
                    }
                });
            });
            bcCompleteness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
        }

        // Statisztikák előkészítése
        const stats = {
            totalShopify: shopifyCount || 0,
            totalBC: bcCount || 0,
            shopifyCompleteness: shopifyCompleteness,
            bcCompleteness: bcCompleteness
        };

        // Megjelenítendő adatok előkészítése (már a helyes formátumban vannak a lekérdezés után)
        const displayShopifyProducts = normalizedProducts || [];
        const displayBcProducts = bcProducts || [];

        // Táblázatok renderelése
        renderCompareTable(stats, displayShopifyProducts, displayBcProducts, shopifyLastUpdated, bcLastUpdated);

    } catch (error) {
        console.error('Hiba az összehasonlító nézet betöltése közben:', error);
        appContent.innerHTML = `<p class="text-danger text-center">Hiba történt az összehasonlító nézet betöltése közben: ${error.message}</p>`;
    }
}

// --- Navigáció Kezelése ---

function setActiveNav(activeLink) {
    // Reset all nav links
    [navHome, navProducts, navCompare, navLogo].forEach(link => {
        if (link) {
            link.classList.remove(ACTIVE_CLASS);
            link.style.color = ''; // Reset inline style (back to CSS default: white)
            link.style.fontWeight = ''; // Reset font weight
        }
    });

    // Set active state for the selected link
    if (activeLink) {
        activeLink.classList.add(ACTIVE_CLASS);
        activeLink.style.color = '#888888'; // Set active color directly
        activeLink.style.fontWeight = '600'; // Ensure font weight is set
    }
}

navHome.addEventListener('click', (e) => {
    e.preventDefault();
    loadHomePage();
});

navLogo.addEventListener('click', (e) => { // Add listener for logo
    e.preventDefault();
    loadHomePage();
});

navProducts.addEventListener('click', (e) => {
    e.preventDefault();
    loadProductsView();
});

navCompare.addEventListener('click', (e) => {
    e.preventDefault();
    loadCompareView();
});

// --- Kezdeti Betöltés ---
document.addEventListener('DOMContentLoaded', () => {
    // Store the initial HTML content (landing page)
    initialAppContentHTML = appContent.innerHTML;
    
    // Set Home as active initially
    setActiveNav(navHome);
    
    // Dinamikusan feltöltjük a badge-eket, ha a kezdőlapon vagyunk
    populateDataBadges();
    
    // Landing page button handlers are in index.html's inline script
});

/**
 * Adatmezők dinamikus feltöltése a Shopify és BC táblákból
 */
async function populateDataBadges() {
    const badgeContainer = document.getElementById('data-badge-container');
    if (!badgeContainer) return;
    
    // JAVÍTÁS: Ne kérdezzünk le feleslegesen, használjunk explicit listát
    // Vagy származtathatnánk az allProducts-ból, ha már betöltődött, de ez egyszerűbb.
    const importantFields = [
        'Title', 'Brand', 'SKU', 'Product Type (Custom)',
        'Alkoholtartalom', 'Kiszerelés', 'Évjárat', 'Származási hely',
        'Ízjegyek', 'normalized_grape_varieties', 'aging_method_category'
        // ... Adj hozzá más fontos mezőket, ha szükséges ...
    ];

    badgeContainer.innerHTML = ''; // Clear previous badges

    // Csak az első néhány fontos mezőt mutatjuk alapból
    const displayFields = importantFields.slice(0, 8);

    displayFields.forEach(field => {
        const badge = document.createElement('span');
        badge.classList.add('badge', 'bg-secondary', 'rounded-pill', 'p-2', 'px-3', 'm-1');
        badge.textContent = field;
        badgeContainer.appendChild(badge);
    });

    // Adjunk hozzá egy "és több" badge-et, ha több fontos mező van definiálva
    if (importantFields.length > displayFields.length) {
         const toggleButton = document.createElement('button');
         toggleButton.classList.add('badge', 'bg-dark', 'rounded-pill', 'p-2', 'px-3', 'm-1', 'border-0');
         toggleButton.id = 'toggle-fields-btn'; // Ez az ID már létezhetett, de most újra létrehozzuk
         toggleButton.innerHTML = `<i class="bi bi-plus-circle me-1"></i> és még ${importantFields.length - displayFields.length} mező`;
         toggleButton.style.cursor = 'pointer';

         const additionalFieldsContainer = document.createElement('div');
         additionalFieldsContainer.id = 'additional-fields'; // Ez az ID már létezhetett
         additionalFieldsContainer.classList.add('w-100', 'mt-2', 'd-none');

         importantFields.slice(displayFields.length).forEach(field => {
            const item = document.createElement('span');
            item.classList.add('badge', 'bg-secondary', 'rounded-pill', 'p-2', 'px-3', 'm-1');
            item.textContent = field;
            additionalFieldsContainer.appendChild(item);
         });

         toggleButton.addEventListener('click', function() {
            const isHidden = additionalFieldsContainer.classList.contains('d-none');
            if (isHidden) {
                additionalFieldsContainer.classList.remove('d-none');
                this.innerHTML = `<i class="bi bi-dash-circle me-1"></i> kevesebb mező mutatása`;
            } else {
                additionalFieldsContainer.classList.add('d-none');
                this.innerHTML = `<i class="bi bi-plus-circle me-1"></i> és még ${importantFields.length - displayFields.length} mező`;
            }
         });

         badgeContainer.appendChild(toggleButton);
         badgeContainer.appendChild(additionalFieldsContainer);
    }
    // Hiba esetén a fallback badges megjelenítése már nem szükséges itt,
    // mivel nem függünk a Supabase lekérdezéstől ebben a függvényben.
    // Ha a `normalized_product_view` lekérdezése hibára fut a `loadProductsView`-ban,
    // akkor a badgek nem jelennek meg, ami elfogadható lehet.
}

/**
 * Tartalék badge-ek megjelenítése, ha a Supabase lekérdezés sikertelen
 */
function displayFallbackBadges() {
    const badgeContainer = document.getElementById('data-badge-container');
    if (!badgeContainer) return;
    
    const fallbackFields = [
        'Terméknevek', 'Márkák', 'Kategóriák', 'SKU', 
        'Alkoholtartalom', 'Kiszerelés', 'Évjárat', 'Származási hely', 
        'Ízjegyek', 'Business Central', 'Shopify'
    ];
    
    badgeContainer.innerHTML = '';
    fallbackFields.forEach(field => {
        const badge = document.createElement('span');
        badge.classList.add('badge', 'bg-secondary', 'rounded-pill', 'p-2', 'px-3', 'm-1');
        badge.textContent = field;
        badgeContainer.appendChild(badge);
    });
}

// --- DOM elemek kiválasztása ---
const shopifyProductsTable = document.getElementById('shopify-products-table');
const bcProductsTable = document.getElementById('bc-products-table');
const shopifyProductsTableBody = document.getElementById('shopify-products');
const bcProductsTableBody = document.getElementById('bc-products');
const loadingSpinner = document.getElementById('loading-spinner');
const shopifyLoadingSpinner = document.getElementById('shopify-loading-spinner');
const bcLoadingSpinner = document.getElementById('bc-loading-spinner');
const shopifyCountBadge = document.getElementById('shopify-count');
const bcCountBadge = document.getElementById('bc-count');
const viewToggle = document.getElementById('view-toggle');
const gridViewBtn = document.getElementById('grid-view-btn');
const listViewBtn = document.getElementById('list-view-btn');
const productsContainer = document.getElementById('products-container');
const filtersSection = document.getElementById('filters-section');
const clearFiltersBtn = document.getElementById('clear-filters');
const searchInput = document.getElementById('search-input');
const perPageSelect = document.getElementById('per-page-select');
const paginationContainer = document.getElementById('pagination-container');
const highlightToggleBtn = document.getElementById('highlight-toggle');
// --- DOM elemek kiválasztása (Vége) --- 

// Hiányzó adatok kiemelésének kezelése
if (highlightToggleBtn) {
    // Inicializálás - állítsuk be a gomb kezdeti állapotát a showMissingData alapján
    updateHighlightToggleButton();
    
    highlightToggleBtn.addEventListener('click', function() {
        // Állapot változtatása
        showMissingData = !showMissingData;
        
        // Beállítás mentése localStorage-ba
        localStorage.setItem('showMissingData', showMissingData);
        
        // Frissítjük a gomb megjelenését
        updateHighlightToggleButton();
        
        // Újrarendereljük a táblázatokat, hogy frissüljön a hiányzó adatok kiemelése
        if (shopifyProductsTableBody && bcProductsTableBody) {
            renderShopifyProducts();
            renderBCProducts();
        }
        
        // Az összehasonlító nézetben is alkalmazzuk a beállítást
        const tablesContainer = document.getElementById('tables-container');
        if (tablesContainer) {
            if (showMissingData) {
                tablesContainer.classList.add('missing-data-highlight');
            } else {
                tablesContainer.classList.remove('missing-data-highlight');
            }
        }
    });
}

// Segédfüggvény a hiányzó adatok kiemelés gomb állapotának frissítésére
function updateHighlightToggleButton() {
    if (!highlightToggleBtn) return;
    
    if (showMissingData) {
        highlightToggleBtn.innerHTML = '<i class="bi bi-eye"></i> Hiányzó adatok mutatása';
        highlightToggleBtn.classList.remove('btn-outline-secondary');
        highlightToggleBtn.classList.add('btn-outline-danger');
    } else {
        highlightToggleBtn.innerHTML = '<i class="bi bi-eye-slash"></i> Hiányzó adatok elrejtése';
        highlightToggleBtn.classList.remove('btn-outline-danger');
        highlightToggleBtn.classList.add('btn-outline-secondary');
    }
}

// --- Helper function to update filter dropdown options ---

function updateFilterOptions(filteredProducts) {
    const filterConfig = {
        product_type: { selectId: 'product-type-select', distinctList: distinctProductTypes, property: 'Product Type (Custom)' },
        brand: { selectId: 'brand-select', distinctList: distinctBrands, property: 'Brand' },
        origin: { selectId: 'origin-select', distinctList: distinctOrigins, property: 'Származási hely' },
        vintage: { selectId: 'vintage-select', distinctList: distinctVintages, property: 'Évjárat' },
        volume: { selectId: 'volume-select', distinctList: distinctVolumes, property: 'Kiszerelés' },
        taste: { selectId: 'taste-select', distinctList: distinctTastes, property: 'Ízjegyek' },
        category: { selectId: 'category-select', distinctList: distinctAdminCategories, property: 'Category Name' },
        aging_method: { selectId: 'aging_method-select', distinctList: distinctAgingMethods, properties: ['aging_method_category', 'aging_method_subcategory'] }, // Több property ellenőrzése
        grape_variety: { selectId: 'grape_variety-select', distinctList: distinctGrapeVarieties, property: 'normalized_grape_varieties' } // Csak a normalizált mező
    };

    Object.entries(filterConfig).forEach(([key, config]) => {
        const selectElement = document.getElementById(config.selectId);
        if (!selectElement) return;

        // Get available values based on the config (single or multiple properties)
        let availableValues = new Set();
        if (config.properties) { // Handle multiple properties (e.g., aging_method)
            config.properties.forEach(prop => {
                filteredProducts.forEach(p => {
                    const value = safeGet(p, prop);
                    if (value) availableValues.add(value);
                });
            });
        } else if (config.property === 'normalized_grape_varieties') { // Handle comma-separated string
             filteredProducts.forEach(p => {
                const valueString = safeGet(p, config.property);
                if (valueString) {
                    valueString.split(',').forEach(val => availableValues.add(val.trim()));
                }
             });
        } else { // Handle single property
            availableValues = new Set(filteredProducts.map(p => safeGet(p, config.property)).filter(Boolean));
        }

        // Get the currently selected value for this filter
        const currentSelectedValue = currentFilters[key];

        // Keep the first option ("Minden...")
        const firstOption = selectElement.options[0];
        selectElement.innerHTML = ''; // Clear existing options
        selectElement.appendChild(firstOption); // Add back the first option

        // Iterate over the globally distinct values for this filter
        config.distinctList.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            
            // Disable if not available in the filtered set
            if (!availableValues.has(value)) {
                option.disabled = true;
            }
            
            // Re-select if it was the current filter
            if (value === currentSelectedValue) {
                option.selected = true;
            }
            
            selectElement.appendChild(option);
        });
    });

    // Note: Alcohol range buttons are not dynamically updated based on available products in this version.
}

// Helper function for product link clicks to avoid defining it inside the loop
function handleProductLinkClick(e) {
    e.preventDefault();
    const productId = this.getAttribute('data-product-id');
    loadProductDetail(productId);
}

// Function to show all feedback in a summary view
function showFeedbackSummary() {
    // Fetch all feedback from localStorage
    const allFeedback = [];
    const productIdsWithFeedback = new Set();
    
    // Find all keys in localStorage that match our pattern
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('product_feedback_')) {
            try {
                const feedbackData = JSON.parse(localStorage.getItem(key));
                
                // Only include items that have some feedback (either approved or have a comment)
                if (feedbackData.approved || feedbackData.comment) {
                    allFeedback.push(feedbackData);
                    if (feedbackData.productId) {
                        productIdsWithFeedback.add(feedbackData.productId);
                    }
                }
            } catch (e) {
                console.error('Error parsing feedback data:', e);
            }
        }
    }
    
    // Sort by timestamp (newest first)
    allFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Find the product details for all feedback items
    const feedbackWithProductDetails = allFeedback.map(feedback => {
        const productId = feedback.productId;
        const product = allProducts.find(p => safeGet(p, 'Product Handle') === productId);
        
        return {
            ...feedback,
            productTitle: product ? safeGet(product, 'Title') : 'Ismeretlen termék',
            productSKU: product ? safeGet(product, 'SKU') : 'N/A',
            productBrand: product ? safeGet(product, 'Brand') : 'N/A'
        };
    });
    
    // Create the summary view
    let summaryHTML = `
        <div class="container-fluid">
            <div class="row mb-4">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                        <h2><i class="bi bi-clipboard-data"></i> Visszajelzések összesítése</h2>
                        <button class="btn btn-primary" id="back-to-products">
                            <i class="bi bi-arrow-left"></i> Vissza a termékekhez
                        </button>
                    </div>
                    <p class="text-muted">Összesen ${feedbackWithProductDetails.length} visszajelzés, ${productIdsWithFeedback.size} termékhez.</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Visszajelzések listája</h5>
                            <button class="btn btn-sm btn-outline-danger" id="clear-all-feedback">
                                <i class="bi bi-trash"></i> Összes törlése
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Állapot</th>
                                            <th>Termék neve</th>
                                            <th>SKU</th>
                                            <th>Márka</th>
                                            <th style="min-width: 300px;">Megjegyzés</th>
                                            <th>Dátum</th>
                                            <th>Műveletek</th>
                                        </tr>
                                    </thead>
                                    <tbody>
    `;
    
    if (feedbackWithProductDetails.length === 0) {
        summaryHTML += `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <p class="mb-0">Még nincs visszajelzés egyik termékhez sem.</p>
                    <small class="text-muted">A termékekhez a pipálás és a megjegyzés mezők kitöltésével tudsz visszajelzést adni.</small>
                </td>
            </tr>
        `;
    } else {
        // Format date helper function
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleString('hu-HU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        // Add each feedback to the table
        feedbackWithProductDetails.forEach(feedback => {
            const statusClass = feedback.approved ? 'text-success' : 'text-danger';
            const statusIcon = feedback.approved ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
            const statusText = feedback.approved ? 'Jóváhagyva' : 'Javítandó';
            
            summaryHTML += `
                <tr>
                    <td>
                        <span class="${statusClass}">
                            <i class="bi ${statusIcon}"></i> ${statusText}
                        </span>
                    </td>
                    <td>
                        <a href="#" class="product-link" data-product-id="${feedback.productId}">
                            ${feedback.productTitle}
                        </a>
                    </td>
                    <td>${feedback.productSKU}</td>
                    <td>${feedback.productBrand}</td>
                    <td>${feedback.comment || '<span class="text-muted">Nincs megjegyzés</span>'}</td>
                    <td>${formatDate(feedback.timestamp)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger delete-feedback" data-product-id="${feedback.productId}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    summaryHTML += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Display the summary
    appContent.innerHTML = summaryHTML;
    
    // Attach event handlers
    document.getElementById('back-to-products').addEventListener('click', () => {
        loadProductsView();
    });
    
    document.getElementById('clear-all-feedback').addEventListener('click', () => {
        if (confirm('Biztosan törölni szeretnéd az összes visszajelzést? Ez a művelet nem vonható vissza.')) {
            clearAllFeedback();
            // Refresh the view
            showFeedbackSummary();
        }
    });
    
    // Attach delete handlers to each delete button
    document.querySelectorAll('.delete-feedback').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                localStorage.removeItem(`product_feedback_${productId}`);
                
                // Remove this row from the table
                this.closest('tr').remove();
                
                // Update the feedback count
                const remainingRows = document.querySelectorAll('table tbody tr').length;
                if (remainingRows === 0) {
                    // If no more feedback, refresh the view
                    showFeedbackSummary();
                }
            }
        });
    });
    
    // Attach product link handlers
    document.querySelectorAll('.product-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                loadProductDetailPage(productId);
            }
        });
    });
}

// Function to export all feedback to a CSV file
function exportFeedback() {
    // Collect all feedback from localStorage
    const allFeedback = [];
    
    // Find all keys in localStorage that match our pattern
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('product_feedback_')) {
            try {
                const feedbackData = JSON.parse(localStorage.getItem(key));
                
                // Only include items that have some feedback (either approved or have a comment)
                if (feedbackData.approved || feedbackData.comment) {
                    allFeedback.push(feedbackData);
                }
            } catch (e) {
                console.error('Error parsing feedback data:', e);
            }
        }
    }
    
    // If no feedback, show a message
    if (allFeedback.length === 0) {
        alert('Nincs exportálható visszajelzés.');
        return;
    }
    
    // Find the product details for all feedback items
    const feedbackWithProductDetails = allFeedback.map(feedback => {
        const productId = feedback.productId;
        const product = allProducts.find(p => safeGet(p, 'Product Handle') === productId);
        
        return {
            status: feedback.approved ? 'Jóváhagyva' : 'Javítandó',
            comment: feedback.comment || '',
            timestamp: new Date(feedback.timestamp).toLocaleString('hu-HU'),
            productId: feedback.productId,
            productTitle: product ? safeGet(product, 'Title') : 'Ismeretlen termék',
            productSKU: product ? safeGet(product, 'SKU') : 'N/A',
            productBrand: product ? safeGet(product, 'Brand') : 'N/A'
        };
    });
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add CSV header
    csvContent += "Állapot,Termék neve,SKU,Márka,Megjegyzés,Dátum\n";
    
    // Add CSV rows
    feedbackWithProductDetails.forEach(item => {
        const row = [
            item.status,
            item.productTitle.replace(/,/g, ';'),  // Replace commas in text fields
            item.productSKU.replace(/,/g, ';'),
            item.productBrand.replace(/,/g, ';'),
            item.comment.replace(/,/g, ';').replace(/\n/g, ' '),  // Replace commas and newlines
            item.timestamp
        ];
        csvContent += row.join(',') + "\n";
    });
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `termek-visszajelzesek-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to clear all feedback data
function clearAllFeedback() {
    // Find all keys in localStorage that match our pattern
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('product_feedback_')) {
            keysToRemove.push(key);
        }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    return keysToRemove.length;
}

// Központi eseménykezelő az appContent-en belüli kattintásokhoz
async function handleAppContentClick(event) { // Made async
    let buttonClicked = false;

    // Handle remove filter button clicks
    const removeFilterButton = event.target.closest('.remove-filter-btn');
    if (removeFilterButton) {
        buttonClicked = true;
        const filterKey = removeFilterButton.getAttribute('data-filter-key');
        if (filterKey) {
            await removeFilter(filterKey); // Added await
        }
    }

    // Handle clear all filters button click
    const clearAllButton = event.target.closest('#clear-all-filters-btn');
    if (clearAllButton) {
        buttonClicked = true;
        await clearAllFilters(); // Added await
    }

    // Handle pagination link clicks

    // ... existing code ...

    // ... existing code ...
}

// ... existing code ...

// ... existing code ...

// Új függvény a lapozó UI generálásához
function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = ''; // Clear existing pagination

    if (totalPages <= 1) return; // No pagination needed for 1 or 0 pages

    const ul = document.createElement('ul');
    ul.classList.add('pagination', 'justify-content-center');

    const maxVisiblePages = 7; // Adjust number of visible page links
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
        // Show all pages
        startPage = 1;
        endPage = totalPages;
    } else {
        // Calculate start and end pages with ellipsis
        const maxPagesBeforeCurrent = Math.floor((maxVisiblePages - 3) / 2);
        const maxPagesAfterCurrent = Math.ceil((maxVisiblePages - 3) / 2);

        if (currentPage <= maxPagesBeforeCurrent + 1) {
            startPage = 1;
            endPage = maxVisiblePages - 2;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - (maxVisiblePages - 3);
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.classList.add('page-item');
    if (currentPage === 1) prevLi.classList.add('disabled');
    prevLi.innerHTML = `<a class="page-link pagination-link" href="#" data-page="${currentPage - 1}" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    ul.appendChild(prevLi);

    // First Page and Ellipsis (if needed)
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.classList.add('page-item');
        firstLi.innerHTML = `<a class="page-link pagination-link" href="#" data-page="1">1</a>`;
        ul.appendChild(firstLi);
        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.classList.add('page-item', 'disabled');
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            ul.appendChild(ellipsisLi);
        }
    }

    // Page Number Links
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.classList.add('page-item');
        if (i === currentPage) li.classList.add('active');
        li.innerHTML = `<a class="page-link pagination-link" href="#" data-page="${i}">${i}</a>`;
        ul.appendChild(li);
    }

    // Ellipsis and Last Page (if needed)
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.classList.add('page-item', 'disabled');
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            ul.appendChild(ellipsisLi);
        }
        const lastLi = document.createElement('li');
        lastLi.classList.add('page-item');
        lastLi.innerHTML = `<a class="page-link pagination-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
        ul.appendChild(lastLi);
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.classList.add('page-item');
    if (currentPage === totalPages) nextLi.classList.add('disabled');
    nextLi.innerHTML = `<a class="page-link pagination-link" href="#" data-page="${currentPage + 1}" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    ul.appendChild(nextLi);

    paginationContainer.appendChild(ul);
}

// Új függvény a lapozó linkek kattintásának kezelésére
async function handlePageChange(newPage) {
    currentPage = newPage;
    await updateProductDisplay(); // Re-render the list and pagination for the new page
}


async function loadProductDetailPage(productId) {
    setActiveNav(null); // No specific nav item is active on detail view
    appContent.innerHTML = '<p class="text-center py-5"><i class="bi bi-hourglass-split fs-1 d-block mb-3"></i>Termék betöltése...</p>';
    
    try {
        // Javított lekérdezés: `normalized_product_view`-ból kérdezi le az adatokat
        // Győződj meg róla, hogy a Supabase nézet/tábla neve helyes és tartalmazza ezeket az oszlopokat!
        const { data: product, error } = await _supabase
            .from('normalized_product_view') // Updated source view/table
            .select(`
                "Product Handle", Title, SKU, Brand, Vendor, 
                "Product Type (Custom)", "Származási hely", Kiszerelés, 
                Alkoholtartalom, normalized_grape_varieties, 
                aging_method_category, dryness_level, Ízjegyek, 
                Évjárat, Flavor, Description, "Primary Image"
            `)
            .eq('Product Handle', productId)
            .single();

        if (error) throw error;
        if (!product) throw new Error("A termék nem található.");

        // Render product detail page
        renderProductDetail(product); // A renderProductDetail már kezeli ezeket a mezőneveket

    } catch (error) {
        console.error('Hiba a termék betöltése közben:', error);
        appContent.innerHTML = `
            <div class="container">
                <div class="alert alert-danger my-5">
                    <h4>Hiba történt a termék betöltése közben</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-outline-primary" onclick="document.getElementById('nav-products').click()">
                        <i class="bi bi-arrow-left"></i> Vissza a termékekhez
                    </button>
                </div>
            </div>
        `;
    }
}

// Betöltés overlay funkcionalitás
function showLoadingOverlay(message = 'Betöltés...') {
    const existingOverlay = document.getElementById('loading-overlay');
    if (existingOverlay) {
        const messageElement = existingOverlay.querySelector('.loading-message');
        if (messageElement) messageElement.textContent = message;
        existingOverlay.style.display = 'flex';
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
    
    const spinnerContainer = document.createElement('div');
    spinnerContainer.style.cssText = 'text-align: center;';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary';
    spinner.setAttribute('role', 'status');
    spinner.style.cssText = 'width: 3rem; height: 3rem;';
    
    const spinnerText = document.createElement('span');
    spinnerText.className = 'visually-hidden';
    spinnerText.textContent = 'Betöltés...';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'loading-message mt-3';
    messageElement.textContent = message;
    
    spinner.appendChild(spinnerText);
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(messageElement);
    overlay.appendChild(spinnerContainer);
    
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showErrorMessage(message) {
    appContent.innerHTML = `
        <div class="container">
            <div class="alert alert-danger my-5">
                <h4>Hiba történt</h4>
                <p>${message}</p>
            </div>
        </div>
    `;
}

// Feedback adatok betöltése
async function loadFeedbackData() {
    try {
        // A termék visszajelzések lekérdezése a Supabase-ből
        const { data: feedbackData, error } = await _supabase
            .from('product_feedback')
            .select('product_handle, approved, comment');

        if (error) {
            console.error("Hiba a visszajelzések betöltésekor:", error);
            return;
        }

        console.log(`${feedbackData.length} visszajelzés betöltve a Supabase-ből`);
        
        // Visszajelzések feldolgozása - nincs szükség helyi tárolásra, csak visszatérünk az adatokkal
        return feedbackData;
    } catch (e) {
        console.error("Hiba a visszajelzések feldolgozása közben:", e);
        return [];
    }
}