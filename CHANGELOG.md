# Changelog

All notable changes to the **YSACC TANK CAD** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.2] - 2026-09-30

### Fixed
- Fixed side layout grid containment bug where redundant closing tags pushed the CAD drawing canvas below the sidebar. Restored side-by-side grid layout.

---

## [1.2.1] - 2026-09-30

### Added
- **Streamlined Side Elevation Editing (측면편집)**:
  - Renamed tab to `📐 측면편집` and redesigned into a clean, intuitive single-screen interface matching the Plan Editor.
  - Side panel type switching: Standard embossed (`기본`), Flat (`평판`), and Large-Bore (`대구경`) panels on elevation grids.
  - 2D CAD and DXF export support for flat plate relief and circular reinforced large-bore boss openings.
  - Compact 1-line mini inspector bar for instant editing of nozzle size, connection type, and EL.
  - Collapsible Nozzle Schedule table accordion to eliminate clutter and scrolling.
- **Partition and Multi-compartment Support**:
  - Independent INLET placement per compartment on multi-compartment tanks.
  - Visual partition wall markers on both Plan Editor and Elevation grids.
- **Dimension Restoration**:
  - Restored expected dimension order and default inputs (Row 1: 길이/LENGTH 5000, Row 2: 폭/WIDTH 3000+2000).

---

## [1.2.0] - 2026-09-30

### Added
- **Nozzle & Pipe Interactive Placement**:
  - Interactive nozzle placement UI with support for 4 nozzle types (N1 Inlet, N2 Outlet, N3 Overflow, N4 Drain).
  - Configurable nominal diameters (40A~300A), connection types (FLANGE 10K, SOCKET), and 3D coordinate/elevation offsets.
  - Automatic orthogonal projection onto Front View, Side View, and Roof/Top plan.
  - Automatic **NOZZLE SCHEDULE** table rendered in the A1 drawing sheet above the Title Block.
- **Git & Zero-Config Deployment**:
  - Full Git repository setup and tracking.
  - One-click Vercel static deployment via `vercel.json` and `.vercelignore`.
  - Automated GitHub Pages CI/CD workflow (`.github/workflows/deploy.yml`).
  - Docker containerization (`Dockerfile`, `docker-compose.yml`) for on-premise and VPS deployment.
  - Dedicated deployment manual (`DEPLOY.md`).

### Fixed
- Fixed height selection reset bug (`fillHeights`) that caused elevation views to temporarily disappear.
- Fixed Vercel deployment failure by ignoring local Python backend scripts and serving purely static CAD client assets.

---

## [1.1.0] - 2026-09-30

### Added
- **UI/UX Modernization**:
  - 4-tab sidebar navigation (Specifications, Plan Editor, Title Block & Notes, BOM Summary).
  - CAD Viewport HUD displaying active drawing type and real-time cursor coordinates (`X, Y mm`).
  - Dark / Light mode toggle.
  - Sidebar toggle button to maximize canvas working space.
  - Direct single-file DXF (`.dxf`), PNG canvas capture, and SVG download buttons.
- **Visual Enhancements**:
  - High-contrast visual indicators for Manholes (orange lid with handle and badge), Air Vents (blue concentric circles with crosshair), Ladders (green edge highlight), and Internal Columns.
  - Dynamic scaling for dimensions (`3.0mm` paper standard across all scales).
  - Title Block Remarks/Notes font and spacing overhaul for readability.
- **Multi-view Center Alignment**:
  - Center-alignment engine calculating unified bounding box across 4 views (Plan, Concrete Pad, Front Elevation, Side Elevation) to ensure symmetrical margins on standard A1 sheets.
  - Multi-step scale selection dropdown (1/10 to 1/300).

### Fixed
- Fixed UTF-8 character encoding on Windows CP949 locales by enforcing HTML5 standards and UTF-8 charset declarations.
- Corrected DXF/DWG newline duplication (`\r\r\n` CRLF) during ODA File Converter batch conversions.

---

## [1.0.0] - 2026-09-30

### Added
- Initial web release ported from legacy VC6 MFC C++ tank CAD systems (HighTank, KORVAN TANK).
- Pure JavaScript CAD core engine (`TankCore` in `web/tank.js`).
- Parametric tank modeling (SMC and STS materials; external frame, internal angle, and stay reinforcement).
- A1 standard drawing assembly generation (Plan, Foundation Pad, Front/Side elevations, Title Block).
- Panel template parsing and rendering from `panel_templates.json` and `side_templates.json`.
- Standard AutoCAD DXF R12 export with Korean text unicode escaping (`\U+XXXX`).
- Local Python backend server (`server.py`) with SQLite panel database and ODA File Converter integration.
