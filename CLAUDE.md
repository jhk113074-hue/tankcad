# YSACC TANK CAD (VC6/MFC 물탱크 도면 CAD 웹 이식)

## 목적
탱크 가로/세로/높이(+재질/옵션) 입력 → A1 도면(TOP VIEW, BASIC CON'C, FRONT/SIDE VIEW, 표제란/노트) + DXF. 원본: CAD_TEST.zip (HighTank, KORVAN TANK), 매뉴얼 PDF 2종 참조.

## 구조
- web/tank.js : 핵심 로직 (UMD `TankCore`) — buildPlan/buildElevation/buildSkid/buildSkidCross/buildStay/buildSheet/toDxf
- web/index.src.html : UI 소스 (tank.js는 build 시 인라인)
- build.py : `python3 build.py` → web/index.html (단일 파일, 아티팩트로 배포)
- panel_templates.json, side_templates.json : 패널 문양 템플릿(SMC/STS)
- transpile_*.py : 원본 C++ → 템플릿 변환
- verify/ : Playwright 스크린샷/DXF 검증 스크립트 (ezdxf 로 DXF 검증)

## 규칙/메모
- 좌표 y-up, 패널 모듈 1300/1000/500. 입면 원점 y=0 탱크 바닥, 프레임 −th, 지반 −600.
- rf: 0 외부보강, 1 내부앵글(STS), 2 내부환봉. opt.sheetKind: asm|frame|detail.
- DXF 한글은 \U+XXXX, zip 다운로드. 캔버스 텍스트는 px<4 이면 숨김(확대 필요).
- 원본 소스 주석은 CP949.
- 미결: SHS50 실제치수(가정 50x50 t5), 뷰 제목(PLANE/FRONT ELEVATION vs TOP/FRONT VIEW), 표제란 폭 190mm, 콘크리트 패드 중간 삭제 셀 규칙.
- 최근 변경: 입면 콘크리트 패드 45° 빗금, Remarks 폰트 확대, 에어벤트/맨홀/사다리 시각화, 인코딩 수정.
- 상세 개발 기록 및 인수인계: [PROJECT_LOG.md](file:///e:/tankcad/PROJECT_LOG.md) 참조.
