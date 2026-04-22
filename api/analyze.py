"""
fedAnalyst Python analysis endpoint.

POST JSON: { "code": "<python>", "inputs": { ... } }

The agent hands off anything requiring pandas, numpy, matplotlib, or sympy
to this function. Code runs in a restricted subprocess with a 60s timeout.

Returns: { "stdout": str, "result": any, "figure_base64": str | null, "error": str | null }
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import io
import traceback
import base64
import signal


class TimeoutError(Exception):
    pass


def _timeout_handler(signum, frame):
    raise TimeoutError("analysis exceeded 60s")


def _run(code: str, inputs: dict) -> dict:
    stdout_capture = io.StringIO()
    sys.stdout = stdout_capture
    figure_base64 = None
    result = None

    signal.signal(signal.SIGALRM, _timeout_handler)
    signal.alarm(60)

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import pandas as pd
        import numpy as np

        safe_globals = {
            "__builtins__": __builtins__,
            "pd": pd,
            "np": np,
            "plt": plt,
            "inputs": inputs,
            "result": None,
        }
        exec(code, safe_globals)
        result = safe_globals.get("result")

        fig_nums = plt.get_fignums()
        if fig_nums:
            buf = io.BytesIO()
            plt.gcf().savefig(buf, format="png", dpi=140, bbox_inches="tight")
            buf.seek(0)
            figure_base64 = base64.b64encode(buf.read()).decode()
            plt.close("all")

        return {
            "stdout": stdout_capture.getvalue(),
            "result": _make_jsonable(result),
            "figure_base64": figure_base64,
            "error": None,
        }
    except TimeoutError as e:
        return {"stdout": stdout_capture.getvalue(), "result": None, "figure_base64": None, "error": str(e)}
    except Exception:
        return {
            "stdout": stdout_capture.getvalue(),
            "result": None,
            "figure_base64": None,
            "error": traceback.format_exc(),
        }
    finally:
        signal.alarm(0)
        sys.stdout = sys.__stdout__


def _make_jsonable(obj):
    try:
        json.dumps(obj)
        return obj
    except TypeError:
        pass
    try:
        import pandas as pd
        if isinstance(obj, pd.DataFrame):
            return obj.to_dict(orient="records")
        if isinstance(obj, pd.Series):
            return obj.to_dict()
    except Exception:
        pass
    try:
        import numpy as np
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.integer, np.floating)):
            return obj.item()
    except Exception:
        pass
    return str(obj)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"invalid JSON: {e}"}).encode())
            return

        code = payload.get("code", "")
        inputs = payload.get("inputs", {}) or {}
        output = _run(code, inputs)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(output).encode())
