# YSACC TANK CAD 배포 가이드 (Deployment Guide)

이 프로젝트는 브라우저 단독으로 실행 가능한 **정적 웹 모드(GitHub Pages)**와, 클라우드 서버에서 도면 변환(ODA) 및 판넬 DB를 100% 자동 지원하는 **풀스택 클라우드 모드(Render / Railway / Docker / Cafe24 / AWS)**를 모두 지원합니다.

---

## 🌟 추천: Render.com 클라우드 서버 배포 (무료, 3분 완성, 전 세계 100% DWG 변환 지원)

> **장점**: 사용자가 컴퓨터에 ODA 변환기를 설치하지 않아도, 모바일이나 모든 PC에서 웹 접속 후 **[💾 DWG 도면 (.dwg)]** 버튼을 누르면 클라우드 서버가 즉시 `.dwg` 파일로 변환하여 다운로드해 줍니다. (신용카드 등록 없이 무료 플랜 이용 가능)

### 배포 순서 (초간단 4단계):

1. **[Render.com](https://render.com/) 접속 및 로그인**
   - 상단 `Sign Up` 또는 `Sign In`을 누르고 **GitHub 계정으로 로그인**합니다.

2. **새 Blueprints 또는 Web Service 생성**
   - 대시보드 우측 상단의 **[New +]** 버튼을 누릅니다.
   - **[Blueprint]**를 선택합니다.

3. **GitHub 저장소 연결**
   - `jhk113074-hue/tankcad` 저장소를 선택합니다.
   - 프로젝트 내 `render.yaml` 설정 파일이 자동으로 감지됩니다.
   - **[Apply]** 버튼을 클릭합니다.

4. **배포 완료!**
   - Render가 자동으로 Docker 이미지를 빌드하고 ODA File Converter 및 가상 디스플레이(xvfb), Python 서버를 실행합니다.
   - 배포가 완료되면 `https://ysacc-tankcad.onrender.com` 과 같은 영구적인 보안(HTTPS) 전용 주소가 부여됩니다!
   - 이제 어느 기기에서 접속하든 버튼 한 번으로 진짜 `.dwg` 파일이 즉시 다운로드됩니다.

---

## 2. 배포 옵션: Railway.app 배포

1. [Railway.app](https://railway.app/) 접속 후 GitHub 계정으로 로그인합니다.
2. **New Project** ➔ **Deploy from GitHub repo** ➔ `tankcad` 선택.
3. Railway가 루트의 `Dockerfile`을 자동 인식하여 클라우드 컨테이너로 즉시 배포합니다.

---

## 3. 배포 옵션: 사내 리눅스 / Cafe24 가상서버 / AWS EC2 (Docker Compose)

사내 서버나 Cafe24 VPS, AWS EC2 인스턴스가 있다면 단 두 줄로 전체 시스템을 가동할 수 있습니다:

```bash
# 1. 저장소 클론 및 이동
git clone https://github.com/jhk113074-hue/tankcad.git
cd tankcad

# 2. 도커 백그라운드 빌드 및 실행
docker-compose up -d --build

# 접속: http://<서버IP 또는 도메인>:8000
```

---

## 4. 정적 웹사이트 모드: GitHub Pages (클라이언트 단독)

* **배포 주소**: `https://jhk113074-hue.github.io/tankcad/`
* **특징**: 서버 없이 GitHub에 커밋/푸시만 하면 즉시 무료 정적 호스팅.
* 정적 호스팅 환경에서는 브라우저 보안상 클라우드 백엔드가 없으므로, **[💾 DXF 파일로 즉시 다운로드]**(AutoCAD에서 100% 동일하게 열림)를 이용하거나 로컬 서버(`실행하기.bat`)와 연동하여 사용합니다.
