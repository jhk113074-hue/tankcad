# Changelog

All notable changes to the **YSACC TANK CAD** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.9] - 2026-10-01

### Added & Improved
- **3D 등각 조감도 (3D Isometric Axonometric View) 전격 탑재**:
  - 평면도, 콘크리트 패드도, 정면도, 측면도 등 기존 2D 뷰 데이터를 기반으로 3D 공간 좌표를 표준 30° 축측 등각 투영(Isometric Projection)하여 입체 도면 생성.
  - 패널 프레임 외곽, 볼트 플랜지 격자선, 다이아몬드/직사각형 엠보싱 리브(Rib), 지붕 상부 맨홀 및 통기구(Vent), 콘크리트 기초 패드, 하부 베이스 프레임 스키드(Channel Skid), 사다리(Ladder) 및 배관 노즐(Nozzle) 돌출 파이프/플랜지 형상까지 3D 입체 투영으로 완벽 묘사.
- **A1 종합 조립도(ASM DWG) 및 전용 3D 등각도(ISO DWG) 지원**:
  - **옵션 2 완벽 반영**: A1 종합 조립도 시트 우측 하단에 `VIEW 5: 등각 조감도 (3D ISOMETRIC VIEW)` 자동 배치.
  - A1 도면 시트 종류에 `등각 조감도 (3D ISOMETRIC DWG)` 단독 전체 시트 옵션 추가: 큼직한 축척으로 3D 조감도만을 돋보이게 단독 출력/도면화 가능.
  - 도면 뷰 타이틀 버블 및 가로/세로/높이 입체 치수선(Isometric Dimensions) 자동 표기.

---

## [1.2.8] - 2026-09-30

### Added & Improved
- **마지막 도면 상태 자동 기억 및 복원 (Persistence with LocalStorage)**:
  - 브라우저를 닫거나 새로고침하더라도 직전에 작업하던 모든 파라미터(길이/폭/높이 분할, 재질, 보강 방식, 패널 종류 변경, 노즐 배치, 표제란 입력값 등)를 `localStorage`에 자동 저장하고 완벽하게 복원.
- **실시간 URL 양방향 동기화 (URL State Synchronization)**:
  - 도면 값이 변경될 때마다 브라우저 주소창의 URL(Query string 및 Hash)이 실시간으로 자동 갱신(`history.replaceState`).
  - URL 파라미터(`?L=...&W=...&H=...`) 또는 인코딩된 상태 해시(`#s=...`)를 통해 도면을 즉시 복원 가능.
  - 상단 툴바에 **`🔗 공유 링크`** 버튼 추가: 원클릭으로 현재 작업 중인 도면의 전체 구성이 담긴 URL을 클립보드에 복사하여 동료나 고객에게 그대로 공유 가능.

---

## [1.2.7] - 2026-09-30

### Added & Improved
- **콘크리트 패드 평면도(CONCRETE PAD PLAN) 전체 치수 연속 표시 (Pad Sizes & Gap Dimensions)**:
  - 첫 번째 패드부터 마지막 패드까지 누락 없이 모든 콘크리트 패드의 크기(폭: 400, 350, 350, ... 400)를 상단 치수선에 표시.
  - 패드 사이의 모든 순간격(Clear Gap: 625, 650, 650, ... 625) 치수를 상단 치수선에 연속 체인(Chain Dimension)으로 표기.
  - 기존 폭 중복 필터링(`seen[w]`)으로 인해 1, 2번째 패드만 나오고 나머지 패드 및 간격이 표시되지 않던 문제 완전 해결.
  - 하단 치수선에는 각 패드의 중심간격(C.T.C Pitch 1000mm) 및 전체 패드 외곽 치수를 함께 제공하여 시공 및 검측에 최적화.

---

## [1.2.6] - 2026-09-30

### Added & Improved
- **배관 노즐 명칭 표준 약어 적용 (IN / OUT / OV / DR / FR)**:
  - 도구 팔레트 및 배관 노즐 마커, 인스펙터 카드에 표준 엔지니어링 약어 적용:
    - 유입구: `💧 IN` (Inlet)
    - 유출구: `🚰 OUT` (Outlet)
    - 월류관: `🌊 OV` (Overflow)
    - 드레인: `⬇️ DR` (Drain)
    - 소방용수: `🚒 FR` (Fire)
    - 노즐삭제: `❌ DEL` (Delete)
- **한 판넬 내 2개 피팅(노즐) 동시 설치 지원 (Dual Fittings Per Panel)**:
  - 동일한 패널 셀에 2개의 피팅/노즐을 함께 배치할 수 있도록 기능 확장 (예: OUTLET + DRAIN 또는 2개의 토출구).
  - 셀 클릭 시 자동으로 좌(-250mm, 26%) 및 우(+250mm, 74%)로 대칭 분할 배치.
  - 측면뷰 격자에서 2개의 노즐 마커가 나란히 표시되며 각각 개별 클릭하여 선택 및 편집 가능.
  - 인스펙터 카드에 `수평 위치` 선택 필드(`◀ 좌 (-250)`, `● 중앙 (0)`, `▶ 우 (+250)`) 추가.
  - 2D CAD 도면 및 DXF 내 플랜지/소켓, 볼트 홀, 지시선이 간섭 없이 좌우 오프셋으로 정밀하게 렌더링.
- **설치 높이(EL) 상하 화살표 미세조정 버튼 & 키보드 지원**:
  - `설치 높이 (EL)` 입력 상자 우측에 일체형 상·하 스텝 버튼(`▲`, `▼`) 추가 (클릭 시 ±50mm 단위 즉시 미세조정).
  - 키보드 `ArrowUp` / `ArrowDown` 키로도 50mm 단위 미세조정 지원.
- **배관 기능 마스터 ON/OFF 토글 스위치 (Piping Feature Toggle)**:
  - 측면 편집 탭 상단 헤더에 `💧 배관 ON/OFF` 마스터 스위치 추가.
  - 2D CAD 캔버스 상단 툴바에 `💧 배관` 레이어 칩 추가 (상호 연동).
  - OFF 설정 시 2D CAD 도면 시트, 입면도, 평면도 및 DXF/DWG 내보내기에서 모든 배관 노즐 및 `NOZZLE SCHEDULE` 일람표가 완벽하게 숨김 처리.

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
