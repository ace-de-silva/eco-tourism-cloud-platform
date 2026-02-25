<div align="center">

# 🌿 ETCP — Eco-Tourism Cloud Platform

**A full-featured, portfolio-grade sustainable travel booking platform built with zero dependencies.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://ace-de-silva.github.io/eco-tourism-cloud-platform/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-16a34a?style=for-the-badge)](https://www.w3.org/WAI/WCAG21/quickref/)
[![No Frameworks](https://img.shields.io/badge/No%20Frameworks-Vanilla%20Only-f97316?style=for-the-badge)]()

[![Stars](https://img.shields.io/github/stars/ace-de-silva/eco-tourism-cloud-platform?style=social)](https://github.com/ace-de-silva/eco-tourism-cloud-platform/stargazers)
[![Forks](https://img.shields.io/github/forks/ace-de-silva/eco-tourism-cloud-platform?style=social)](https://github.com/ace-de-silva/eco-tourism-cloud-platform/network/members)

[**Live Demo →**](https://ace-de-silva.github.io/eco-tourism-cloud-platform/)&nbsp;&nbsp;|&nbsp;&nbsp;[Report Bug](https://github.com/ace-de-silva/eco-tourism-cloud-platform/issues)&nbsp;&nbsp;|&nbsp;&nbsp;[Request Feature](https://github.com/ace-de-silva/eco-tourism-cloud-platform/issues)

</div>

---

## Overview

ETCP is a production-quality single-page application that connects eco-conscious travelers with verified sustainable tourism experiences worldwide. It directly addresses the **greenwashing problem** in eco-tourism by providing transparent sustainability certifications, real carbon footprint data, and verifiable environmental impact metrics — all without a backend or build tools.

Built as a UX/UI design portfolio piece demonstrating end-to-end product thinking: from user persona research through to accessible, responsive implementation.

---

## Screenshots

> *(Add screenshots here after deploying — see the [GitHub Setup Guide](GITHUB_SETUP_GUIDE.md) for instructions)*

---

## Features

### For Eco-Travelers
| Feature | Description |
|---|---|
| **Eco-Discovery Hub** | Advanced filtering by location, activity, sustainability rating, certification, and price |
| **Destination Profiles** | Full transparency — carbon footprint, renewable energy %, community impact, wildlife protection |
| **ETCP Voyager** | Drag-and-drop itinerary builder with sustainability impact calculator |
| **Eco-Journeys Dashboard** | Manage bookings, wishlist, reviews, and track personal sustainability impact |
| **Eco-Points & Badges** | Gamified responsible travel with earned achievements |

### For Eco-Tourism Providers
| Feature | Description |
|---|---|
| **Eco-Explorer Network (EEN)** | Provider registration, listing management, and verification |
| **Analytics Dashboard** | Booking requests, performance metrics, and sustainability scoring |
| **Certification Management** | Upload and showcase verified eco-certifications |

### Platform
- Simulated booking flow — confirmation, unique booking IDs, eco-tax transparency
- User authentication with registration, login, and session persistence
- LocalStorage-based data persistence (no backend required)
- 4 visual themes: Forest, Ocean, Desert, Dark Mode
- WCAG 2.1 AA accessibility compliance
- Fully responsive: mobile (375px) · tablet (768px) · desktop (1920px)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic) |
| Styling | CSS3 — Grid, Flexbox, Custom Properties |
| Logic | Vanilla JavaScript ES6+ |
| Data | JSON (12 eco-destinations dataset) |
| Storage | LocalStorage API |
| Icons | Font Awesome 6.5 (CDN) |
| Fonts | Google Fonts — Poppins + Open Sans |
| Images | Unsplash (external URLs) |
| Deployment | GitHub Pages |

> **No frameworks. No jQuery. No build tools. No dependencies.**

---

## Destinations (12 Included)

| Destination | Country | Rating | Certifications |
|---|---|---|---|
| Rainforest Canopy Lodge | 🇨🇷 Costa Rica | ⭐⭐⭐⭐⭐ | Green Globe, Rainforest Alliance |
| Sinharaja Forest Retreat | 🇱🇰 Sri Lanka | ⭐⭐⭐⭐⭐ | Green Globe, EarthCheck |
| Aurora Geothermal Retreat | 🇮🇸 Iceland | ⭐⭐⭐⭐⭐ | EarthCheck, Nordic Swan |
| Fiordland Conservation Lodge | 🇳🇿 New Zealand | ⭐⭐⭐⭐⭐ | Green Globe, Qualmark Gold |
| Masai Mara Eco Safari Camp | 🇰🇪 Kenya | ⭐⭐⭐⭐ | Rainforest Alliance |
| Hardangerfjord Nature Cabin | 🇳🇴 Norway | ⭐⭐⭐⭐⭐ | Nordic Swan |
| Tiger's Nest Mountain Lodge | 🇧🇹 Bhutan | ⭐⭐⭐⭐⭐ | Green Globe |
| Galápagos Marine Research Station | 🇪🇨 Ecuador | ⭐⭐⭐⭐⭐ | Rainforest Alliance, UNESCO |
| Amazon River Eco-Lodge | 🇵🇪 Peru | ⭐⭐⭐⭐ | Rainforest Alliance |
| Lemur Valley Wildlife Sanctuary | 🇲🇬 Madagascar | ⭐⭐⭐⭐ | Rainforest Alliance, IUCN |
| Bay of Fires Off-Grid Retreat | 🇦🇺 Tasmania | ⭐⭐⭐⭐⭐ | EarthCheck |
| Cairngorms Highland Eco-Hotel | 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland | ⭐⭐⭐⭐ | Green Tourism Gold |

---

## Project Structure

```
eco-tourism-cloud-platform/
│
├── index.html              # SPA shell — all views and modals
├── styles.css              # Design system + all component styles
├── script.js               # Full application logic, SPA routing, features
│
├── data/
│   └── destinations.json   # 12 eco-destination records
│
├── README.md               # Project documentation
└── GITHUB_SETUP_GUIDE.md   # Step-by-step GitHub deployment guide
```

---

## Local Setup

No build process required.

```bash
# Clone the repository
git clone https://github.com/ace-de-silva/eco-tourism-cloud-platform.git
cd eco-tourism-cloud-platform
```

Then run a local server (required — `fetch()` is blocked on `file://` URLs):

```bash
# Option A: Python (built-in on most systems)
python -m http.server 8080
# Visit: http://localhost:8080

# Option B: Node.js live-server (auto-reloads on save)
npx live-server

# Option C: VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

---

## Deployment — GitHub Pages

See the full step-by-step guide: **[GITHUB_SETUP_GUIDE.md](GITHUB_SETUP_GUIDE.md)**

Quick version:

1. Push this repo to GitHub (public)
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch → main → / (root)**
4. Save — live in ~2 minutes at `https://ace-de-silva.github.io/eco-tourism-cloud-platform/`

---

## Testing Checklist

<details>
<summary><strong>Traveler Flow</strong></summary>

- [ ] Homepage loads with featured destinations
- [ ] Quick search bar filters results in real time
- [ ] Discover page: filters work in combination (location + activity + rating + certification)
- [ ] Grid / List view toggle works
- [ ] Destination card → opens full detail page
- [ ] Detail page shows sustainability data, carbon meter, reviews
- [ ] Register new account → login flow completes
- [ ] Add destination to wishlist → appears in Dashboard wishlist tab
- [ ] Open booking modal → select dates → confirm booking
- [ ] Booking confirmation modal shows reference number
- [ ] Dashboard shows confirmed booking with all details
- [ ] Impact tab shows earned eco-points and badges
- [ ] Voyager: add 3+ destinations → sustainability summary updates
- [ ] Export itinerary downloads a JSON file
- [ ] Settings: theme switch (Forest / Ocean / Desert / Dark)
- [ ] Settings: large text and high contrast toggles work
- [ ] Logout → session cleared

</details>

<details>
<summary><strong>Provider Flow</strong></summary>

- [ ] Register as Provider account type
- [ ] Provider dashboard loads with sample analytics
- [ ] Add Listing form: fill all fields → submit
- [ ] New listing appears in My Listings tab
- [ ] Provider bookings tab shows sample data

</details>

---

## Roadmap

### Phase 2
- [ ] Interactive map (Leaflet.js — no API key required)
- [ ] Drag-and-drop itinerary reordering
- [ ] PWA support — offline capability, installable
- [ ] Print-friendly / PDF itinerary export

### Phase 3
- [ ] Backend API (Node.js/Express or Firebase)
- [ ] Real payment integration (Stripe)
- [ ] Email notifications (SendGrid)
- [ ] Carbon offset program (Gold Standard API)
- [ ] Multilingual support (i18next)

---

## Accessibility

Built to WCAG 2.1 AA standards:

- Color contrast ratio minimum **4.5:1** across all text
- All interactive elements have descriptive **ARIA labels**
- Full **keyboard navigation** (Tab, Enter, Escape, Space, Arrow keys)
- Visible **focus indicators** on all focusable elements
- **`aria-live`** regions for all dynamic content updates
- Touch targets minimum **44×44px** (WCAG 2.5.5)
- **High contrast mode** and **large text mode** in Settings

---

## Portfolio Context

**Skills demonstrated:** UX Research · Persona Development · User Journey Mapping · Wireframing · High-Fidelity Prototyping · WCAG Compliance · Responsive Design · JavaScript SPA Architecture · LocalStorage API · CSS Design Systems

This project implements user personas — eco-conscious international traveler *Anna Müller* and eco-lodge provider *Saman Perera* — directly into working product features, demonstrating requirements engineering from research through to delivery.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Built with 💚 for sustainable travel.

**ETCP — Because every journey leaves a mark.**

</div>
