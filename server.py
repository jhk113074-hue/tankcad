import os
import sys
import glob
import shutil
import tempfile
import json
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import ezdxf
from ezdxf.addons import odafc
import db

PORT = int(os.environ.get("PORT", 8000))

def setup_oda():
    """시스템에 설치된 ODA File Converter 실행 파일 경로를 찾아 ezdxf에 등록합니다."""
    is_win = sys.platform.startswith("win")
    addon_key = "win_exec_path" if is_win else "unix_exec_path"

    # 1. PATH 환경변수
    p = shutil.which("ODAFileConverter.exe") or shutil.which("ODAFileConverter")
    if p:
        ezdxf.options.set("odafc-addon", addon_key, f'"{p}"')
        return p
    # 2. 일반적인 Windows / Linux 설치 경로
    patterns = [
        # Windows
        r"C:\Program Files\ODA\*\ODAFileConverter.exe",
        r"C:\Program Files (x86)\ODA\*\ODAFileConverter.exe",
        r"C:\Program Files\ODA\ODAFileConverter.exe",
        r"C:\Program Files (x86)\ODA\ODAFileConverter.exe",
        r"C:\ODA\*\ODAFileConverter.exe",
        r"C:\ODA\ODAFileConverter.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\ODA\*\ODAFileConverter.exe"),
        # Linux
        "/usr/bin/ODAFileConverter",
        "/usr/local/bin/ODAFileConverter",
        "/opt/ODA/*/ODAFileConverter",
        "/usr/lib/ODAFileConverter/*/ODAFileConverter"
    ]
    for pat in patterns:
        matches = glob.glob(pat)
        if matches:
            oda_exec = matches[0]
            ezdxf.options.set("odafc-addon", addon_key, f'"{oda_exec}"')
            return oda_exec
    return None

class TankCADHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Private-Network")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/web/index.html")
            self.end_headers()
            return

        if path == "/api/check-dwg":
            oda_path = setup_oda()
            is_ok = odafc.is_installed() if oda_path else False
            self.send_json({
                "installed": is_ok,
                "oda_path": oda_path,
                "download_url": "https://www.opendesign.com/guestfiles/oda_file_converter"
            })
            return

        if path == "/api/panels/templates":
            templates = db.export_all_templates_dict()
            self.send_json({"success": True, **templates})
            return

        if path == "/api/panels":
            qs = urllib.parse.parse_qs(parsed.query)
            material = qs.get("material", [None])[0]
            category = qs.get("category", [None])[0]
            panels = db.get_all_panels(material, category)
            self.send_json({"success": True, "panels": panels})
            return

        if path.startswith("/api/panels/"):
            parts = path.split("/")
            if len(parts) == 4 and parts[3].isdigit():
                pid = int(parts[3])
                panel = db.get_panel_by_id(pid)
                if panel:
                    self.send_json({"success": True, "panel": panel})
                else:
                    self.send_json({"success": False, "error": "Panel not found"}, status=404)
                return

        super().do_GET()

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_len)
        try:
            payload = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception as e:
            self.send_json({"success": False, "error": f"Invalid JSON payload: {e}"}, status=400)
            return

        if self.path == "/api/convert-dwg":
            oda_path = setup_oda()
            if not oda_path or not odafc.is_installed():
                self.send_json({
                    "success": False,
                    "error": "ODA_NOT_INSTALLED",
                    "message": "ODA File Converter가 설치되어 있지 않습니다.",
                    "download_url": "https://www.opendesign.com/guestfiles/oda_file_converter"
                }, status=400)
                return

            dxf_text = payload.get("dxf", "")
            base_name = payload.get("filename", "tank_drawing").replace(".dwg", "").replace(".dxf", "")
            if not dxf_text:
                self.send_json({"success": False, "error": "Missing DXF content"}, status=400)
                return

            # 줄바꿈 정규화 (\r\r\n 방지)
            dxf_text = dxf_text.replace("\r\n", "\n").replace("\r", "\n")

            with tempfile.TemporaryDirectory() as tmp_dir:
                in_dxf = os.path.join(tmp_dir, f"{base_name}.dxf")
                out_dwg = os.path.join(tmp_dir, f"{base_name}.dwg")

                with open(in_dxf, "w", encoding="utf-8", newline="\n") as f:
                    f.write(dxf_text)

                if not sys.platform.startswith("win") and "DISPLAY" not in os.environ:
                    os.environ["DISPLAY"] = ":99"

                try:
                    odafc.convert(in_dxf, out_dwg, version="ACAD2018")
                except Exception as e:
                    print(f"[ERROR] odafc conversion failed: {e}")
                    self.send_json({"success": False, "error": f"DWG Conversion failed: {e}"}, status=500)
                    return

                if not os.path.exists(out_dwg):
                    self.send_json({"success": False, "error": "DWG output file was not created by converter."}, status=500)
                    return

                with open(out_dwg, "rb") as f:
                    dwg_bytes = f.read()

                # DWG 바이너리 헤더 검증 (AC10으로 시작하지 않거나 크기가 1KB 미만이면 ODA 에러 로그임)
                if not dwg_bytes.startswith(b"AC10") or len(dwg_bytes) < 1000:
                    err_msg = dwg_bytes.decode("latin1", errors="replace")
                    print(f"[ERROR] Invalid DWG generated: {err_msg[:200]}")
                    self.send_json({
                        "success": False,
                        "error": "CONVERSION_FAILED",
                        "message": f"DWG 변환 오류: {err_msg[:120]}"
                    }, status=500)
                    return

                print(f"[SUCCESS] Converted {base_name}.dwg ({len(dwg_bytes)} bytes)")
                self.send_response(200)
                self.send_header("Content-Type", "application/acad")
                self.send_header("Content-Disposition", f'attachment; filename="{base_name}.dwg"')
                self.send_header("Content-Length", str(len(dwg_bytes)))
                self.end_headers()
                self.wfile.write(dwg_bytes)
                return

        # 판넬 등록 및 수정
        if self.path == "/api/panels":
            mat = payload.get("material", "SMC").upper()
            cat = payload.get("category", "top_bottom")
            width = int(payload.get("width", 1000))
            height = int(payload.get("height", 1000))
            name = payload.get("name", f"{mat} {width}x{height} 판넬")
            desc = payload.get("description", "")
            ents = payload.get("entities", [])
            pid = db.save_panel(mat, cat, width, height, name, desc, ents, is_default=0)
            self.send_json({"success": True, "id": pid, "message": f"{name} 판넬이 DB에 저장되었습니다."})
            return

        # DXF 파일에서 판넬 엔티티 추출
        if self.path == "/api/panels/import-dxf":
            dxf_text = payload.get("dxf", "")
            target_w = payload.get("width")
            target_h = payload.get("height")
            if not dxf_text:
                self.send_json({"success": False, "error": "DXF 내용이 없습니다."}, status=400)
                return
            try:
                ents = db.parse_dxf_string(dxf_text, target_w, target_h)
                self.send_json({"success": True, "entities": ents, "count": len(ents)})
            except Exception as e:
                self.send_json({"success": False, "error": f"DXF 파싱 오류: {e}"}, status=400)
            return

        # STP 파일에서 판넬 엔티티 추출
        if self.path == "/api/panels/import-step":
            step_text = payload.get("step", "")
            target_w = payload.get("width")
            target_h = payload.get("height")
            if not step_text:
                self.send_json({"success": False, "error": "STEP 내용이 없습니다."}, status=400)
                return
            try:
                res = db.parse_step_string(step_text, target_w, target_h)
                self.send_json({"success": True, "width": res["width"], "height": res["height"], "entities": res["entities"], "count": len(res["entities"])})
            except Exception as e:
                self.send_json({"success": False, "error": f"STEP 파싱 오류: {e}"}, status=400)
            return

        # DWG 파일에서 판넬 엔티티 추출 (ODA File Converter 활용)
        if self.path == "/api/panels/import-dwg":
            dwg_b64 = payload.get("dwg_base64", "")
            target_w = payload.get("width")
            target_h = payload.get("height")
            if not dwg_b64:
                self.send_json({"success": False, "error": "DWG 데이터가 없습니다."}, status=400)
                return
            oda_path = setup_oda()
            if not oda_path or not odafc.is_installed():
                self.send_json({"success": False, "error": "ODA File Converter가 설치되어 있지 않아 DWG를 변환할 수 없습니다."}, status=400)
                return
            try:
                import base64
                dwg_bytes = base64.b64decode(dwg_b64)
                with tempfile.TemporaryDirectory() as tmp_dir:
                    in_dwg = os.path.join(tmp_dir, "panel_input.dwg")
                    out_dxf = os.path.join(tmp_dir, "panel_output.dxf")
                    with open(in_dwg, "wb") as f:
                        f.write(dwg_bytes)
                    odafc.convert(in_dwg, out_dxf, version="ACAD2018")
                    with open(out_dxf, "r", encoding="utf-8", errors="ignore") as f:
                        dxf_text = f.read()
                    ents = db.parse_dxf_string(dxf_text, target_w, target_h)
                    self.send_json({"success": True, "entities": ents, "count": len(ents)})
            except Exception as e:
                self.send_json({"success": False, "error": f"DWG 변환 및 파싱 오류: {e}"}, status=400)
            return

        # DWG/DXF 파일에서 모든 블록(BLOCK) 목록 일괄 추출 (다중 부품/판넬 자동 분할)
        if self.path == "/api/cad/extract-blocks":
            dwg_b64 = payload.get("dwg_base64", "")
            dxf_text = payload.get("dxf_text", "")
            if not dwg_b64 and not dxf_text:
                self.send_json({"success": False, "error": "도면 데이터가 없습니다."}, status=400)
                return
            try:
                if dwg_b64:
                    oda_path = setup_oda()
                    if not oda_path or not odafc.is_installed():
                        self.send_json({"success": False, "error": "ODA File Converter가 필요합니다. DXF 파일로 업로드하시면 서버 없이 즉시 변환됩니다."}, status=400)
                        return
                    import base64
                    dwg_bytes = base64.b64decode(dwg_b64)
                    with tempfile.TemporaryDirectory() as tmp_dir:
                        in_dwg = os.path.join(tmp_dir, "input.dwg")
                        out_dxf = os.path.join(tmp_dir, "output.dxf")
                        with open(in_dwg, "wb") as f:
                            f.write(dwg_bytes)
                        odafc.convert(in_dwg, out_dxf, version="ACAD2018")
                        with open(out_dxf, "r", encoding="utf-8", errors="ignore") as f:
                            dxf_text = f.read()

                blocks = db.extract_blocks_from_dxf(dxf_text)
                single_ents = []
                if not blocks:
                    try:
                        single_ents = db.parse_dxf_string(dxf_text)
                    except Exception:
                        pass
                self.send_json({"success": True, "blocks": blocks, "count": len(blocks), "entities": single_ents})
            except Exception as e:
                self.send_json({"success": False, "error": f"DWG/DXF 분석 오류: {e}"}, status=400)
            return

        # DB 초기 템플릿으로 리셋
        if self.path == "/api/panels/reset":
            db.seed_defaults()
            self.send_json({"success": True, "message": "판넬 DB가 공장 초기 템플릿으로 재설정되었습니다."})
            return

        self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        if self.path.startswith("/api/panels/"):
            parts = self.path.split("/")
            if len(parts) == 4 and parts[3].isdigit():
                pid = int(parts[3])
                deleted = db.delete_panel(pid)
                if deleted:
                    self.send_json({"success": True, "message": "판넬이 삭제되었습니다."})
                else:
                    self.send_json({"success": False, "error": "삭제할 판넬을 찾을 수 없습니다."}, status=404)
                return
        self.send_error(404, "Endpoint not found")

if __name__ == "__main__":
    db.init_db()
    oda = setup_oda()
    print(f"YSACC TANK CAD Server running on http://localhost:{PORT}")
    print(f"[*] Panel Database connected: {db.DB_PATH}")
    if oda and odafc.is_installed():
        print(f"[*] ODA File Converter connected: {oda}")
    else:
        print("[!] ODA File Converter not detected.")
    server = ThreadingHTTPServer(("", PORT), TankCADHandler)
    server.serve_forever()
