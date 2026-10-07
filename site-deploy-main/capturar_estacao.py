import json
import re
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import serial

SERIAL_PORT = "COM5"
BAUD_RATE = 115200
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 8765

latest = {
    "temperature": 0,
    "humidity": 0,
    "wind": 0,
    "uv": 0,
    "pressure": 0,
    "timestamp": datetime.now(timezone.utc).isoformat(),
}
lock = threading.Lock()


def parse_line(line: str):
    values = {}
    for key, value in re.findall(r"([A-Z]+):(-?\d+(?:\.\d+)?)", line.upper()):
        values[key] = float(value)

    required = ("TEMP", "UMI", "VENTO", "UV", "PRESSAO")
    if not all(k in values for k in required):
        return None

    return {
        "temperature": values["TEMP"],
        "humidity": values["UMI"],
        "wind": values["VENTO"],
        "uv": values["UV"],
        "pressure": values["PRESSAO"] / 100.0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


class Handler(BaseHTTPRequestHandler):
    def _headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") == "/data":
            with lock:
                payload = dict(latest)
            self._headers()
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return
        if self.path.rstrip("/") == "/health":
            self._headers()
            self.wfile.write(b'{"ok":true}')
            return
        self._headers(404)
        self.wfile.write(b'{"error":"not found"}')

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, *_):
        pass


def serial_loop():
    global latest
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    except serial.SerialException as exc:
        print(f"ERRO: não foi possível abrir {SERIAL_PORT}: {exc}")
        print("Feche o 'Mostrar dispositivo' do MakeCode e confirme que o micro:bit está conectado.")
        return

    print(f"USB conectado em {SERIAL_PORT} a {BAUD_RATE} baud.")
    print(f"Ponte local: http://{HTTP_HOST}:{HTTP_PORT}/data")
    print("Abra o site no navegador. Pressione Ctrl+C para parar.\n")

    while True:
        try:
            raw = ser.readline().decode("utf-8", errors="ignore").strip()
            if not raw:
                continue
            data = parse_line(raw)
            if data is None:
                continue
            with lock:
                latest = data
            print(
                f"T={data['temperature']:.1f} °C | "
                f"UR={data['humidity']:.1f}% | "
                f"Vento={data['wind']:.1f} km/h | "
                f"UV={data['uv']:.0f} | "
                f"Pressão={data['pressure']:.2f} hPa"
            )
        except (serial.SerialException, OSError) as exc:
            print(f"ERRO na leitura serial: {exc}")
            break
        except KeyboardInterrupt:
            break
    ser.close()


def main():
    server = ThreadingHTTPServer((HTTP_HOST, HTTP_PORT), Handler)
    thread = threading.Thread(target=serial_loop, daemon=True)
    thread.start()
    print(f"Servidor local iniciado em http://{HTTP_HOST}:{HTTP_PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrando...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
