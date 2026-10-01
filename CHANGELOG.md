# Changelog

All notable changes to the **YSACC TANK CAD** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.2] - 2026-10-01

### Fixed (3D ISOMETRIC 렌더링 화면 블랙스크린 / NaN 좌표 오류 긴급 패치)
- **전면 노출 벽체 3D 투영 좌표 인자 누락 결함 수정**:
  - `web/tank.js`의 전면 벽체 렌더링 루프에서 `toIso(x0 + w, y0 + h)`와 `toIso(x0, y0 + h)`에 $Z$축 좌표(`z0 + h`)가 누락되어 $Z$가 `undefined`로 전달되던 오타 수정.
  - $Z$ 누락으로 인해 $Y_{iso}$ 좌표가 `NaN`으로 계산되어 캔버스 바운딩 박스(Bounding Box)와 자동 줌(Zoom Scale) 계산이 `NaN`으로 붕괴하여 화면에 아무 도면도 나오지 않던(검은 화면) 문제 완벽 해결.
- **5뷰 종합 조립도(Assembly Sheet) 뷰 배치 안전성 강화**:
  - `sheetKind` 미지정 또는 기본 호출 시에도 안전하게 조립도 5개 뷰 영역 크기를 체크하여 `NaN`이 발생하지 않도록 방어 코드 보강.

---

## [1.5.1] - 2026-10-01

### Fixed & Enhanced (평면도 패널 편집 시 3D ISOMETRIC 측면 및 벽체 동적 연동 구현)
- **3D ISOMETRIC 벽체 동적 연동 엔진 탑재 ("벽이 움직여야 합니다" 요구사항 완벽 해결)**:
  - 기존에는 탱크 외곽이 무조건 $totalL \times totalW$ 사각형으로 고정되어, 평면도 편집 모드에서 패널을 삭제(L자형, T자형, 계단형 등)해도 측면 벽체가 허공에 남아 있거나 단차 벽체가 누락되던 한계 해결.
  - **전면 노출 벽체 동적 생성**: 셀 $(i, j)$의 전면($i - 1$)에 패널이 없는 모든 구간($Y = map.ys[i]$)에 전면 벽체, 수평/수직 플랜지 리브, 하부 바닥 플랜지를 자동 생성.
  - **우측 노출 벽체 동적 생성**: 셀 $(i, j)$의 우측($j + 1$)에 패널이 없는 모든 구간($X = map.xs[j + 1]$)에 우측 벽체, 수평/수직 플랜지 리브, 하부 바닥 플랜지를 자동 생성.
  - **L자형/단차형 벽체 이동 완벽 지원**: 예컨대 우측 상단 패널 삭제 시, 우측 벽체가 패널이 끝나는 $X$ 좌표로 즉시 이동하여 단차 타워의 벽체와 내부 모서리를 완벽 폐합 렌더링.
- **베이스 찬넬 및 기초 콘크리트 패드 동적 연동**:
  - 베이스 찬넬이 실제로 존재하는 노출 벽체 하부만을 정밀하게 따라가도록 동적 배치.
  - 기초 콘크리트 패드 보 또한 `runsForStrip`을 기반으로 패널이 존재하는 구간에만 정확히 설치되고 단차에 맞춰 마감 단면 렌더링.
- **배관 노즐 및 결속 보강선 동적 부착**:
  - 패널 삭제로 벽체 위치가 이동할 때, 전면/우측 노즐과 보강선이 이동된 실제 벽체 표면에 자동으로 밀착 부착.

---

## [1.5.0] - 2026-10-01

### Fixed & Enhanced (3D ISOMETRIC 콘크리트 패드 기초 및 베이스 찬넬 입체 완벽 보완)
- **3D 입체 콘크리트 패드 보(Concrete Pad Beam) 정밀 구현**:
  - **전면 돌출부 3D 솔리드 입체화**: 기존에 전면 평면 2D 사각형으로만 보이던 각 패드 보의 전면 돌출 구간($Y = -200 \sim 0$)에 **우측 측면(Right Face) 및 상부면(Top Face)**을 모두 렌더링하여 두께와 깊이를 갖춘 완전한 3D 콘크리트 블록으로 전환.
  - **우측 최외곽 패드 보 전구간 렌더링**: 우측벽 하부($X = totalL + 200$)에서 전면 끝단부터 후면 끝단($Y = -200 \sim totalW + 200$)까지 이어지는 **장축 콘크리트 패드 보의 전체 우측면, 상부 노출면, 후면 마감 단면**을 완벽 렌더링하여 우측벽이 공중에 떠 보이던 결함 해결.
- **콘크리트 앙카 클립 & 볼트 디테일 추가**:
  - 전면 및 우측면 콘크리트 패드 상부면에 베이스 찬넬을 고정하는 **스틸 앙카 클립 플레이트와 볼트/너트 체결부**를 입체 투영.
- **베이스 스틸 찬넬(Skid Channel) 및 지면선(GL) 보강**:
  - 베이스 찬넬(100mm)에 C-Channel 형강 웨브/플랜지 단차선을 추가하여 철골 프레임 시각적 완성도 향상.
  - 기초 패드가 안착하는 $Z = -600$ 높이에 지면 기준선(GL Line) 배치.
  - 우측 폭 치수선($W$)이 우측 콘크리트 패드 외곽($X_R$)을 기준으로 깔끔하게 정렬되도록 오프셋 자동 조정.

---

## [1.4.9] - 2026-10-01

### Fixed & Enhanced (천정판넬 내향 플랜지 규격 반영: 60mm 길이, 6mm 두께, 외부 돌출 제거)
- **천정판넬(Roof Panel) 내향 플랜지(Internal Flange) 구조 완벽 구현**:
  - 실제 SMC 물탱크 설계 기준에 맞춰, 지붕 판넬의 플랜지는 배수 및 평면성을 위해 탱크 안쪽(하향)으로 체결되므로 **지붕 밖(상향 및 외곽)으로 돌출되는 플랜지 리브 및 테두리 처마선을 완전 배제**.
  - 지붕 윗면($Z=H$)을 평면으로 깔끔하게 정돈하고, 판넬 조립 줄눈(Seam Line)과 엠보싱 다이아몬드 능선만 단정하게 렌더링.
- **천정판넬 전용 플랜지 규격 정밀 반영**:
  - **플랜지 길이(폭)**: 벽체(75mm)와 구분되는 천정 전용 **60mm** 플랜지 여백(`fm = 60`) 적용.
  - **플랜지 두께**: 천정 규격 **6mm** 두께 적용.
- **벽체 수직 리브 및 코너 플랜지 상단 정돈**:
  - 벽체의 75mm 외향 플랜지 및 코너 브라켓이 지붕 높이($Z=H$)에 정확히 안착하며 일체감 형성.

---

## [1.4.8] - 2026-10-01

### Fixed & Enhanced (SMC 실규격 75mm 플랜지 돌출폭 및 10mm 판두께 반영, 코너 플랜지 입체 가시성 개선)
- **실제 SMC 표준 플랜지 규격 정밀 반영**:
  - **플랜지 돌출폭(Flange Depth)**: 45mm -> **75mm**로 업데이트 (벽체 간 맞댐 리브 및 외곽 돌출폭).
  - **플랜지 판두께(Flange Thickness)**: **10mm** 이중선 및 테두리 두께선 완벽 렌더링.
  - **개별 판넬 내부 플랜지 여백(Inner Flange Margin)**: 35mm -> **75mm**로 업데이트 (전면벽, 우측벽, 지붕 모든 판넬 테두리에 75mm 플랜지 마진 적용).
- **수직 외곽 코너 플랜지(Corner Flange) 가시성 버그 해결**:
  - 기존 투영 수식 상 코너 외곽 돌출이 $(totalL+FD, -FD)$로 계산되어 아이소메트릭 X축 투영 시 0으로 상쇄(Center Line과 중첩)되어 보이지 않던 문제 완벽 해결.
  - 전면 코너 플랜지($\Delta X_{iso} = -65$px 좌측 돌출)와 우측 코너 플랜지($\Delta X_{iso} = +65$px 우측 돌출) 및 중앙 능선, 10mm 두께선, 각 단(Tier)별 체결 브라켓을 선명하게 입체 렌더링.
- **상부 및 하부 플랜지 입체 보강**:
  - 상단 지붕 처마 75mm 돌출 및 10mm 두께 플랜지 라인 구현.
  - 바닥 기초 플랜지 75mm 돌출 및 10mm 두께 하향선 구현.

---

## [1.4.7] - 2026-10-01

### Added & Enhanced (3D ISOMETRIC 도면 내 SMC 3D 외부 돌출 플랜지 리브 구현)
- **SMC 탱크 3D 외부 돌출 플랜지(External Flange Ribs) 엔진 탑재**:
  - **판넬 간 수직·수평 플랜지 리브**: 전면 및 우측 벽체의 판넬 조립 이음부마다 실제 SMC 탱크처럼 밖으로 45mm 돌출되는 3D 맞댐 플랜지 리브(폭 36mm 이중선 + 돌출 능선 + 상·하 마감선) 자동 생성.
  - **수직 외곽 코너 플랜지(Vertical Corner Rib)**: 전면 벽체와 우측 벽체가 만나는 $X=totalL, Y=0$ 수직 모서리에 45mm 대각 방향 돌출 코너 플랜지 리브 렌더링.
  - **상부 지붕 테두리 플랜지 코니스(Top Perimeter Cornice)**: 상단($Z=H$) 벽체와 지붕이 맞닿는 테두리 전체에 전면/우측으로 45mm 튀어나오는 외곽 플랜지 처마 라인 입체 투영.
  - **지붕 판넬 간 상향 플랜지 리브(Roof Seam Ribs)**: 지붕 판넬 조립부마다 25mm 상향 돌출 리브 및 베이스 이중선 자동 배치.
  - **판넬별 내부 플랜지 단차선(Inner Flange Margin 35mm)**: 개별 판넬 둘레에 35mm 플랜지 단차선을 표시하여, 볼트 조립 플랜지 테두리와 중앙 엠보싱(다이아몬드/리브) 영역을 시각적으로 선명하게 분리.
- **AutoCAD 3D 조감도 표준 완벽 부합**:
  - 밋밋하던 평면 상자 형태에서 실물 공장 승인도면과 동일한 입체적 SMC 플랜지 조립체로 ISOMETRIC 렌더링 퀄리티 대폭 향상.

---

## [1.4.6] - 2026-10-01

### Fixed & Enhanced (3D STP 판넬 필렛 원, 십자선, 플랜지 다중선 정밀 정제)
- **3D 필렛(Fillet/Round) 및 곡면 십자선 자동 배제 엔진 탑재**:
  - 3D CAD(SolidWorks, Inventor, Creo 등)에서 모델링된 SMC 판넬의 다이아몬드 능선 꼭짓점 구형 블렌드 및 외곽 모서리 R < 35mm 필렛 원형 디스크 완벽 제거.
  - 구형 블렌드 사분면 분할로 인해 다이아몬드 꼭짓점에 생기던 미세 십자선(+) 및 파편 선분(L < 16mm) 자동 배제.
  - `AXIS2_PLACEMENT_3D` 및 `DIRECTION` 법선 벡터 분석을 통해 두께 축과 수직/경사 방향인 모서리 원통 곡면 원형 투영 원천 차단.
  - 맨홀(R >= 150mm) 및 대형 배관 노즐(R >= 35mm) 등 실제 기능성 개구부는 100% 안전 보존.
- **플랜지 테두리 다중선(바코드형 겹선) 자동 병합 및 테두리 중복선 제거**:
  - 판넬 외곽 35mm 이내에서 2~4개로 겹쳐 나오던 절곡 R 탄젠트 라인들을 정리하여 깔끔한 단일 윤곽선으로 변환.
  - 외곽 사각형(`poly`)과 100% 일치하는 테두리 선분 중복 배제.
- **원터치 정제 버튼 및 옵션 토글 추가**:
  - 판넬 모달 상단에 **`[✨ 필렛/잡선 원터치 정제]`** 버튼을 추가하여 언제든 원클릭으로 3D 필렛 원, 십자선, 중복선을 즉시 정제 가능.
  - 3D STP 업로드 영역에 **`☑️ 3D 필렛·라운드 자동 정제`** 체크박스를 탑재하여 사용자 필요에 따라 필터링 여부 선택 지원.

---

## [1.4.5] - 2026-10-01

### Fixed & Enhanced (3D STP 판넬 실제 크기 1000x1000 자동 검출 및 화면 꽉 채움)
- **STP 파일 로드 시 5126×7076 크기 오인식 및 구석 축소 현상 완전 해결**:
  - CAD 모델에 포함된 전체 배치도(바닥/건축 외곽선, 2250mm 초과 선분) 및 원점 마커를 필터링하고, 실제 판넬 모서리 선분(571개)의 밀집 영역을 감지하여 1000×1000 표준 규격으로 자동 정밀 인식.
  - 미리보기 캔버스에서 판넬이 구석에 조그맣게 나오던 현상을 해결하고, 1000×1000 프레임 전체에 선명하고 꽉 차게 렌더링되도록 개선.
  - 모달 창에 **`📐 형상을 규격(WxH)에 강제 맞춤`** 버튼을 추가하여 원하는 크기(예: 1000×1000)로 원클릭 재스케일 및 정렬 기능 제공.

---

## [1.4.4] - 2026-10-01

### Fixed & Enhanced (판넬 DB 등록 형상의 도면 즉시 실시간 반영)
- **판넬 저장 시 현재 도면 미반영 버그 완전 해결**:
  - `savePanelBtn` 실행 시 브라우저 내 활성 CAD 엔진의 `TEMPLATES` 및 `SIDE_T` 메모리 객체에 등록 형상을 즉시 주입하여, 저장 즉시 평면도(Plan), 입면도(Elevations), A1 종합 조립도 시트, 3D 등각 투영도에 판넬 형상이 실시간 렌더링되도록 구현.
  - 브라우저 로컬 저장소(`localStorage`)와 활성 템플릿을 자동 동기화하는 `applyActiveTemplates()` 함수를 구현하여 새로고침 시에도 사용자 정의 판넬 형상이 지속적으로 완벽 유지되도록 보장.
- **판넬 DB 테이블 내 1-클릭 `[⚡적용]` 버튼 탑재**:
  - DB 목록의 모든 판넬(공장 37종 및 사용자 등록 판넬)에 `⚡적용` 버튼을 추가하여, 원하는 판넬을 클릭 한 번으로 현재 탱크 도면에 즉시 반영 가능.
- **적용 위치 선택지 확장**:
  - 기존 `평면(상·하부 패널)`, `입면(측면 패널)` 외에 `전체(평면 + 입면 모두 적용)` 옵션 추가.
- **3D STP 바운딩 박스 인식 정밀화**:
  - CAD에서 내보낸 기본 기준면(Datum plane, 5000mm 이상 원점 등) 비형상 좌표를 배제하고, 실제 형상 모서리선(`EDGE_CURVE`, `POLY_LOOP`, `CIRCLE`)의 정점만 측정하도록 바운딩 박스 연산 개선.
  - 플랜지 외곽 치수(예: 1010mm 등)도 1000mm 등 표준 공장 규격으로 자동 정밀 스냅.

---

## [1.4.3] - 2026-10-01

### Added (3D STP / STEP 판넬 파일 직접 로딩 엔진)
- **판넬 등록 모달 내 3D STP / STEP 파일 직접 로더 탑재 (`📦 3D STP/STEP`)**:
  - 판넬 등록 및 형상 편집 모달에 `📦 3D STP/STEP` 로딩 탭 추가.
  - SolidWorks, Inventor, Creo, AutoCAD 3D 등에서 제작된 `.stp` / `.step` 3D CAD 파일을 브라우저에서 직접 선택/로드 가능.
  - **3D 형상 정면 2D 자동 투영 엔진 (클라이언트 자립형)**:
    - 3D 좌표점(`CARTESIAN_POINT`, `VERTEX_POINT`), 모서리선(`EDGE_CURVE`), 원형/원호(`CIRCLE`), 다면체 루프(`POLY_LOOP`) 해석.
    - 탱크 판넬의 최소 두께 축(Thickness Axis)을 자동 판별하여 최적의 2D 정면(Front View) 투영면 자동 결정.
    - 가로×세로 규격(W×H), 엠보싱 리브 선분, 볼트 홀 등을 자동 추출 및 중복 선분 필터링.
    - 가로 폭(W), 세로 높이(H), 판넬 명칭 및 2D 형상 데이터를 모달 폼과 캔버스 미리보기에 즉시 자동 채움.
  - **오프라인 및 GitHub Pages 100% 자립 구동**: 백엔드 서버 없이도 브라우저 내부에서 즉시 파싱되며, 서버 연결 시 `/api/panels/import-step` API도 함께 지원.

---

## [1.4.2] - 2026-10-01

### Changed & Stabilized (Direction A: 도면 중심 정밀 설계 체제 복귀)
- **도면 중심(방향 A)으로 전면 복귀 및 WebGL 3D 엔진 분리**:
  - 사용자 요청에 따라 실험적 3D WebGL 뷰어(`tab-3d`, Three.js) 및 관련 3D 다운로드 UI를 완전히 제거하고, 실무용 2D CAD 승인 도면(A1 Sheet, 평면도, 정/측면도, 콘크리트 패드도, 등각투영도)에 집중하도록 UI를 깔끔하게 복원.
  - 도면 캔버스(`#cv`) 뷰포트 구조를 원천 단순화하여 캔버스 표출 오류 가능성을 원천 차단.
- **판넬 DB(37종) 및 도면 뷰어 100% 자립형 정상 작동 유지**:
  - `server.py` 없이도 37종 SMC/STS 표준 판넬이 완벽 표출되며, 판넬 선택 시 2D 실시간 형상 렌더링 정상 작동.
  - 승인 도면 A1 배치 및 DXF 내보내기, BOM 자동 산출의 정확도와 안정성 확보.

---

## [1.4.1] - 2026-10-01

### Fixed
- **도면 캔버스(#cv, #cv3d) 미표출 버그 완전 해결**:
  - 모달 닫는 태그 누락으로 인해 캔버스 뷰포트가 모달(`display: none`) 내부에 갇혀 도면 영역이 백색으로 나오던 문제 수정.
- **판넬 DB 서버 미연결 시 공장 표준 템플릿(37종) 자동 폴백 표시 지원**:
  - GitHub Pages 등 정적 웹 환경이나 로컬 `server.py` 미실행 환경에서도 내장 템플릿(`TEMPLATES`, `SIDE_T`) 및 `localStorage` 기반으로 37종의 표준 SMC/STS 판넬 목록과 실시간 2D 형상 뷰어를 100% 정상 표출.
  - 신규 판넬 등록/수정/삭제도 `localStorage`에 자동 영속화되어 서버 없이도 완벽 작동.

---

## [1.4.0] - 2026-10-01

### Added & Breakthrough (Direction C: 3D CAD & STEP Pipeline Complete)
- **🎮 360° 대화형 WebGL 3D 뷰어 (Three.js Interactive Viewer)**:
  - 툴바 및 사이드 탭에서 클릭 한 번으로 `📐 2D CAD 도면`과 `🎮 3D 뷰어`를 즉시 실시간 전환.
  - 마우스 좌클릭 360° 자유 궤도 회전(Orbit), 우클릭/Shift 이동(Pan), 휠 줌(Zoom) 지원.
  - 물탱크 재질별 사실적 PBR 셰이딩:
    - **SMC (GRP)**: 실물 아이보리 복합소재 매트 텍스처
    - **STS (스테인리스)**: 거울형 메탈릭 반사 재질
    - **기초 및 프레임**: 아연도금 베이스 스키드 찬넬 및 콘크리트 패드 3D 묘사
    - **의장품**: 실물 원형 맨홀(Manhole), 버섯형 통기구(Vent), 안전 사다리(Ladder), 배관 노즐(Flange Nozzle)
- **💥 실시간 조립 분해도 (Interactive Exploded View Slider)**:
  - 분해도 슬라이더(0% ~ 100%)를 조절하여 전면/배면/좌측/우측 벽체 및 지붕 패널이 사방으로 부드럽게 분해 전개.
  - 외부 패널에 가려져 있던 탱크 내부 공간, 칸막이 구획벽, 내부 구조를 3D로 직관적 검토 가능.
- **✂️ 3D 내부 단면 절단 (Section Cut / Cross-Section View)**:
  - 단면 절단 토글(Clipping Plane)을 통해 탱크 단면을 잘라 내부 수조 및 판넬 결합 상태를 직접 들여다볼 수 있는 기능 탑재.
- **🎥 원클릭 카메라 시점 프리셋 (Camera View Presets)**:
  - `🧊 등각 (ISO)`, `🏢 정면 (Front)`, `📐 평면 (Top)`, `🚪 우측 (Right)`, `📦 배면 (Rear)`, `🔄 시점 리셋` 지원.
  - `🕸️ 와이어프레임 토글`: 솔리드 셰이딩, CAD 외곽선(Edges), 와이어프레임 모드 전환.
- **💾 조립체 3D CAD 파일 원클릭 다운로드 (3D Assembly Exports)**:
  - **`💾 3D STEP (.stp)`**: ISO 10303-21 표준 B-Rep 조립체 파일 다운로드 (SolidWorks, Inventor, Fusion 360, CATIA, Rhino, FreeCAD, AutoCAD에서 즉시 열림).
  - **`💾 3D DXF (.dxf)`**: AutoCAD용 3D 엔티티/라인 조립 도면 파일 다운로드.
  - **`💾 3D OBJ (.obj)`**: 범용 3D 모델 파일 다운로드.
- **📁 실물 판넬 3D STEP 파일 등록 (Client-side STEP Ingestion)**:
  - 브라우저 내장 ISO 10303-21 STEP 텍스트 파서(`ClientStepParser`) 탑재.
  - 사용자가 사출/금형 업체의 `.stp` / `.step` 파일을 드래그 & 드롭하면 서버 전송 없이 브라우저에서 즉시 파싱하여 실물 3D 패널 형상으로 등록 및 모델링 반영.

---

## [1.3.1] - 2026-10-01

### Fixed & Improved
- **A1 종합 조립도(ASM DWG) 내 3D 등각도 누락 문제 완전 해결 (3-Column Layout Guarantee)**:
  - 기존 2열 배치에서 여백 계산 폭(`iso_avail_w`)이 65mm 미만일 때 3D 등각도가 시트에서 통째로 생략되던 문제 해결.
  - A1 조립도 시트 전면을 **표준 3개 열(3-Column Layout)**로 전면 개편:
    - **1열(좌측)**: 평면도(상부) & 정면도(하부) 수직 투영 일치
    - **2열(중앙)**: 기초패드도(상부) & 우측면도(하부) 수직 투영 일치
    - **3열(우측 전용 영역)**: **등각 조감도 (VIEW 5: 3D ISOMETRIC VIEW)**를 가로 130~190mm 전용 열에 당당하게 단독 배치!
  - 5개 뷰 종합 조립도에 최적화된 자동 축척(Scale 1:30~1:40) 계산 엔진 도입으로 5개 뷰 간의 여백과 간격이 완벽하게 균형을 이루며, 어떤 물탱크 치수에서도 3D 뷰가 누락되지 않고 100% 표출됩니다.

---

## [1.3.0] - 2026-10-01

### Added & Improved
- **3D 등각도 실물 패널 프레스 형상 100% 반영 (Real Panel Stamping & Geometry)**:
  - **측판(전면/측면 벽체)**: CAD 템플릿(`side_templates.json`)의 실제 SMC/STS 패널 프레스 스탬핑 곡선·리브 형상과 피팅 패널, 1x1m 평판(`flat`), 0.5x1m 평판 2장 분할(`flat-half2`) 등 사용자가 설정한 패널 구성을 3D 등각 투영으로 완벽하게 투영 렌더링.
  - **천정판넬(지붕 슬래브)**: 지붕 패널 템플릿(`panel_templates.json`)의 팔각 리브 및 십자형 보강선을 3D Z=H 상부 평면에 완벽 전개.
- **실물 맨홀(Manhole) 및 통기구(Air Vent) 입체 조형화**:
  - 지붕 위 원통형 넥(Cylinder Neck), 플랜지 림, 내부 커버, 손잡이(Handle) 브라켓까지 3D 입체 투영 묘사 및 지시선 라벨(`MANHOLE Ø600`) 표기.
  - 버섯형 카울 캡(Mushroom Cowl Cap) 및 수직 스탠드파이프를 갖춘 3D 환기구(`AIR VENT 100A`) 묘사.
  - 마크 미지정 시에도 기본 검측용 맨홀/환기구가 자동 배치되어 도면 누락 방지.
- **안전 울(Safety Cage) 및 상부 안전 손잡이가 포함된 3D 외부 사다리 (External Ladder)**:
  - 지면부터 지붕 상부(+850mm)까지 솟아오르는 수직 사이드 레일, 지붕으로 꺾여 들어가는 상부 보행 안전 루프, 300mm 피치 발판, 벽체 고정 브라켓 장착.
  - 높이 3000mm 이상 시 KOSHA/OSHA 규격에 맞는 반원형 안전 울(등받이 케이지) 및 수직 안전 스트랩 3D 렌더링.
- **도면 크기 대폭 확대 및 뷰 간 간섭(겹침) 완전 해소**:
  - **전용 등각도 시트(`3D ISOMETRIC DWG`)**: 인쇄 축척을 시트 크기에 맞추어 85~90% 꽉 차도록 대형 스케일(1:15~1:25)로 자동 확대.
  - **종합 조립도(`ASM DWG`)**: 우측면도의 외곽 치수선 및 지시선을 모두 고려한 안전 경계(`side_rt`)를 재계산하여, 뷰 5 등각도가 우측면도와 절대 겹치지 않도록 안전 여백 완벽 분리.
  - **모델 뷰 직접 지원**: 도면 시트를 끈 상태에서도 `3D 등각 모델 뷰`로 즉시 전환하여 확대/축소 및 자유 검토 가능.

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
