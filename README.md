# 🍕 Oasis Royale — 3D Interactive & Real-Time WebAR Dining

> **A luxury pizza restaurant web app that brings dishes to life right on your table using WebAR (WebGL, Scene Viewer, Quick Look) and synchronizes order states in real-time.**
>
> 🚀 **Live Site**: [oasisroyale-res.netlify.app](https://oasis-royale.netlify.app/) (Next.js 15 + Netlify + Supabase)

---

## ⚡ 30-Second Overview (TL;DR)

Oasis Royale is a high-performance web application designed for mobile-first interactive dining. It replaces static restaurant layouts with responsive, unlit-textured 3D models and native WebAR previews. 

### Key Highlights:
*   **Zero-Crash 3D Singleton Canvas**: Guarantees exactly **one (1)** WebGL context inside the DOM at any millisecond. As users scroll the menu, a single `<model-viewer>` instance is dynamically reparented to target cards, avoiding mobile browser crashes and context loss.
*   **Native WebAR**: iPhone users tap to launch **AR Quick Look** (native USDZ files served at build-time); Android users tap to launch **Google Scene Viewer** (or a premium 3D fallback if ARCore is missing).
*   **Real-time Order Stepper**: Live synchronization from database to table using **Supabase Postgres Change WebSockets**—tracking orders through *Pending ➔ Processing ➔ Ready ➔ Completed* (with a dynamic red *Cancelled* stage if rejected).
*   **Kitchen Audio System**: Responsive audio cues utilizing the Web Audio API for kitchen updates, order alerts, and status change beeps.

---

## 🛠️ The Tech Stack

*   **Framework**: Next.js 15 (App Router, dynamic route caching)
*   **Database & Real-time**: Supabase (PostgreSQL with Row Level Security & Real-time presence)
*   **3D Rendering**: `@google/model-viewer` + `three.js` (WebGL reparenting singleton pattern)
*   **Styling & Animations**: TailwindCSS + Framer Motion
*   **Hosting**: Netlify (Edge functions and production deployments)
*   **Models**: Pre-optimized `.glb` (Android) and `.usdz` (iOS) models (Draco / KTX2 compressed to <1.2MB per model)

---

## 📂 Repository File Structure

Organized cleanly to keep the root directory clutter-free and easy to navigate for reviewers:

```
Oasis Royale/
├── src/                    # Main Application Source Code
│   ├── app/                # Pages and API Route Handlers (Menu, Admin, Dispatch, Track)
│   ├── components/         # Reusable UI & Layout Components (MenuCard, Footer, Stepper)
│   ├── hooks/              # Custom React Hooks (useCardVirtualization, useOrderSound)
│   ├── lib/                # Shared utilities & configurations (AR Singleton, Supabase, network)
│   └── middleware.ts       # Secure table session locking middleware
├── public/                 # Static Assets
│   └── models/             # Pre-compiled, pivot-fixed GLB and USDZ 3D models
├── docs/                   # Documentation & Product Specifications
│   └── development/        # Speclists, PRDs, TRDs, and AR Setup Guides (moved from root)
├── migrations/             # Supabase Schema Migration scripts
├── scripts/                # Node.js & Python utilities for 3D model compression and pivot correction
├── package.json            # Dependencies & Project metadata
├── tsconfig.json           # TypeScript configuration
├── netlify.toml            # Netlify deployment configurations
└── LICENSE                 # Open-source MIT License
```

---

## 🍕 Core Features & How They Work

### 1. The Singleton AR Canvas & Virtualization
Loading multiple 3D renderers on mobile devices will quickly exceed the browser's 80MB JS heap budget, leading to page crashes. 
Oasis Royale solves this via the **Singleton AR Canvas Reparenting Pattern**. A single persistent WebGL context lives in global memory. When a user clicks **"Tap to Interact"** on a menu card, the canvas is instantly moved (`appendChild`) inside that card container. An `IntersectionObserver` hook listens to viewport changes: if an active card scrolls out of view, the canvas is automatically detached and cleaned up.

### 2. Live Supabase Synchronization
When an order is submitted:
1. It registers in the `orders` PostgreSQL table via RLS (Row Level Security).
2. The customer's device opens a secure realtime WebSocket channel listening specifically to changes on their `session_id`.
3. The Kitchen and Dispatch dashboards instantly update without reloading.
4. When the kitchen moves status from `pending` to `processing`, the customer's page automatically switches the header from "Pay at Counter" to "Payment Confirmed" and fires a tone notification.

### 3. Build-Time USDZ & GLB Pipeline
To bypass heavy client-side conversion, all 3D assets are pre-built. GLB files are optimized with Draco compression for Android devices. They are paired with matching USDZ exports (re-textured as fully unlit to preserve rich colors under iOS quick look lighting constraints). If the customer is on an iPhone, the site utilizes native `<a rel="ar" href="...">` formatting to launch iOS AR Quick Look instantly.

---

## 🚀 Local Setup & Installation

Get the project running on your machine in 3 steps:

### 1. Clone the repository
```bash
git clone https://github.com/Huzaifa-Siddique/oasisroayel.git
cd oasisroayel
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional, for admin overrides)
```

### 3. Install Dependencies & Run
```bash
# Install dependencies with legacy peer resolutions
npm install --legacy-peer-deps

# Run the local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📜 License
Licensed under the [MIT License](LICENSE).



