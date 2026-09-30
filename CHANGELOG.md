# Changelog

All notable changes to the **YSACC TANK CAD** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.5] - 2026-09-30

### Changed & Improved
- **측면편집 UI 직관성 & 상식적인 레이아웃 전면 개편 (Ergonomic Grid Palette Overhaul)**:
  - **줄바꿈 현상 완전 해결**:
    - 방향 세그먼트: `🏢 정면(Front)`, `🏢 우측면(Right)`, `🏢 배면(Rear)`, `🏢 좌측면(Left)`을 4열 균등 그리드(아이콘+한글 / 영문 보조)로 재배치하여 좁은 화면에서도 1행에 완벽 정렬.
    - 판넬 도구: `🔲 기본`, `⬜ 1×1 평판`, `🪟 0.5×1 (2장)`, `⭕ 피팅판넬`을 4열 1행 전체 너비 그리드로 정렬하여 외톨이 버튼 없이 깔끔하게 표시.
    - 배관 도구: `💧 유입구`, `🚰 유출구`, `🌊 월류관`, `⬇️ 드레인`, `🚒 소방용수`, `❌ 노즐삭제`를 3열 2행 균등 그리드로 정렬하여 가독성과 클릭 안정성 극대화.
  - **시각적 계층 구조 명확화**:
    - 복잡하게 섞여 있던 판넬 및 배관을 명확한 섹션 타이틀(`🔲 판넬 종류 선택`, `💧 배관 노즐 선택`)로 구분하여 인지 부하 감소.
  - **안내 문구 간결화**: 직관적이고 쉬운 도움말 문구로 정리.

---

## [1.2.4] - 2026-09-30

### Added & Improved
- **측면 판넬 4종 세분화 지원 (`기본`, `1x1m평판`, `0.5x1m평판2장`, `피팅판넬`)**:
  - `1x1m평판`: 1000×1000mm 단일 평판 패널 전환 및 CAD/DXF 상세 외곽/내측 마진 라인 렌더링.
  - `0.5x1m평판2장`: 중앙 수직 접합 플랜지 라인 및 좌/우 500mm 2분할 평판 패널 구현 (UI 격자 및 CAD 도면/DXF 완벽 반영).
  - `피팅판넬` (구 대구경판넬 명칭 및 기능 고도화): 대구경 피팅용 원형 보강 리브 및 볼트 PCD 홀 렌더링.
- **평면도 편집 모드 전면 고도화 (`plan-tool-card`, `plan-grid-card`)**:
  - 3열 그리드 형태의 모던 칩 도구 팔레트 (`❌ 패널삭제`, `🔘 맨홀`, `💨 에어벤트`, `🪜 사다리`, `💧 급수구`, `🏛️ 기둥`).
  - 어색한 라디오 원형 버튼 `(○)`을 제거하고 전용 색상 테마의 직관적인 클릭 피드백 제공.
  - 상단 헤더 우측 `[🔄 편집 초기화]` 버튼 일체화로 불필요한 줄바꿈 제거.
  - 칸막이 구획 표시 바 (`planCompHeader`) 모던 캡슐 디자인 적용 및 격자 칸막이 배지 위치 최적화.

---

## [1.2.3] - 2026-09-30

### Changed & Improved
- **측면편집 UI 대폭 고도화 (Modern Ergonomic UI Overhaul)**:
  - **4면 방향 세그먼트 컨트롤 (`face-seg-control`)**: 정면, 우측면, 배면, 좌측면 전환 버튼을 컴팩트한 일체형 세그먼트 바로 재구성하여 줄바꿈 없이 한눈에 조작 가능.
  - **직관적 2행 도구 팔레트 카드 (`side-tool-card`)**: 라디오 원형 버튼을 제거하고, `판넬` (기본/평판/대구경) 및 `배관` (유입/유출/월류/배수/소방/삭제)을 색상별 테마 칩으로 분리 정리.
  - **측면뷰 패널 격자 카드 (`elev-grid-card`)**: 정돈된 헤더와 센터 정렬 패널 격자, 베이스 프레임 & 콘크리트 패드 일체형 비주얼 제공.
  - **고도화 노즐 인스펙터 카드 (`noz-inspector-card`)**: 노즐 선택 시 뱃지와 함께 3열 정렬(구경, 연결타입, EL) 및 원클릭 빠른 EL 프리셋 버튼(바닥 100, 소방 200, 토출 300, 월류 H-200, 유입 H-300) 탑재.
  - **접이식 배관 노즐 일람표 (`noz-sched-details`)**: 깔끔한 아코디언 스타일로 접어둘 수 있어 사이드바 공간을 극대화.

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
