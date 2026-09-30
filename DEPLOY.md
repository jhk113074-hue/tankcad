# YSACC TANK CAD 배포 가이드 (Deployment Guide)

이 프로젝트는 브라우저 단독으로 실행 가능한 **정적 웹 모드**와, 판넬 DB 및 ODA 기반 DWG 변환을 지원하는 **풀스택 모드(Python 서버 포함)** 두 가지 방식으로 배포할 수 있습니다.

---

## 1. GitHub 저장소 연동 및 푸시

1. **GitHub에서 새 저장소 생성**:
   - [GitHub New Repository](https://github.com/new)에 접속하여 저장소를 생성합니다. (예: `ysacc-tankcad`)

2. **로컬 저장소와 원격 저장소 연결 후 푸시**:
   ```bash
   git remote add origin https://github.com/<사용자명>/<저장소명>.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. 배포 옵션 1: GitHub Pages (무료, 완전 자동)

> **특징**: 서버 없이 GitHub에 커밋/푸시만 하면 자동으로 전 세계 어디서나 접속 가능한 정적 웹사이트로 배포됩니다.
> (도면 편집, DXF 다운로드, SVG/PNG 내보내기 등 100% 브라우저 클라이언트 처리 지원)

1. GitHub 저장소 페이지의 **Settings** → **Pages** 로 이동합니다.
2. **Build and deployment** 항목의 **Source**를 `GitHub Actions`로 선택합니다.
3. 코드를 `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 자동 실행되어 몇 분 내로 배포가 완료됩니다.
4. 배포 주소: `https://<사용자명>.github.io/<저장소명>/`

---

## 3. 배포 옵션 2: Vercel (무료, 고성능 글로벌 CDN)

> **특징**: 빠른 로딩 속도와 커스텀 도메인 연동이 매우 쉽습니다.

1. [Vercel](https://vercel.com/)에 가입 및 로그인합니다.
2. **Add New Project** → GitHub 저장소를 선택합니다.
3. 프로젝트 내 `vercel.json`이 자동으로 인식되므로 별도 설정 없이 **Deploy** 버튼을 클릭합니다.
4. 즉시 고유한 `.vercel.app` URL로 전 세계에 배포됩니다.

---

## 4. 배포 옵션 3: Docker / 클라우드 서버 (풀스택 모드)

> **특징**: 판넬 데이터베이스(SQLite) 및 DWG 변환 API가 포함된 Python 백엔드(`server.py`)까지 온전히 구동합니다.

### Docker 실행
```bash
# 이미지 빌드 및 실행
docker-compose up -d --build

# 접속: http://<서버IP>:8000
```

### 일반 리눅스/클라우드 서버(Ubuntu 등) 직접 구동
```bash
# 패키지 설치
pip install -r requirements.txt

# 웹 번들 빌드
python build.py

# 백그라운드 서버 실행 (nohup 또는 systemd)
nohup python server.py > server.log 2>&1 &
```
