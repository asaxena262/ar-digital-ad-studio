# AR Digital Ad Studio

## Project Overview

A static HTML marketing website for AR Digital Ad Studio (ardigitaladstudio.in), a digital marketing agency in Pilibhit, Uttar Pradesh, India. The site includes 9 pages: home, about, services overview, and 6 service-specific pages.

## Architecture

- **Type:** Static HTML website served via a Node.js HTTP server
- **Language:** HTML, CSS, JavaScript (vanilla)
- **Server:** Custom Node.js HTTP server (`server.js`) — no frameworks or build tools
- **Port:** 5000 (0.0.0.0)
- **Font:** Inter (Google Fonts)
- **Icons:** Lucide Icons CDN

## Project Structure

```
/
├── index.html                    # Home page
├── about.html                    # About page
├── services.html                 # Services overview
├── seo-services.html             # SEO services page
├── google-ads-ppc.html           # Google Ads/PPC page
├── facebook-instagram-ads.html   # Facebook/Instagram Ads page
├── content-marketing.html        # Content Marketing page
├── social-media-marketing.html   # Social Media Marketing page
├── web-development.html          # Web Development page
├── server.js                     # Node.js HTTP server
├── sitemap.xml                   # SEO sitemap
├── robots.txt                    # SEO robots file
├── Style/
│   ├── style.css                 # Main stylesheet (minimalist dark theme)
│   ├── animations.css            # Animation keyframes (minimal)
│   └── responsive.css            # Responsive breakpoints
├── js/
│   └── main.js                   # Vanilla JS (nav, accordion, counter, etc.)
├── images/
│   ├── hero.webp                 # Hero image (43 KB, converted from 591 KB PNG)
│   ├── about.webp                # About image (35 KB, converted from 468 KB PNG)
│   ├── services.webp             # Services image (66 KB, converted from 700 KB PNG)
│   └── favicon.ico / *.png      # Favicon files
└── Content/                      # Content/copy documents
```

## Design System

- **Theme:** Minimalist dark (default), light mode toggle supported
- **Background:** `#0C0C0C`
- **Surface:** `#141414`
- **Card:** `#181818`
- **Accent:** `#FF6B35` (orange)
- **Text:** `#FFFFFF` / `#D4D4D4` / `#737373` (muted)
- **Border:** `rgba(255,255,255,0.07)`
- **Radius:** 6px / 12px / 20px
- **No decorative elements:** No particles, blobs, shapes, or heavy gradients

## SEO

- **Domain:** ardigitaladstudio.in
- **Geo meta tags:** IN-UP, Pilibhit
- **Schema.org:** LocalBusiness, ProfessionalService, FAQPage, WebSite, BreadcrumbList
- **OG/Twitter:** All pages optimized with .webp images
- **Sitemap:** sitemap.xml with all 9 pages
- **Canonical:** All 9 pages have canonical URLs

## CSS Variables

```css
--clr-bg, --clr-surface, --clr-card, --clr-card-hover
--clr-border, --clr-border-hover
--clr-text, --clr-text-soft, --clr-muted
--clr-accent, --clr-accent-dark, --clr-accent-dim
--nav-h: 68px, --container: 1160px
```

## JavaScript Features

- Theme toggle (dark/light)
- Navbar scroll effect + mobile hamburger
- Scroll reveal animations (IntersectionObserver)
- Animated stat counters
- Testimonials slider with auto-advance
- FAQ accordion
- Back to top button
- Smooth scroll for anchors
- Contact form validation
- Scroll progress bar
- Process timeline scroll-activation

## Running the App

```bash
node server.js
```

## Workflow

- **Start application**: `node server.js` — serves the site on port 5000

## Deployment

Configured as **autoscale** deployment with `node server.js` as the run command.

## Dependencies

- `sharp` (npm, dev-only) — used to convert PNG images to WebP format
