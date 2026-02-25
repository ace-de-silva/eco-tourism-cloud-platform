/* ============================================================
   ETCP — Eco-Tourism Cloud Platform
   script.js — Main Application Logic (Vanilla JS ES6+)
   ============================================================ */

'use strict';

/* ============================================================
   1. APP STATE & CONFIGURATION
   ============================================================ */
const App = {
  destinations: [],          // Loaded from JSON
  currentPage: 'home',
  currentDestination: null,  // Active destination for detail view
  currentUser: null,         // Logged-in user object
  isProvider: false,         // Provider session flag
  wishlist: [],              // Array of destination IDs
  bookings: [],              // Array of booking objects
  itinerary: [],             // Array of destination objects in planner
  settings: {
    theme: 'forest',
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    budget: 300,
    sustainabilityPriority: 'any',
    activities: [],
    notifications: {
      bookings: true,
      destinations: true,
      tips: false
    },
    language: 'en',
    currency: 'USD'
  },
  filterState: {
    location: '',
    activities: [],
    rating: '',
    certifications: [],
    maxPrice: 500,
    sort: 'rating-desc',
    searchText: ''
  },
  reviewRatings: {}          // Tracks star rating input per destination
};

/* ============================================================
   2. LOCAL STORAGE HELPERS
   ============================================================ */
const Storage = {
  get(key) {
    try {
      const val = localStorage.getItem(`etcp_${key}`);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      console.warn(`Storage.get failed for key: ${key}`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`etcp_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`Storage.set failed for key: ${key}`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(`etcp_${key}`);
    } catch (e) {
      console.warn(`Storage.remove failed for key: ${key}`, e);
    }
  }
};

/* ============================================================
   3. TOAST NOTIFICATIONS
   ============================================================ */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  show(message, type = 'success', duration = 4000) {
    if (!this.container) return;

    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <i class="${icons[type] || icons.info} toast-icon" aria-hidden="true"></i>
      <span>${message}</span>
      <button class="toast-close" aria-label="Close notification">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    `;

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Auto dismiss
    const timer = setTimeout(() => this.dismiss(toast), duration);
    toast._timer = timer;
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._timer);
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }
};

/* ============================================================
   4. DATA LOADING
   ============================================================ */
async function loadDestinations() {
  try {
    const response = await fetch('./data/destinations.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    App.destinations = await response.json();
    return App.destinations;
  } catch (error) {
    console.error('Failed to load destinations:', error);
    // Fallback: use empty array gracefully
    App.destinations = [];
    Toast.show('Failed to load destination data. Please refresh.', 'error');
    return [];
  }
}

/* ============================================================
   5. ROUTING / PAGE NAVIGATION
   ============================================================ */
function navigateTo(pageId, options = {}) {
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-link');

  // Hide all pages
  pages.forEach(page => {
    page.hidden = true;
    page.removeAttribute('class');
    page.className = 'page';
  });

  // Show target page
  const targetPage = document.getElementById(`page-${pageId}`);
  if (!targetPage) {
    console.warn(`Page not found: page-${pageId}`);
    return;
  }

  targetPage.hidden = false;
  App.currentPage = pageId;

  // Update nav active state
  navLinks.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    if (link.dataset.page === pageId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // Page-specific initialization
  switch(pageId) {
    case 'home':
      initHomePage();
      break;
    case 'discover':
      initDiscoverPage(options.filters);
      break;
    case 'detail':
      if (options.destinationId) {
        initDetailPage(options.destinationId);
      }
      break;
    case 'voyager':
      initVoyagerPage();
      break;
    case 'dashboard':
      initDashboardPage();
      break;
    case 'network':
      initNetworkPage();
      break;
    case 'settings':
      initSettingsPage();
      break;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile nav
  closeMobileNav();
}

/* ============================================================
   6. HOME PAGE
   ============================================================ */
function initHomePage() {
  renderFeaturedDestinations();
  initCounterAnimation();
}

function renderFeaturedDestinations() {
  const container = document.getElementById('featured-destinations');
  if (!container) return;

  const featured = App.destinations.filter(d => d.featured).slice(0, 3);

  if (featured.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center">Loading featured destinations...</p>';
    return;
  }

  container.innerHTML = featured.map(dest => createDestinationCard(dest)).join('');
  attachCardListeners(container);
}

function initCounterAnimation() {
  const counters = document.querySelectorAll('.counter-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

/* ============================================================
   7. DESTINATION CARDS
   ============================================================ */
function createDestinationCard(dest) {
  const wishlist = App.wishlist;
  const isWishlisted = wishlist.includes(dest.id);
  const avgRating = calculateAvgRating(dest);

  return `
    <article class="destination-card" data-id="${dest.id}" tabindex="0" role="article" aria-label="${dest.name} eco-lodge in ${dest.location}">
      <div class="card-image-wrap">
        <img
          src="${dest.heroImage}"
          alt="${dest.name} — ${dest.location}"
          class="card-image"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=60'"
        />
        <button
          class="card-wishlist-btn ${isWishlisted ? 'active' : ''}"
          data-wishlist-id="${dest.id}"
          aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
          aria-pressed="${isWishlisted}"
        >
          <i class="${isWishlisted ? 'fas' : 'far'} fa-heart" aria-hidden="true"></i>
        </button>
        <div class="card-rating-badge" aria-label="${avgRating} star rating">
          <i class="fas fa-star" aria-hidden="true" style="color: var(--color-gold)"></i>
          ${avgRating}
        </div>
      </div>
      <div class="card-body">
        <div class="card-location">
          <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
          ${dest.location}
        </div>
        <h3 class="card-title">${dest.name}</h3>
        <div class="eco-leaves" aria-label="${dest.sustainabilityRating} out of 5 eco-leaves sustainability rating">
          ${renderEcoLeaves(dest.sustainabilityRating)}
        </div>
        <div class="card-certs">
          ${dest.certifications.slice(0, 2).map(cert => `
            <span class="cert-pill" title="${cert} certified">
              <i class="fas fa-certificate" aria-hidden="true"></i>${cert}
            </span>
          `).join('')}
        </div>
        <div class="card-activities">
          ${dest.activityTypes.slice(0, 3).map(act => `
            <span class="activity-tag">${act}</span>
          `).join('')}
        </div>
        <div class="card-footer">
          <div class="card-price">
            <span class="amount">$${dest.pricePerNight}</span>
            <span class="per-night">/night</span>
          </div>
          <div class="card-carbon" title="Carbon footprint per night">
            <i class="fas fa-leaf" aria-hidden="true" style="color:var(--color-secondary)"></i>
            ${dest.carbonFootprint} kg CO₂
          </div>
          <button class="btn btn-primary btn-sm view-detail-btn" data-dest-id="${dest.id}" aria-label="View details for ${dest.name}">
            View Details
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderEcoLeaves(rating) {
  return Array.from({ length: 5 }, (_, i) => `
    <span class="eco-leaf ${i < rating ? '' : 'empty'}" aria-hidden="true">🍃</span>
  `).join('');
}

function calculateAvgRating(dest) {
  if (!dest.reviews || dest.reviews.length === 0) return '5.0';
  const sum = dest.reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / dest.reviews.length).toFixed(1);
}

function attachCardListeners(container) {
  // View detail buttons
  container.querySelectorAll('.view-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const destId = parseInt(btn.dataset.destId);
      navigateTo('detail', { destinationId: destId });
    });
  });

  // Card click (excluding button clicks)
  container.querySelectorAll('.destination-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        const destId = parseInt(card.dataset.id);
        navigateTo('detail', { destinationId: destId });
      }
    });

    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const destId = parseInt(card.dataset.id);
        navigateTo('detail', { destinationId: destId });
      }
    });
  });

  // Wishlist buttons
  container.querySelectorAll('.card-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(parseInt(btn.dataset.wishlistId), btn);
    });
  });
}

/* ============================================================
   8. DISCOVER PAGE
   ============================================================ */
function initDiscoverPage(initialFilters = {}) {
  // Apply any initial filters passed from quick search
  if (initialFilters.location) {
    const locEl = document.getElementById('filter-location');
    if (locEl) locEl.value = initialFilters.location;
    App.filterState.location = initialFilters.location;
  }
  if (initialFilters.activity) {
    const checkboxes = document.querySelectorAll('.filter-activity');
    checkboxes.forEach(cb => {
      if (cb.value === initialFilters.activity) cb.checked = true;
    });
    App.filterState.activities = [initialFilters.activity];
  }
  if (initialFilters.rating) {
    const radios = document.querySelectorAll('[name="filter-rating"]');
    radios.forEach(r => {
      r.checked = r.value === String(initialFilters.rating);
    });
    App.filterState.rating = String(initialFilters.rating);
  }

  applyFilters();
  attachFilterListeners();
}

function attachFilterListeners() {
  // Location filter
  const locationEl = document.getElementById('filter-location');
  if (locationEl) {
    locationEl.addEventListener('change', () => {
      App.filterState.location = locationEl.value;
      applyFilters();
    });
  }

  // Activity checkboxes
  document.querySelectorAll('.filter-activity').forEach(cb => {
    cb.addEventListener('change', () => {
      App.filterState.activities = Array.from(
        document.querySelectorAll('.filter-activity:checked')
      ).map(el => el.value);
      applyFilters();
    });
  });

  // Rating radio
  document.querySelectorAll('[name="filter-rating"]').forEach(r => {
    r.addEventListener('change', () => {
      App.filterState.rating = r.value;
      applyFilters();
    });
  });

  // Certification checkboxes
  document.querySelectorAll('.filter-cert').forEach(cb => {
    cb.addEventListener('change', () => {
      App.filterState.certifications = Array.from(
        document.querySelectorAll('.filter-cert:checked')
      ).map(el => el.value);
      applyFilters();
    });
  });

  // Price range
  const priceEl = document.getElementById('filter-max-price');
  if (priceEl) {
    priceEl.addEventListener('input', () => {
      App.filterState.maxPrice = parseInt(priceEl.value);
      const priceDisplay = document.getElementById('price-display');
      if (priceDisplay) priceDisplay.textContent = `$${priceEl.value}/night`;
      applyFilters();
    });
  }

  // Sort
  const sortEl = document.getElementById('filter-sort');
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      App.filterState.sort = sortEl.value;
      applyFilters();
    });
  }

  // Search within results
  const searchEl = document.getElementById('discover-search');
  if (searchEl) {
    searchEl.addEventListener('input', debounce(() => {
      App.filterState.searchText = searchEl.value.trim().toLowerCase();
      applyFilters();
    }, 300));
  }

  // Clear filters
  const clearBtn = document.getElementById('clear-filters-btn');
  const resetBtn = document.getElementById('reset-filters-btn');
  [clearBtn, resetBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', resetFilters);
    }
  });

  // View toggle
  const gridBtn = document.getElementById('grid-view-btn');
  const listBtn = document.getElementById('list-view-btn');
  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => {
      setViewMode('grid');
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      gridBtn.setAttribute('aria-pressed', 'true');
      listBtn.setAttribute('aria-pressed', 'false');
    });
    listBtn.addEventListener('click', () => {
      setViewMode('list');
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      listBtn.setAttribute('aria-pressed', 'true');
      gridBtn.setAttribute('aria-pressed', 'false');
    });
  }
}

function applyFilters() {
  let results = [...App.destinations];
  const fs = App.filterState;

  // Location filter (partial match on location/country)
  if (fs.location) {
    results = results.filter(d =>
      d.location.toLowerCase().includes(fs.location.toLowerCase()) ||
      d.country.toLowerCase().includes(fs.location.toLowerCase())
    );
  }

  // Activity filter (destination must have ALL selected activities)
  if (fs.activities.length > 0) {
    results = results.filter(d =>
      fs.activities.some(act => d.activityTypes.includes(act))
    );
  }

  // Rating filter (minimum rating)
  if (fs.rating) {
    results = results.filter(d => d.sustainabilityRating >= parseInt(fs.rating));
  }

  // Certification filter
  if (fs.certifications.length > 0) {
    results = results.filter(d =>
      fs.certifications.some(cert => d.certifications.includes(cert))
    );
  }

  // Price filter
  if (fs.maxPrice < 500) {
    results = results.filter(d => d.pricePerNight <= fs.maxPrice);
  }

  // Text search
  if (fs.searchText) {
    const q = fs.searchText;
    results = results.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.activityTypes.some(a => a.toLowerCase().includes(q))
    );
  }

  // Sort
  switch(fs.sort) {
    case 'price-asc':
      results.sort((a, b) => a.pricePerNight - b.pricePerNight);
      break;
    case 'price-desc':
      results.sort((a, b) => b.pricePerNight - a.pricePerNight);
      break;
    case 'carbon-asc':
      results.sort((a, b) => a.carbonFootprint - b.carbonFootprint);
      break;
    case 'rating-desc':
    default:
      results.sort((a, b) => b.sustainabilityRating - a.sustainabilityRating);
      break;
  }

  renderDiscoverResults(results);
}

function renderDiscoverResults(results) {
  const grid = document.getElementById('destinations-grid');
  const noResults = document.getElementById('no-results');
  const countEl = document.getElementById('results-count');

  if (!grid) return;

  if (results.length === 0) {
    grid.innerHTML = '';
    if (noResults) noResults.hidden = false;
    if (countEl) countEl.textContent = '0 destinations found';
    return;
  }

  if (noResults) noResults.hidden = true;
  if (countEl) {
    countEl.textContent = `${results.length} destination${results.length !== 1 ? 's' : ''} found`;
  }

  grid.innerHTML = results.map(dest => createDestinationCard(dest)).join('');
  attachCardListeners(grid);
}

function setViewMode(mode) {
  const grid = document.getElementById('destinations-grid');
  if (!grid) return;

  if (mode === 'list') {
    grid.classList.add('list-view');
  } else {
    grid.classList.remove('list-view');
  }
}

function resetFilters() {
  App.filterState = {
    location: '',
    activities: [],
    rating: '',
    certifications: [],
    maxPrice: 500,
    sort: 'rating-desc',
    searchText: ''
  };

  // Reset UI
  const locationEl = document.getElementById('filter-location');
  if (locationEl) locationEl.value = '';

  document.querySelectorAll('.filter-activity').forEach(cb => cb.checked = false);
  document.querySelectorAll('.filter-cert').forEach(cb => cb.checked = false);

  const ratingRadios = document.querySelectorAll('[name="filter-rating"]');
  ratingRadios.forEach(r => r.checked = r.value === '');

  const priceEl = document.getElementById('filter-max-price');
  if (priceEl) {
    priceEl.value = 500;
    const priceDisplay = document.getElementById('price-display');
    if (priceDisplay) priceDisplay.textContent = '$500/night';
  }

  const sortEl = document.getElementById('filter-sort');
  if (sortEl) sortEl.value = 'rating-desc';

  const searchEl = document.getElementById('discover-search');
  if (searchEl) searchEl.value = '';

  applyFilters();
  Toast.show('Filters cleared', 'info');
}

/* ============================================================
   9. DESTINATION DETAIL PAGE
   ============================================================ */
function initDetailPage(destId) {
  const dest = App.destinations.find(d => d.id === destId);
  if (!dest) {
    Toast.show('Destination not found', 'error');
    navigateTo('discover');
    return;
  }

  App.currentDestination = dest;
  App.reviewRatings[dest.id] = App.reviewRatings[dest.id] || 0;

  const container = document.getElementById('detail-content');
  if (!container) return;

  const avgRating = calculateAvgRating(dest);
  const isWishlisted = App.wishlist.includes(dest.id);
  const carbonLevel = dest.carbonFootprint > 15 ? 'high' : '';
  const carbonPercent = Math.min((dest.carbonFootprint / 30) * 100, 100);

  container.innerHTML = `
    <!-- Back button -->
    <div class="container" style="padding-top: var(--space-5)">
      <button class="btn btn-ghost btn-sm" id="back-to-discover" aria-label="Back to discover page">
        <i class="fas fa-arrow-left" aria-hidden="true"></i> Back to Discover
      </button>
    </div>

    <!-- Hero -->
    <div class="detail-hero">
      <img src="${dest.heroImage}" alt="${dest.name} in ${dest.location}" class="detail-hero-img" />
      <div class="detail-hero-overlay" aria-hidden="true"></div>
      <div class="detail-hero-content container">
        <p class="detail-location">
          <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
          ${dest.location}, ${dest.country}
        </p>
        <h1 class="detail-title">${dest.name}</h1>
        <div class="detail-badges">
          ${dest.certifications.map(cert => `
            <span class="cert-badge-lg" role="img" aria-label="${cert} certification">
              <i class="fas fa-certificate" aria-hidden="true"></i>${cert}
            </span>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="container detail-layout">

      <!-- Main Content -->
      <div class="detail-main">

        <!-- Image Gallery -->
        ${dest.images && dest.images.length > 1 ? `
        <div class="gallery-grid" role="list" aria-label="Photo gallery">
          ${dest.images.slice(0, 3).map((img, i) => `
            <div class="gallery-item" role="listitem" tabindex="0" aria-label="Gallery image ${i + 1}">
              <img src="${img}" alt="${dest.name} photo ${i + 1}" loading="lazy"
                onerror="this.src='https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=60'" />
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- About -->
        <div class="detail-section">
          <h3><i class="fas fa-leaf" aria-hidden="true"></i> About This Experience</h3>
          <p style="color: var(--color-text-muted); line-height: 1.8; margin-bottom: var(--space-5)">
            ${dest.description}
          </p>
          <div class="eco-leaves" style="margin-bottom: var(--space-3)" aria-label="${dest.sustainabilityRating} out of 5 eco-leaves">
            ${renderEcoLeaves(dest.sustainabilityRating)}
            <span style="font-size:var(--font-size-sm); color:var(--color-text-muted); margin-left: var(--space-2)">
              ${dest.sustainabilityRating}/5 Eco-Leaves Sustainability Rating
            </span>
          </div>
          <div class="card-activities">
            ${dest.activityTypes.map(act => `<span class="activity-tag">${act}</span>`).join('')}
          </div>
        </div>

        <!-- Sustainability Practices -->
        <div class="detail-section">
          <h3><i class="fas fa-seedling" aria-hidden="true"></i> Verified Sustainability Practices</h3>
          <ul class="sustainability-practices" aria-label="Sustainability practices list">
            ${dest.sustainabilityPractices.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <!-- Transparency — Environmental Data -->
        <div class="detail-section">
          <h3><i class="fas fa-chart-bar" aria-hidden="true"></i> Environmental Transparency</h3>

          <!-- Carbon meter -->
          <div class="carbon-meter" role="region" aria-label="Carbon footprint meter">
            <div class="carbon-meter-label">
              <span>Carbon Footprint</span>
              <strong style="color: ${dest.carbonFootprint <= 10 ? 'var(--color-success)' : 'var(--color-warning)'}">
                ${dest.carbonFootprint} kg CO₂/night
              </strong>
            </div>
            <div class="carbon-bar-wrap" role="progressbar"
              aria-valuenow="${carbonPercent}" aria-valuemin="0" aria-valuemax="100"
              aria-label="${dest.carbonFootprint} kg CO2 per night carbon footprint">
              <div class="carbon-bar ${carbonLevel}" style="width: ${carbonPercent}%"></div>
            </div>
            <p style="font-size: var(--font-size-xs); color: var(--color-text-muted)">
              ${dest.carbonFootprint <= 10 ? '🌿 Excellent — well below average eco-tourism footprint' :
                dest.carbonFootprint <= 18 ? '🌱 Good — below average eco-tourism footprint' :
                '⚠️ Moderate — offset programs available'}
            </p>
          </div>

          <div class="sustainability-metrics-grid" style="margin-top: var(--space-5)">
            <div class="sustainability-metric" role="region" aria-label="Renewable energy usage">
              <div class="metric-label-sm">Renewable Energy</div>
              <div class="metric-value-lg">${dest.renewableEnergy}%</div>
            </div>
            <div class="sustainability-metric" role="region" aria-label="Certification count">
              <div class="metric-label-sm">Certifications</div>
              <div class="metric-value-lg">${dest.certifications.length}</div>
            </div>
          </div>

          <div style="margin-top: var(--space-5);">
            <h4 style="font-size: var(--font-size-sm); color: var(--color-text); margin-bottom: var(--space-3);">
              <i class="fas fa-tint" aria-hidden="true" style="color: var(--color-sky-dark)"></i> Water Conservation
            </h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.7">${dest.waterConservation}</p>

            <h4 style="font-size: var(--font-size-sm); color: var(--color-text); margin-top: var(--space-5); margin-bottom: var(--space-3);">
              <i class="fas fa-users" aria-hidden="true" style="color: var(--color-primary)"></i> Community Impact
            </h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.7">${dest.communityImpact}</p>

            <h4 style="font-size: var(--font-size-sm); color: var(--color-text); margin-top: var(--space-5); margin-bottom: var(--space-3);">
              <i class="fas fa-paw" aria-hidden="true" style="color: var(--color-secondary)"></i> Wildlife Protection
            </h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.7">${dest.wildlifeProtection}</p>
          </div>
        </div>

        <!-- Amenities -->
        <div class="detail-section">
          <h3><i class="fas fa-star" aria-hidden="true"></i> Amenities & Activities</h3>
          <div class="amenities-grid">
            ${dest.amenities.map(a => `
              <div class="amenity-item">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
                <span>${a}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Reviews Section -->
        <div class="detail-section">
          <h3><i class="fas fa-comments" aria-hidden="true"></i> Traveler Reviews</h3>
          <div class="review-summary">
            <div class="review-score" aria-label="Average rating ${avgRating} out of 5 stars">
              <div class="review-score-big">${avgRating}</div>
              <div class="review-stars-large" aria-hidden="true">
                ${'★'.repeat(Math.round(parseFloat(avgRating)))}${'☆'.repeat(5 - Math.round(parseFloat(avgRating)))}
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-muted)">
                ${dest.reviews.length} review${dest.reviews.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div id="reviews-container">
            ${dest.reviews.map(review => `
              <div class="review-card" role="article">
                <div class="review-header">
                  <div class="reviewer-avatar" aria-hidden="true">${review.avatar || review.author[0]}</div>
                  <div>
                    <div class="reviewer-name">${review.author}</div>
                    <div class="reviewer-country">${review.country || ''}</div>
                  </div>
                  <div class="review-date">${formatDate(review.date)}</div>
                </div>
                <div class="review-stars" aria-label="${review.rating} out of 5 stars">
                  ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
                <p class="review-text">"${review.comment}"</p>
              </div>
            `).join('')}
          </div>

          <!-- Write a review -->
          ${App.currentUser ? `
          <div class="write-review-form" role="form" aria-label="Write a review form">
            <h4>Share Your Experience</h4>
            <div class="star-rating-input" role="group" aria-label="Rate this destination">
              ${[1,2,3,4,5].map(i => `
                <button class="star" data-star="${i}" aria-label="${i} star${i>1?'s':''}" type="button">
                  <i class="fas fa-star" aria-hidden="true"></i>
                </button>
              `).join('')}
            </div>
            <div class="form-group" style="margin-bottom: var(--space-4)">
              <label for="review-text">Your review</label>
              <textarea id="review-text" class="form-control" rows="4" placeholder="Describe your experience..." aria-label="Review text"></textarea>
            </div>
            <button class="btn btn-primary" id="submit-review-btn" data-dest-id="${dest.id}" aria-label="Submit your review">
              <i class="fas fa-paper-plane" aria-hidden="true"></i> Submit Review
            </button>
          </div>
          ` : `
          <div class="write-review-form" style="text-align:center">
            <p class="text-muted">
              <i class="fas fa-lock" aria-hidden="true"></i>
              <a href="#" class="link-btn" id="review-login-link">Sign in</a> to share your experience and help other travelers.
            </p>
          </div>
          `}
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="detail-sidebar" aria-label="Booking sidebar">
        <div class="booking-card" role="region" aria-label="Booking information">
          <div class="booking-price-header">
            <span class="booking-price-amount">$${dest.pricePerNight}</span>
            <span class="booking-price-per">/ night</span>
          </div>
          <div class="eco-leaves" style="margin-bottom: var(--space-6)" aria-label="${dest.sustainabilityRating} eco-leaves">
            ${renderEcoLeaves(dest.sustainabilityRating)}
          </div>
          <button class="btn btn-primary btn-full" id="book-now-btn" data-dest-id="${dest.id}" aria-label="Book ${dest.name}" style="margin-bottom: var(--space-4)">
            <i class="fas fa-calendar-check" aria-hidden="true"></i> Book Now
          </button>
          <button class="btn btn-outline btn-full ${isWishlisted ? 'active' : ''}" id="sidebar-wishlist-btn" data-wishlist-id="${dest.id}" aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}" style="margin-bottom: var(--space-6)">
            <i class="${isWishlisted ? 'fas' : 'far'} fa-heart" aria-hidden="true"></i>
            ${isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>
          <button class="btn btn-ghost btn-full" id="add-to-voyager-btn" data-dest-id="${dest.id}" aria-label="Add to trip planner" style="margin-bottom: var(--space-6)">
            <i class="fas fa-map-marked-alt" aria-hidden="true"></i> Add to Voyager
          </button>
          <hr style="border: none; border-top: 1px solid var(--color-border-light); margin-bottom: var(--space-5)">
          <div style="font-size: var(--font-size-sm)">
            <div style="display:flex; align-items:center; gap: var(--space-2); color: var(--color-text-muted); margin-bottom: var(--space-3)">
              <i class="fas fa-certificate" style="color: var(--color-gold)" aria-hidden="true"></i>
              <strong>Verified Provider</strong>
            </div>
            <div style="display:flex; align-items:center; gap: var(--space-2); color: var(--color-text-muted); margin-bottom: var(--space-3)">
              <i class="fas fa-leaf" style="color: var(--color-secondary)" aria-hidden="true"></i>
              ${dest.carbonFootprint} kg CO₂/night footprint
            </div>
            <div style="display:flex; align-items:center; gap: var(--space-2); color: var(--color-text-muted); margin-bottom: var(--space-3)">
              <i class="fas fa-bolt" style="color: var(--color-gold)" aria-hidden="true"></i>
              ${dest.renewableEnergy}% renewable energy
            </div>
            <div style="display:flex; align-items:center; gap: var(--space-2); color: var(--color-text-muted)">
              <i class="fas fa-shield-alt" style="color: var(--color-primary)" aria-hidden="true"></i>
              Secure booking + 5% eco-tax to conservation
            </div>
          </div>
        </div>
      </aside>

    </div>
  `;

  // Attach detail page listeners
  attachDetailListeners(dest);
}

function attachDetailListeners(dest) {
  // Back button
  const backBtn = document.getElementById('back-to-discover');
  if (backBtn) backBtn.addEventListener('click', () => navigateTo('discover'));

  // Book now
  const bookBtn = document.getElementById('book-now-btn');
  if (bookBtn) bookBtn.addEventListener('click', () => openBookingModal(dest));

  // Wishlist (sidebar)
  const sideWishBtn = document.getElementById('sidebar-wishlist-btn');
  if (sideWishBtn) {
    sideWishBtn.addEventListener('click', () => {
      toggleWishlist(dest.id, sideWishBtn);
      // Update icon
      const icon = sideWishBtn.querySelector('i');
      const isNowWishlisted = App.wishlist.includes(dest.id);
      if (icon) {
        icon.className = isNowWishlisted ? 'fas fa-heart' : 'far fa-heart';
      }
      sideWishBtn.innerHTML = `
        <i class="${isNowWishlisted ? 'fas' : 'far'} fa-heart" aria-hidden="true"></i>
        ${isNowWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
      `;
    });
  }

  // Add to Voyager
  const voyagerBtn = document.getElementById('add-to-voyager-btn');
  if (voyagerBtn) {
    voyagerBtn.addEventListener('click', () => {
      addToItinerary(dest);
      Toast.show(`${dest.name} added to your Voyager itinerary!`, 'success');
    });
  }

  // Star rating input
  const stars = document.querySelectorAll('.star-rating-input .star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.star);
      App.reviewRatings[dest.id] = rating;
      updateStarDisplay(stars, rating);
    });
    star.addEventListener('mouseenter', () => {
      const hoverRating = parseInt(star.dataset.star);
      updateStarDisplay(stars, hoverRating);
    });
    star.addEventListener('mouseleave', () => {
      updateStarDisplay(stars, App.reviewRatings[dest.id] || 0);
    });
  });

  // Submit review
  const submitReviewBtn = document.getElementById('submit-review-btn');
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', () => submitReview(dest));
  }

  // Review login link
  const reviewLoginLink = document.getElementById('review-login-link');
  if (reviewLoginLink) {
    reviewLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('login');
    });
  }
}

function updateStarDisplay(stars, rating) {
  stars.forEach((star, i) => {
    star.classList.toggle('active', i < rating);
  });
}

function submitReview(dest) {
  if (!App.currentUser) {
    openAuthModal('login');
    return;
  }

  const rating = App.reviewRatings[dest.id];
  const textEl = document.getElementById('review-text');
  const text = textEl ? textEl.value.trim() : '';

  if (!rating || rating < 1) {
    Toast.show('Please select a star rating', 'warning');
    return;
  }
  if (!text || text.length < 10) {
    Toast.show('Please write a review (at least 10 characters)', 'warning');
    return;
  }

  // Add review to destination
  const newReview = {
    author: App.currentUser.name,
    country: 'Verified Traveler',
    rating: rating,
    comment: text,
    date: new Date().toISOString().split('T')[0],
    avatar: App.currentUser.name[0].toUpperCase()
  };

  dest.reviews.push(newReview);

  // Store user's reviews
  const userReviews = Storage.get(`reviews_${App.currentUser.email}`) || [];
  userReviews.push({ destId: dest.id, destName: dest.name, ...newReview });
  Storage.set(`reviews_${App.currentUser.email}`, userReviews);

  Toast.show('Review submitted! Thank you for sharing your experience.', 'success');

  // Re-render reviews section
  const reviewsContainer = document.getElementById('reviews-container');
  if (reviewsContainer) {
    reviewsContainer.innerHTML = dest.reviews.map(review => `
      <div class="review-card" role="article">
        <div class="review-header">
          <div class="reviewer-avatar" aria-hidden="true">${review.avatar || review.author[0]}</div>
          <div>
            <div class="reviewer-name">${review.author}</div>
            <div class="reviewer-country">${review.country || ''}</div>
          </div>
          <div class="review-date">${formatDate(review.date)}</div>
        </div>
        <div class="review-stars" aria-label="${review.rating} out of 5 stars">
          ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
        </div>
        <p class="review-text">"${review.comment}"</p>
      </div>
    `).join('');
  }

  // Clear form
  if (textEl) textEl.value = '';
  App.reviewRatings[dest.id] = 0;
  const stars = document.querySelectorAll('.star-rating-input .star');
  updateStarDisplay(stars, 0);
}

/* ============================================================
   10. BOOKING MODAL & FLOW
   ============================================================ */
function openBookingModal(dest) {
  if (!App.currentUser) {
    Toast.show('Please login to book this experience', 'warning');
    openAuthModal('login');
    return;
  }

  const modal = document.getElementById('booking-modal');
  const content = document.getElementById('booking-modal-content');
  if (!modal || !content) return;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  content.innerHTML = `
    <div class="booking-modal-content" style="padding: var(--space-8) var(--space-6)">
      <h2 style="margin-bottom: var(--space-2)">Book Your Stay</h2>
      <h3 style="color: var(--color-primary); font-size: var(--font-size-lg); margin-bottom: var(--space-6)">${dest.name}</h3>

      <form class="booking-form" id="booking-form" novalidate aria-label="Booking form">
        <div class="date-grid">
          <div class="form-group">
            <label for="checkin-date">Check-In Date</label>
            <input type="date" id="checkin-date" class="form-control" required
              aria-required="true"
              min="${formatDateInput(tomorrow)}"
              value="${formatDateInput(tomorrow)}"
            />
          </div>
          <div class="form-group">
            <label for="checkout-date">Check-Out Date</label>
            <input type="date" id="checkout-date" class="form-control" required
              aria-required="true"
              min="${formatDateInput(dayAfter)}"
              value="${formatDateInput(dayAfter)}"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="guest-count">Number of Guests</label>
          <select id="guest-count" class="form-control" aria-label="Number of guests">
            ${[1,2,3,4,5,6].map(n => `<option value="${n}">${n} Guest${n>1?'s':''}</option>`).join('')}
          </select>
        </div>

        <div class="price-breakdown" id="price-breakdown" aria-live="polite">
          <!-- Dynamically updated -->
        </div>

        <div id="booking-form-error" class="form-error" role="alert" hidden></div>

        <div class="form-actions" style="flex-direction: column;">
          <button type="submit" class="btn btn-primary btn-full" aria-label="Confirm booking">
            <i class="fas fa-lock" aria-hidden="true"></i> Confirm Booking
          </button>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: center; margin-top: var(--space-3)">
            <i class="fas fa-shield-alt" aria-hidden="true" style="color: var(--color-primary)"></i>
            Secure checkout — 5% eco-tax funds verified conservation programs
          </p>
        </div>
      </form>
    </div>
  `;

  // Price calculator
  const updatePrice = () => {
    const checkin = new Date(document.getElementById('checkin-date').value);
    const checkout = new Date(document.getElementById('checkout-date').value);
    const guests = parseInt(document.getElementById('guest-count').value);
    const nights = Math.max(1, Math.floor((checkout - checkin) / (1000 * 60 * 60 * 24)));
    const base = dest.pricePerNight * nights;
    const ecoTax = Math.round(base * 0.05);
    const total = base + ecoTax;

    const breakdown = document.getElementById('price-breakdown');
    if (breakdown) {
      breakdown.innerHTML = `
        <div class="price-row">
          <span>$${dest.pricePerNight} × ${nights} night${nights !== 1 ? 's' : ''}</span>
          <span>$${base.toLocaleString()}</span>
        </div>
        <div class="price-row">
          <span>
            Eco-conservation tax (5%)
            <span class="eco-tax-note" style="display: inline; font-size:0.7rem; color:var(--color-primary)">
              <i class="fas fa-leaf" aria-hidden="true"></i> Funds wildlife protection
            </span>
          </span>
          <span>$${ecoTax.toLocaleString()}</span>
        </div>
        <div class="price-row total">
          <span>Total (${guests} guest${guests !== 1 ? 's' : ''})</span>
          <span>$${total.toLocaleString()}</span>
        </div>
      `;
    }
  };

  // Attach price updater
  setTimeout(() => {
    const checkinEl = document.getElementById('checkin-date');
    const checkoutEl = document.getElementById('checkout-date');
    const guestsEl = document.getElementById('guest-count');

    [checkinEl, checkoutEl, guestsEl].forEach(el => {
      if (el) el.addEventListener('change', updatePrice);
    });

    // Date validation
    if (checkinEl) {
      checkinEl.addEventListener('change', () => {
        const checkinDate = new Date(checkinEl.value);
        const minCheckout = new Date(checkinDate);
        minCheckout.setDate(minCheckout.getDate() + 1);
        if (checkoutEl) {
          checkoutEl.min = formatDateInput(minCheckout);
          if (new Date(checkoutEl.value) <= checkinDate) {
            checkoutEl.value = formatDateInput(minCheckout);
          }
        }
        updatePrice();
      });
    }

    updatePrice();

    // Booking form submission
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        processBooking(dest);
      });
    }
  }, 50);

  showModal(modal);
}

function processBooking(dest) {
  const checkin = document.getElementById('checkin-date')?.value;
  const checkout = document.getElementById('checkout-date')?.value;
  const guests = parseInt(document.getElementById('guest-count')?.value || 1);
  const errorEl = document.getElementById('booking-form-error');

  if (!checkin || !checkout) {
    if (errorEl) {
      errorEl.textContent = 'Please select check-in and check-out dates.';
      errorEl.hidden = false;
    }
    return;
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);

  if (checkoutDate <= checkinDate) {
    if (errorEl) {
      errorEl.textContent = 'Check-out must be after check-in.';
      errorEl.hidden = false;
    }
    return;
  }

  // Check for double booking
  const existingBookings = App.bookings;
  const conflict = existingBookings.find(b =>
    b.destinationId === dest.id &&
    ((new Date(checkin) >= new Date(b.checkin) && new Date(checkin) < new Date(b.checkout)) ||
     (new Date(checkout) > new Date(b.checkin) && new Date(checkout) <= new Date(b.checkout)))
  );

  if (conflict) {
    if (errorEl) {
      errorEl.textContent = 'These dates are already booked for this destination.';
      errorEl.hidden = false;
    }
    return;
  }

  const nights = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  const base = dest.pricePerNight * nights;
  const ecoTax = Math.round(base * 0.05);
  const total = base + ecoTax;

  const bookingId = generateBookingId();

  const booking = {
    id: bookingId,
    destinationId: dest.id,
    destinationName: dest.name,
    location: dest.location,
    heroImage: dest.heroImage,
    checkin,
    checkout,
    nights,
    guests,
    pricePerNight: dest.pricePerNight,
    totalCost: total,
    ecoTax,
    status: 'confirmed',
    bookedAt: new Date().toISOString(),
    userEmail: App.currentUser.email
  };

  // Save booking
  App.bookings.push(booking);
  Storage.set(`bookings_${App.currentUser.email}`, App.bookings);

  // Award eco-points
  const ecoPoints = Math.round(total / 10);
  const stats = Storage.get(`stats_${App.currentUser.email}`) || { trips: 0, carbon: 0, ecoPoints: 0 };
  stats.trips += 1;
  stats.carbon += dest.carbonFootprint * nights;
  stats.ecoPoints += ecoPoints;
  Storage.set(`stats_${App.currentUser.email}`, stats);

  // Close booking modal
  hideModal(document.getElementById('booking-modal'));

  // Show confirmation
  showConfirmation(booking, dest);
}

function showConfirmation(booking, dest) {
  const modal = document.getElementById('confirmation-modal');
  const refEl = document.getElementById('booking-ref-display');
  const detailsEl = document.getElementById('confirmation-details');
  const emailEl = document.getElementById('conf-email');

  if (refEl) refEl.textContent = booking.id;
  if (emailEl) emailEl.textContent = App.currentUser.email;
  if (detailsEl) {
    detailsEl.innerHTML = `
      <strong>${booking.destinationName}</strong><br>
      ${booking.location}<br>
      Check-in: ${formatDate(booking.checkin)} · Check-out: ${formatDate(booking.checkout)}<br>
      ${booking.nights} night${booking.nights !== 1 ? 's' : ''} · ${booking.guests} guest${booking.guests !== 1 ? 's' : ''}<br>
      <strong>Total: $${booking.totalCost.toLocaleString()}</strong>
    `;
  }

  if (modal) showModal(modal);

  // Close confirmation button
  const closeBtn = document.getElementById('close-confirmation-btn');
  if (closeBtn) closeBtn.addEventListener('click', () => hideModal(modal), { once: true });

  const viewBtn = document.getElementById('view-booking-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      hideModal(modal);
      navigateTo('dashboard');
    }, { once: true });
  }
}

/* ============================================================
   11. WISHLIST
   ============================================================ */
function toggleWishlist(destId, btn) {
  if (!App.currentUser) {
    Toast.show('Please login to save destinations to your wishlist', 'info');
    openAuthModal('login');
    return;
  }

  const idx = App.wishlist.indexOf(destId);
  if (idx === -1) {
    App.wishlist.push(destId);
    Toast.show('Added to your wishlist! ❤️', 'success');
  } else {
    App.wishlist.splice(idx, 1);
    Toast.show('Removed from wishlist', 'info');
  }

  Storage.set(`wishlist_${App.currentUser.email}`, App.wishlist);

  // Update badge count
  updateWishlistBadge();

  // Update button state if passed
  if (btn) {
    const isActive = App.wishlist.includes(destId);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive.toString());

    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isActive ? 'fas fa-heart' : 'far fa-heart';
    }
    btn.setAttribute('aria-label', isActive ? 'Remove from wishlist' : 'Add to wishlist');
  }
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    badge.textContent = App.wishlist.length;
    badge.setAttribute('aria-label', `${App.wishlist.length} items in wishlist`);
  }
}

/* ============================================================
   12. VOYAGER PAGE
   ============================================================ */
function initVoyagerPage() {
  renderVoyagerDestList('');
  renderItinerary();

  // Search in voyager
  const searchEl = document.getElementById('voyager-search');
  if (searchEl) {
    searchEl.addEventListener('input', debounce(() => {
      renderVoyagerDestList(searchEl.value.trim().toLowerCase());
    }, 300));
  }

  // Clear itinerary
  const clearBtn = document.getElementById('clear-itinerary-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (App.itinerary.length === 0) return;
      App.itinerary = [];
      renderItinerary();
      Toast.show('Itinerary cleared', 'info');
    });
  }

  // Export itinerary
  const exportBtn = document.getElementById('export-itinerary-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportItinerary);
  }

  // Save itinerary
  const saveBtn = document.getElementById('save-itinerary-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!App.currentUser) {
        Toast.show('Please login to save your itinerary', 'info');
        openAuthModal('login');
        return;
      }
      Storage.set(`itinerary_${App.currentUser.email}`, App.itinerary);
      Toast.show('Itinerary saved! Find it in your Eco-Journeys dashboard.', 'success');
    });
  }
}

function renderVoyagerDestList(searchText) {
  const list = document.getElementById('voyager-destination-list');
  if (!list) return;

  let dests = App.destinations;
  if (searchText) {
    dests = dests.filter(d =>
      d.name.toLowerCase().includes(searchText) ||
      d.location.toLowerCase().includes(searchText)
    );
  }

  const addedIds = App.itinerary.map(i => i.id);

  list.innerHTML = dests.map(dest => `
    <div class="voyager-dest-item ${addedIds.includes(dest.id) ? 'added' : ''}"
      data-dest-id="${dest.id}"
      tabindex="${addedIds.includes(dest.id) ? '-1' : '0'}"
      role="button"
      aria-label="${addedIds.includes(dest.id) ? `${dest.name} already in itinerary` : `Add ${dest.name} to itinerary`}"
      aria-disabled="${addedIds.includes(dest.id)}"
    >
      <img src="${dest.heroImage}" alt="${dest.name}" class="voyager-dest-thumb" loading="lazy"
        onerror="this.src='https://images.unsplash.com/photo-1448375240586-882707db888b?w=100&q=50'" />
      <div class="voyager-dest-info">
        <div class="voyager-dest-name">${dest.name}</div>
        <div class="voyager-dest-location">${dest.location} · $${dest.pricePerNight}/night</div>
      </div>
      <div class="voyager-dest-add-btn" aria-hidden="true">
        <i class="fas ${addedIds.includes(dest.id) ? 'fa-check' : 'fa-plus'}" aria-hidden="true"></i>
      </div>
    </div>
  `).join('');

  // Attach click listeners
  list.querySelectorAll('.voyager-dest-item:not(.added)').forEach(item => {
    const addHandler = () => {
      const destId = parseInt(item.dataset.destId);
      const dest = App.destinations.find(d => d.id === destId);
      if (dest) {
        addToItinerary(dest);
        renderVoyagerDestList(document.getElementById('voyager-search')?.value || '');
      }
    };

    item.addEventListener('click', addHandler);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addHandler();
      }
    });
  });
}

function addToItinerary(dest) {
  if (App.itinerary.length >= 7) {
    Toast.show('Maximum 7 destinations per itinerary', 'warning');
    return;
  }

  if (App.itinerary.find(i => i.id === dest.id)) {
    Toast.show(`${dest.name} is already in your itinerary`, 'info');
    return;
  }

  App.itinerary.push({ ...dest, nights: 2 });
  renderItinerary();
  Toast.show(`${dest.name} added to itinerary!`, 'success');
}

function renderItinerary() {
  const container = document.getElementById('itinerary-container');
  const emptyState = document.getElementById('itinerary-empty');
  const summary = document.getElementById('sustainability-summary');

  if (!container) return;

  if (App.itinerary.length === 0) {
    // Show empty state
    container.innerHTML = `
      <div class="itinerary-empty" id="itinerary-empty">
        <i class="fas fa-map" aria-hidden="true"></i>
        <p>Add destinations from the left panel to start building your itinerary.</p>
        <p class="text-muted">Maximum 7 destinations per trip.</p>
      </div>
    `;
    if (summary) summary.hidden = true;
    return;
  }

  if (summary) summary.hidden = false;

  container.innerHTML = `
    <div role="list" aria-label="Itinerary destinations">
      ${App.itinerary.map((dest, idx) => `
        <div class="itinerary-item" role="listitem" data-idx="${idx}" aria-label="${dest.name}">
          <div class="itinerary-item-num" aria-hidden="true">${idx + 1}</div>
          <img src="${dest.heroImage}" alt="${dest.name}" class="itinerary-item-img" loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1448375240586-882707db888b?w=80&q=50'" />
          <div class="itinerary-item-info">
            <div class="itinerary-item-name">${dest.name}</div>
            <div class="itinerary-item-location">${dest.location}</div>
            <div class="itinerary-item-meta">
              <span><i class="fas fa-tag" aria-hidden="true"></i> $${dest.pricePerNight}/night</span>
              <span><i class="fas fa-leaf" aria-hidden="true" style="color:var(--color-secondary)"></i> ${dest.carbonFootprint} kg CO₂</span>
            </div>
          </div>
          <div class="itinerary-item-nights">
            <label for="nights-${idx}" style="font-size:0.7rem; color: var(--color-text-muted)">Nights:</label>
            <input type="number" id="nights-${idx}" value="${dest.nights}" min="1" max="30"
              data-dest-idx="${idx}"
              class="itinerary-nights-input"
              aria-label="Number of nights at ${dest.name}"
            />
          </div>
          <button class="itinerary-remove-btn" data-remove-idx="${idx}" aria-label="Remove ${dest.name} from itinerary">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      `).join('')}
    </div>
  `;

  // Attach remove listeners
  container.querySelectorAll('.itinerary-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeIdx);
      const removed = App.itinerary.splice(idx, 1)[0];
      renderItinerary();
      renderVoyagerDestList(document.getElementById('voyager-search')?.value || '');
      Toast.show(`${removed.name} removed from itinerary`, 'info');
    });
  });

  // Attach nights change listeners
  container.querySelectorAll('.itinerary-nights-input').forEach(input => {
    input.addEventListener('change', () => {
      const idx = parseInt(input.dataset.destIdx);
      const nights = Math.max(1, Math.min(30, parseInt(input.value) || 1));
      input.value = nights;
      App.itinerary[idx].nights = nights;
      updateSustainabilitySummary();
    });
  });

  updateSustainabilitySummary();
}

function updateSustainabilitySummary() {
  const totalCarbon = App.itinerary.reduce((sum, d) => sum + (d.carbonFootprint * (d.nights || 1)), 0);
  const avgEcoScore = App.itinerary.length > 0
    ? (App.itinerary.reduce((sum, d) => sum + d.sustainabilityRating, 0) / App.itinerary.length).toFixed(1)
    : 0;
  const totalCost = App.itinerary.reduce((sum, d) => sum + (d.pricePerNight * (d.nights || 1)), 0);

  const carbonEl = document.getElementById('total-carbon');
  const ecoEl = document.getElementById('avg-eco-score');
  const costEl = document.getElementById('total-cost');
  const destEl = document.getElementById('total-destinations');
  const offsetEl = document.getElementById('offset-text');
  const offsetBar = document.getElementById('offset-bar');

  if (carbonEl) carbonEl.textContent = `${totalCarbon} kg`;
  if (ecoEl) ecoEl.textContent = `${avgEcoScore}/5`;
  if (costEl) costEl.textContent = `$${totalCost.toLocaleString()}`;
  if (destEl) destEl.textContent = App.itinerary.length;

  // Carbon offset suggestion
  if (offsetEl) {
    const treesNeeded = Math.ceil(totalCarbon / 21.7); // 1 tree absorbs ~21.7 kg CO2/year
    offsetEl.textContent = `Your trip produces approximately ${totalCarbon} kg CO₂ total. To offset this, we recommend planting ${treesNeeded} trees through our verified conservation partners, or contributing to a local carbon sequestration project.`;
  }

  if (offsetBar) {
    const ecoPercent = Math.min((parseFloat(avgEcoScore) / 5) * 100, 100);
    offsetBar.style.width = `${ecoPercent}%`;
    offsetBar.setAttribute('aria-valuenow', ecoPercent);
  }
}

function exportItinerary() {
  if (App.itinerary.length === 0) {
    Toast.show('Add some destinations to your itinerary first', 'warning');
    return;
  }

  const data = {
    generated: new Date().toISOString(),
    platform: 'ETCP — Eco-Tourism Cloud Platform',
    destinations: App.itinerary.map(d => ({
      name: d.name,
      location: d.location,
      country: d.country,
      nights: d.nights,
      pricePerNight: d.pricePerNight,
      estimatedCost: d.pricePerNight * d.nights,
      sustainabilityRating: d.sustainabilityRating,
      certifications: d.certifications,
      carbonFootprint: `${d.carbonFootprint * d.nights} kg CO2 total`
    })),
    summary: {
      totalDestinations: App.itinerary.length,
      totalNights: App.itinerary.reduce((s, d) => s + d.nights, 0),
      estimatedTotalCost: `$${App.itinerary.reduce((s, d) => s + d.pricePerNight * d.nights, 0).toLocaleString()}`,
      totalCarbonFootprint: `${App.itinerary.reduce((s, d) => s + d.carbonFootprint * d.nights, 0)} kg CO2`
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ETCP-Itinerary-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  Toast.show('Itinerary exported!', 'success');
}

/* ============================================================
   13. DASHBOARD PAGE
   ============================================================ */
function initDashboardPage() {
  const authGate = document.getElementById('dashboard-auth-gate');
  const dashContent = document.getElementById('dashboard-content');

  if (!App.currentUser) {
    if (authGate) authGate.hidden = false;
    if (dashContent) dashContent.hidden = true;
    // Login button
    const loginBtn = document.getElementById('dashboard-login-btn');
    if (loginBtn) loginBtn.addEventListener('click', () => openAuthModal('login'), { once: true });
    return;
  }

  if (authGate) authGate.hidden = true;
  if (dashContent) dashContent.hidden = false;

  // Set user info
  const nameEl = document.getElementById('welcome-name');
  const emailEl = document.getElementById('welcome-email');
  const avatarEl = document.getElementById('user-avatar-large');

  if (nameEl) nameEl.textContent = `Welcome back, ${App.currentUser.name}!`;
  if (emailEl) emailEl.textContent = App.currentUser.email;
  if (avatarEl) avatarEl.textContent = App.currentUser.name[0].toUpperCase();

  // Load data
  App.bookings = Storage.get(`bookings_${App.currentUser.email}`) || [];
  App.wishlist = Storage.get(`wishlist_${App.currentUser.email}`) || [];

  // Attach tab listeners
  const tabs = document.querySelectorAll('#page-dashboard .tab-btn');
  const panels = document.querySelectorAll('#page-dashboard .tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => {
        p.hidden = true;
        p.classList.remove('active');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (panel) {
        panel.hidden = false;
        panel.classList.add('active');
        renderTabContent(tab.dataset.tab);
      }
    });
  });

  // Render active tab
  renderTabContent('bookings');

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
    });
  }
}

function renderTabContent(tabName) {
  switch(tabName) {
    case 'bookings': renderBookings(); break;
    case 'wishlist': renderWishlistTab(); break;
    case 'reviews': renderReviewsTab(); break;
    case 'impact': renderImpactTab(); break;
  }
}

function renderBookings() {
  const container = document.getElementById('bookings-list');
  const noBookings = document.getElementById('no-bookings');

  if (!container) return;

  const bookings = App.bookings;

  if (!bookings || bookings.length === 0) {
    container.innerHTML = '';
    if (noBookings) noBookings.hidden = false;
    return;
  }

  if (noBookings) noBookings.hidden = true;

  container.innerHTML = bookings.slice().reverse().map(b => {
    const dest = App.destinations.find(d => d.id === b.destinationId);
    return `
      <div class="booking-item" role="article" aria-label="Booking for ${b.destinationName}">
        <img
          src="${b.heroImage || 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=60'}"
          alt="${b.destinationName}"
          class="booking-thumb"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=60'"
        />
        <div class="booking-info">
          <div class="booking-name">${b.destinationName}</div>
          <div class="booking-location">
            <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${b.location}
          </div>
          <div class="booking-meta">
            <span><i class="fas fa-calendar-check" aria-hidden="true"></i> ${formatDate(b.checkin)}</span>
            <span><i class="fas fa-calendar-times" aria-hidden="true"></i> ${formatDate(b.checkout)}</span>
            <span><i class="fas fa-moon" aria-hidden="true"></i> ${b.nights} night${b.nights !== 1 ? 's' : ''}</span>
            <span><i class="fas fa-users" aria-hidden="true"></i> ${b.guests} guest${b.guests !== 1 ? 's' : ''}</span>
          </div>
          <span class="booking-ref">${b.id}</span>
        </div>
        <div>
          <div class="booking-price-tag">$${b.totalCost?.toLocaleString() || '—'}</div>
          <span class="booking-status status-confirmed">Confirmed</span>
          ${dest ? `<button class="btn btn-ghost btn-sm" style="margin-top: var(--space-3)" data-dest-id="${dest.id}"
            onclick="navigateTo('detail', { destinationId: ${dest.id} })">View Lodge</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderWishlistTab() {
  const container = document.getElementById('wishlist-grid');
  const noWishlist = document.getElementById('no-wishlist');

  if (!container) return;

  const wishlistDests = App.destinations.filter(d => App.wishlist.includes(d.id));

  if (wishlistDests.length === 0) {
    container.innerHTML = '';
    if (noWishlist) noWishlist.hidden = false;
    return;
  }

  if (noWishlist) noWishlist.hidden = true;
  container.innerHTML = wishlistDests.map(dest => createDestinationCard(dest)).join('');
  attachCardListeners(container);
}

function renderReviewsTab() {
  const container = document.getElementById('reviews-list');
  const noReviews = document.getElementById('no-reviews');

  if (!container || !App.currentUser) return;

  const reviews = Storage.get(`reviews_${App.currentUser.email}`) || [];

  if (reviews.length === 0) {
    container.innerHTML = '';
    if (noReviews) noReviews.hidden = false;
    return;
  }

  if (noReviews) noReviews.hidden = true;

  container.innerHTML = reviews.reverse().map(r => `
    <div class="review-card" role="article">
      <div class="review-header">
        <div class="reviewer-avatar" aria-hidden="true">${r.avatar || r.author[0]}</div>
        <div>
          <div class="reviewer-name">You reviewed: <strong>${r.destName}</strong></div>
          <div class="reviewer-country">${formatDate(r.date)}</div>
        </div>
      </div>
      <div class="review-stars" aria-label="${r.rating} out of 5 stars">
        ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
      </div>
      <p class="review-text">"${r.comment}"</p>
    </div>
  `).join('');
}

function renderImpactTab() {
  if (!App.currentUser) return;

  const stats = Storage.get(`stats_${App.currentUser.email}`) || { trips: 0, carbon: 0, ecoPoints: 0 };

  const tripsEl = document.getElementById('stat-trips');
  const carbonEl = document.getElementById('stat-carbon');
  const treesEl = document.getElementById('stat-trees');
  const pointsEl = document.getElementById('stat-ecopoints');

  if (tripsEl) tripsEl.textContent = stats.trips;
  if (carbonEl) carbonEl.textContent = `${stats.carbon} kg`;
  if (treesEl) treesEl.textContent = Math.ceil(stats.carbon / 21.7);
  if (pointsEl) pointsEl.textContent = stats.ecoPoints;

  // Badges
  const badgesGrid = document.getElementById('badges-grid');
  if (badgesGrid) {
    const badges = [
      { icon: 'fa-leaf', label: 'First Adventure', unlocked: stats.trips >= 1 },
      { icon: 'fa-tree', label: 'Tree Planter', unlocked: Math.ceil(stats.carbon / 21.7) >= 5 },
      { icon: 'fa-globe', label: 'World Explorer', unlocked: stats.trips >= 3 },
      { icon: 'fa-star', label: 'Eco Champion', unlocked: stats.ecoPoints >= 100 },
      { icon: 'fa-certificate', label: 'Verified Eco-Traveler', unlocked: stats.trips >= 5 },
      { icon: 'fa-heart', label: 'Community Supporter', unlocked: App.wishlist.length >= 3 }
    ];

    badgesGrid.innerHTML = badges.map(b => `
      <div class="eco-badge-item ${b.unlocked ? '' : 'locked'}" aria-label="${b.label} badge ${b.unlocked ? 'earned' : 'not yet earned'}" role="img">
        <i class="fas ${b.icon}" aria-hidden="true"></i>
        <span>${b.label}</span>
        ${!b.unlocked ? '<span style="font-size:0.65rem; color:var(--color-text-light)">🔒 Locked</span>' : ''}
      </div>
    `).join('');
  }
}

/* ============================================================
   14. PROVIDER NETWORK PAGE
   ============================================================ */
function initNetworkPage() {
  const authGate = document.getElementById('provider-auth-gate');
  const dashboard = document.getElementById('provider-dashboard');

  if (!App.currentUser || !App.isProvider) {
    if (authGate) authGate.hidden = false;
    if (dashboard) dashboard.hidden = true;

    const loginBtn = document.getElementById('provider-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        App.isProvider = true;
        openAuthModal('login');
      }, { once: true });
    }
    return;
  }

  if (authGate) authGate.hidden = true;
  if (dashboard) dashboard.hidden = false;

  // Provider name
  const nameEl = document.getElementById('provider-name');
  if (nameEl) nameEl.textContent = `${App.currentUser.name}'s Provider Dashboard`;

  // Provider tabs
  const tabs = document.querySelectorAll('#page-network .tab-btn');
  const panels = document.querySelectorAll('#page-network .tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => {
        p.hidden = true;
        p.classList.remove('active');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (panel) {
        panel.hidden = false;
        panel.classList.add('active');
      }

      if (tab.dataset.tab === 'p-listings') renderProviderListings();
      if (tab.dataset.tab === 'p-bookings') renderProviderBookings();
    });
  });

  renderProviderListings();
  attachAddListingForm();

  // Provider logout
  const logoutBtn = document.getElementById('provider-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      App.isProvider = false;
      logout();
    });
  }
}

function renderProviderListings() {
  const container = document.getElementById('provider-listings-list');
  if (!container) return;

  // Show provider's own submissions + 2 sample listings
  const providerListings = Storage.get(`provider_listings_${App.currentUser?.email}`) || [];
  const sampleListings = App.destinations.slice(0, 2);

  const allListings = [...sampleListings, ...providerListings];

  container.innerHTML = allListings.map(d => `
    <div class="provider-listing-item" role="article">
      <img src="${d.heroImage || 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=150&q=60'}"
        alt="${d.name}" style="width:80px; height:70px; border-radius:var(--radius-lg); object-fit:cover; flex-shrink:0"
        onerror="this.src='https://images.unsplash.com/photo-1448375240586-882707db888b?w=150&q=60'"
      />
      <div style="flex:1">
        <div style="font-weight:700; font-size:var(--font-size-md)">${d.name}</div>
        <div style="color:var(--color-text-muted); font-size:var(--font-size-sm)">
          <i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${d.location}
        </div>
        <div style="display:flex; gap:var(--space-4); margin-top:var(--space-2); font-size:var(--font-size-sm); color:var(--color-text-muted)">
          <span><i class="fas fa-tag" aria-hidden="true"></i> $${d.pricePerNight}/night</span>
          <span>${renderEcoLeaves(d.sustainabilityRating)}</span>
        </div>
      </div>
      <div style="text-align:right">
        <span style="font-size:0.75rem; padding:2px var(--space-3); background:rgba(45,125,50,0.1); color:var(--color-success); border-radius:var(--radius-full); font-weight:700">
          Active
        </span>
        <div style="font-size:var(--font-size-xs); color:var(--color-text-muted); margin-top:var(--space-2)">
          ${Math.floor(Math.random() * 50 + 10)} bookings
        </div>
      </div>
    </div>
  `).join('');
}

function renderProviderBookings() {
  const container = document.getElementById('provider-bookings-list');
  if (!container) return;

  // Generate sample bookings for provider view
  const sampleBookings = [
    { ref: 'ETCP-2025-87321', guest: 'Anna M. (Germany)', dest: 'Your Eco Lodge', checkin: '2025-03-15', checkout: '2025-03-18', amount: 540 },
    { ref: 'ETCP-2025-87156', guest: 'Thomas B. (Netherlands)', dest: 'Your Eco Lodge', checkin: '2025-03-22', checkout: '2025-03-25', amount: 540 },
    { ref: 'ETCP-2025-86920', guest: 'Maria S. (Spain)', dest: 'Your Eco Lodge', checkin: '2025-04-01', checkout: '2025-04-05', amount: 720 }
  ];

  container.innerHTML = sampleBookings.map(b => `
    <div class="booking-item" role="article" style="flex-wrap:wrap">
      <div class="booking-info" style="flex:1">
        <div class="booking-name">${b.guest}</div>
        <div class="booking-meta">
          <span><i class="fas fa-calendar-check" aria-hidden="true"></i> ${formatDate(b.checkin)}</span>
          <span><i class="fas fa-calendar-times" aria-hidden="true"></i> ${formatDate(b.checkout)}</span>
        </div>
        <span class="booking-ref">${b.ref}</span>
      </div>
      <div>
        <div class="booking-price-tag">$${b.amount}</div>
        <span class="booking-status status-confirmed">Confirmed</span>
      </div>
    </div>
  `).join('');
}

function attachAddListingForm() {
  const form = document.getElementById('add-listing-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('listing-name')?.value.trim();
    const location = document.getElementById('listing-location')?.value.trim();
    const price = parseFloat(document.getElementById('listing-price')?.value);
    const rating = parseInt(document.getElementById('listing-rating')?.value);
    const desc = document.getElementById('listing-description')?.value.trim();
    const practices = document.getElementById('listing-practices')?.value.trim();

    if (!name || !location || !price || !rating || !desc || !practices) {
      Toast.show('Please fill in all required fields', 'warning');
      return;
    }

    const certs = Array.from(document.querySelectorAll('.listing-cert:checked')).map(el => el.value);
    const activities = Array.from(document.querySelectorAll('.listing-activity:checked')).map(el => el.value);

    const newListing = {
      id: Date.now(),
      name,
      location,
      country: location,
      region: 'Custom',
      sustainabilityRating: rating,
      certifications: certs,
      activityTypes: activities,
      pricePerNight: price,
      heroImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80'],
      description: desc,
      sustainabilityPractices: practices.split('\n').filter(p => p.trim()),
      carbonFootprint: parseInt(document.getElementById('listing-carbon')?.value || 10),
      renewableEnergy: parseInt(document.getElementById('listing-energy')?.value || 75),
      waterConservation: 'Water conservation practices in place.',
      communityImpact: 'Supports local community employment and development.',
      wildlifeProtection: 'Operates in harmony with local wildlife.',
      amenities: activities,
      reviews: []
    };

    // Save provider's listings
    const listings = Storage.get(`provider_listings_${App.currentUser.email}`) || [];
    listings.push(newListing);
    Storage.set(`provider_listings_${App.currentUser.email}`, listings);

    // Add to global destinations
    App.destinations.push(newListing);

    Toast.show(`"${name}" submitted for review! It will go live once verified.`, 'success');
    form.reset();

    // Switch to listings tab
    const listingsTab = document.querySelector('[data-tab="p-listings"]');
    if (listingsTab) listingsTab.click();
  });

  // File upload simulation
  const uploadArea = document.getElementById('cert-upload');
  if (uploadArea) {
    uploadArea.addEventListener('click', () => {
      Toast.show('File upload simulated — in production, certifications would be uploaded to secure cloud storage.', 'info');
    });
    uploadArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Toast.show('File upload simulated', 'info');
      }
    });
  }
}

/* ============================================================
   15. SETTINGS PAGE
   ============================================================ */
function initSettingsPage() {
  // Settings nav
  const navBtns = document.querySelectorAll('.settings-nav-btn');
  const panels = document.querySelectorAll('.settings-panel');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => {
        p.hidden = true;
        p.classList.remove('active');
      });

      btn.classList.add('active');
      const panel = document.getElementById(`settings-${btn.dataset.settings}`);
      if (panel) {
        panel.hidden = false;
        panel.classList.add('active');
      }
    });
  });

  // Load saved settings
  const savedSettings = Storage.get('user_settings');
  if (savedSettings) Object.assign(App.settings, savedSettings);

  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      applyTheme(btn.dataset.theme);
    });
  });

  // Budget slider
  const budgetEl = document.getElementById('pref-budget');
  const budgetDisplay = document.getElementById('budget-display');
  if (budgetEl && budgetDisplay) {
    budgetEl.value = App.settings.budget;
    budgetDisplay.textContent = `$${App.settings.budget}`;
    budgetEl.addEventListener('input', () => {
      App.settings.budget = parseInt(budgetEl.value);
      budgetDisplay.textContent = `$${budgetEl.value}`;
    });
  }

  // Save preferences
  const saveBtn = document.getElementById('save-preferences-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      App.settings.activities = Array.from(document.querySelectorAll('.pref-activity:checked')).map(el => el.value);
      App.settings.sustainabilityPriority = document.querySelector('[name="pref-sustainability"]:checked')?.value || 'any';
      Storage.set('user_settings', App.settings);
      Toast.show('Preferences saved!', 'success');
    });
  }

  // Accessibility toggles
  const largeTextEl = document.getElementById('large-text-toggle');
  if (largeTextEl) {
    largeTextEl.checked = App.settings.largeText;
    largeTextEl.addEventListener('change', () => {
      App.settings.largeText = largeTextEl.checked;
      document.body.classList.toggle('large-text', App.settings.largeText);
      largeTextEl.setAttribute('aria-checked', App.settings.largeText.toString());
      Storage.set('user_settings', App.settings);
    });
  }

  const highContrastEl = document.getElementById('high-contrast-toggle');
  if (highContrastEl) {
    highContrastEl.checked = App.settings.highContrast;
    highContrastEl.addEventListener('change', () => {
      App.settings.highContrast = highContrastEl.checked;
      document.body.classList.toggle('high-contrast', App.settings.highContrast);
      highContrastEl.setAttribute('aria-checked', App.settings.highContrast.toString());
      Storage.set('user_settings', App.settings);
    });
  }

  const reduceMotionEl = document.getElementById('reduce-motion-toggle');
  if (reduceMotionEl) {
    reduceMotionEl.checked = App.settings.reduceMotion;
    reduceMotionEl.addEventListener('change', () => {
      App.settings.reduceMotion = reduceMotionEl.checked;
      document.body.classList.toggle('reduce-motion', App.settings.reduceMotion);
      reduceMotionEl.setAttribute('aria-checked', App.settings.reduceMotion.toString());
      Storage.set('user_settings', App.settings);
    });
  }

  // Language select (UI only)
  const langEl = document.getElementById('lang-select');
  if (langEl) {
    langEl.value = App.settings.language;
    langEl.addEventListener('change', () => {
      App.settings.language = langEl.value;
      if (langEl.value !== 'en') {
        Toast.show('Multilingual support coming in ETCP v2.0. Currently English only.', 'info');
      }
    });
  }

  // Apply saved theme
  if (App.settings.theme) applyTheme(App.settings.theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  App.settings.theme = theme;
  Storage.set('user_settings', App.settings);

  // Update active theme button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    const isActive = btn.dataset.theme === theme;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive.toString());
  });
}

/* ============================================================
   16. AUTH MODAL
   ============================================================ */
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  // Switch to correct tab
  switchModalTab(tab);
  showModal(modal);
}

function switchModalTab(tabName) {
  const tabs = document.querySelectorAll('.modal-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  tabs.forEach(tab => {
    const isActive = tab.dataset.modalTab === tabName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive.toString());
  });

  if (loginForm) loginForm.hidden = tabName !== 'login';
  if (registerForm) registerForm.hidden = tabName !== 'register';
}

function initAuthModal() {
  const closeBtn = document.getElementById('close-auth-modal');
  const modal = document.getElementById('auth-modal');

  if (closeBtn) closeBtn.addEventListener('click', () => hideModal(modal));

  // Tab switching
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => switchModalTab(tab.dataset.modalTab));
  });

  // Switch links inside forms
  document.querySelectorAll('[data-modal-tab]').forEach(el => {
    if (el.classList.contains('link-btn')) {
      el.addEventListener('click', () => switchModalTab(el.dataset.modalTab));
    }
  });

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleRegister();
    });
  }

  // Password visibility toggles
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      }
    });
  });

  // Mobile login btn
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', () => openAuthModal('login'));
  }
}

function handleLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const errorEl = document.getElementById('login-error');

  if (!email || !password) {
    if (errorEl) {
      errorEl.textContent = 'Please enter your email and password.';
      errorEl.hidden = false;
    }
    return;
  }

  // Check stored users
  const users = Storage.get('users') || [];
  const user = users.find(u => u.email === email && u.password === btoa(password));

  if (!user) {
    // Demo: auto-create account for any login attempt if user doesn't exist
    const demoUser = { name: email.split('@')[0], email, password: btoa(password), accountType: 'traveler' };
    users.push(demoUser);
    Storage.set('users', users);
    loginUser(demoUser);
  } else {
    loginUser(user);
  }
}

function handleRegister() {
  const firstName = document.getElementById('reg-firstname')?.value.trim();
  const lastName = document.getElementById('reg-lastname')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const accountType = document.getElementById('reg-account-type')?.value;
  const errorEl = document.getElementById('register-error');

  if (!firstName || !lastName || !email || !password) {
    if (errorEl) {
      errorEl.textContent = 'Please fill in all required fields.';
      errorEl.hidden = false;
    }
    return;
  }

  if (password.length < 8) {
    if (errorEl) {
      errorEl.textContent = 'Password must be at least 8 characters.';
      errorEl.hidden = false;
    }
    return;
  }

  if (!isValidEmail(email)) {
    if (errorEl) {
      errorEl.textContent = 'Please enter a valid email address.';
      errorEl.hidden = false;
    }
    return;
  }

  // Check if email already registered
  const users = Storage.get('users') || [];
  if (users.find(u => u.email === email)) {
    if (errorEl) {
      errorEl.textContent = 'An account with this email already exists. Please login.';
      errorEl.hidden = false;
    }
    return;
  }

  const newUser = {
    name: `${firstName} ${lastName}`,
    email,
    password: btoa(password),
    accountType
  };

  users.push(newUser);
  Storage.set('users', users);
  loginUser(newUser, true);

  if (accountType === 'provider') App.isProvider = true;
}

function loginUser(user, isNew = false) {
  App.currentUser = user;
  Storage.set('session', user);

  // Load user's data
  App.wishlist = Storage.get(`wishlist_${user.email}`) || [];
  App.bookings = Storage.get(`bookings_${user.email}`) || [];

  // Load saved itinerary
  const savedItinerary = Storage.get(`itinerary_${user.email}`);
  if (savedItinerary && savedItinerary.length > 0) {
    App.itinerary = savedItinerary;
  }

  updateWishlistBadge();
  updateNavAuthState();
  hideModal(document.getElementById('auth-modal'));

  Toast.show(
    isNew
      ? `Welcome to ETCP, ${user.name}! 🌿 Start exploring eco-destinations.`
      : `Welcome back, ${user.name}! `,
    'success'
  );

  // Redirect providers to network page
  if (user.accountType === 'provider' || App.isProvider) {
    App.isProvider = true;
    navigateTo('network');
  }
}

function logout() {
  App.currentUser = null;
  App.wishlist = [];
  App.bookings = [];
  App.isProvider = false;
  Storage.remove('session');
  updateNavAuthState();
  updateWishlistBadge();
  navigateTo('home');
  Toast.show('You have been logged out', 'info');
}

function updateNavAuthState() {
  const authLabel = document.getElementById('nav-auth-label');
  const loginBtn = document.getElementById('nav-login-btn');

  if (authLabel) {
    authLabel.textContent = App.currentUser ? App.currentUser.name.split(' ')[0] : 'Login';
  }

  if (loginBtn) {
    if (App.currentUser) {
      loginBtn.setAttribute('aria-label', 'View your dashboard');
      loginBtn.dataset.page = 'dashboard';
      loginBtn.onclick = () => navigateTo('dashboard');
    } else {
      loginBtn.setAttribute('aria-label', 'Login or Register');
      loginBtn.dataset.page = '';
      loginBtn.onclick = () => openAuthModal('login');
    }
  }
}

/* ============================================================
   17. MODAL HELPERS
   ============================================================ */
function showModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  // Focus first focusable element
  setTimeout(() => {
    const focusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }, 100);

  // Trap focus inside modal
  modal._focusTrap = (e) => {
    if (e.key !== 'Tab') return;
    const focusableEls = modal.querySelectorAll(
      'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener('keydown', modal._focusTrap);

  // Close on Escape
  modal._escHandler = (e) => {
    if (e.key === 'Escape') hideModal(modal);
  };
  document.addEventListener('keydown', modal._escHandler);

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal(modal);
  });
}

function hideModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';

  if (modal._focusTrap) document.removeEventListener('keydown', modal._focusTrap);
  if (modal._escHandler) document.removeEventListener('keydown', modal._escHandler);
}

/* ============================================================
   18. MOBILE NAV
   ============================================================ */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = !mobileNav.hidden;
    mobileNav.hidden = isOpen;
    hamburger.classList.toggle('open', !isOpen);
    hamburger.setAttribute('aria-expanded', (!isOpen).toString());
  });
}

function closeMobileNav() {
  const mobileNav = document.getElementById('mobile-nav');
  const hamburger = document.getElementById('hamburger-btn');
  if (mobileNav) mobileNav.hidden = true;
  if (hamburger) {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
}

/* ============================================================
   19. GLOBAL EVENT LISTENERS
   ============================================================ */
function attachGlobalListeners() {
  // Navigation links (data-page attribute)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;

    const page = link.dataset.page;
    if (!page) return;

    e.preventDefault();

    if (page === 'dashboard' && !App.currentUser) {
      openAuthModal('login');
      return;
    }

    navigateTo(page);
  });

  // Quick search button
  const quickSearchBtn = document.getElementById('quick-search-btn');
  if (quickSearchBtn) {
    quickSearchBtn.addEventListener('click', () => {
      const filters = {
        location: document.getElementById('quick-location')?.value || '',
        activity: document.getElementById('quick-activity')?.value || '',
        rating: document.getElementById('quick-rating')?.value || ''
      };
      navigateTo('discover', { filters });
    });
  }

  // Nav wishlist button
  const navWishlistBtn = document.getElementById('nav-wishlist-btn');
  if (navWishlistBtn) {
    navWishlistBtn.addEventListener('click', () => {
      if (!App.currentUser) {
        openAuthModal('login');
        return;
      }
      navigateTo('dashboard');
      // Switch to wishlist tab
      setTimeout(() => {
        const wishlistTab = document.querySelector('[data-tab="wishlist"]');
        if (wishlistTab) wishlistTab.click();
      }, 200);
    });
  }

  // Newsletter form
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailEl = document.getElementById('newsletter-email');
      if (emailEl && isValidEmail(emailEl.value)) {
        Toast.show('Thanks for subscribing! Eco-travel inspiration incoming 🌿', 'success');
        emailEl.value = '';
      } else {
        Toast.show('Please enter a valid email address', 'warning');
      }
    });
  }

  // Header scroll effect
  window.addEventListener('scroll', throttle(() => {
    const header = document.getElementById('site-header');
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }
  }, 100));
}

/* ============================================================
   20. UTILITIES
   ============================================================ */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

function generateBookingId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `ETCP-${year}-${random}`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch(e) {
    return dateStr;
  }
}

function formatDateInput(date) {
  return date.toISOString().split('T')[0];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ============================================================
   21. APP INITIALIZATION
   ============================================================ */
async function initApp() {
  // Initialize toast system
  Toast.init();

  // Show loading overlay
  const loadingOverlay = document.getElementById('loading-overlay');

  try {
    // Load destinations data
    await loadDestinations();

    // Restore session
    const savedSession = Storage.get('session');
    if (savedSession) {
      App.currentUser = savedSession;
      App.wishlist = Storage.get(`wishlist_${savedSession.email}`) || [];
      App.bookings = Storage.get(`bookings_${savedSession.email}`) || [];

      const savedItinerary = Storage.get(`itinerary_${savedSession.email}`);
      if (savedItinerary) App.itinerary = savedItinerary;

      if (savedSession.accountType === 'provider') App.isProvider = true;
    }

    // Apply saved settings
    const savedSettings = Storage.get('user_settings');
    if (savedSettings) {
      Object.assign(App.settings, savedSettings);
      if (App.settings.theme) applyTheme(App.settings.theme);
      if (App.settings.largeText) document.body.classList.add('large-text');
      if (App.settings.highContrast) document.body.classList.add('high-contrast');
      if (App.settings.reduceMotion) document.body.classList.add('reduce-motion');
    }

    // Initialize nav
    updateNavAuthState();
    updateWishlistBadge();
    initMobileNav();

    // Initialize auth modal
    initAuthModal();

    // Attach global event listeners
    attachGlobalListeners();

    // Navigate to home page
    navigateTo('home');

    // Hide loading overlay
    setTimeout(() => {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }, 800);

  } catch (error) {
    console.error('App initialization failed:', error);
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    Toast.show('Failed to initialize the app. Please refresh.', 'error');
  }
}

/* ============================================================
   22. ENTRY POINT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initApp);
