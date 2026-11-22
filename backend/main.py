"""Run with python -m uvicorn backend.main:app --port 8000."""

from contextlib import asynccontextmanager
import json
import logging
import math
import os
from pathlib import Path
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from .community import CommunityError, error_response as community_error_response, router as community_router
from .model import TemporalForest
from .recognition import RecognitionSession
from .hybrid import HybridRecognizer
from .transformer import TransformerRecognizer, available as transformer_available

logger = logging.getLogger("parlance.recognition")

# Debugging only: PARLANCE_CAPTURE_DIR=<folder> writes every landmark message a
# session receives, and the reply, to <folder>/<start time>.jsonl on this
# computer. Hand positions only; the camera image never reaches the backend.
CAPTURE_DIR = os.environ.get("PARLANCE_CAPTURE_DIR")


class Capture:
    def __init__(self):
        self.file = None
        if CAPTURE_DIR:
            folder = Path(CAPTURE_DIR)
            folder.mkdir(parents=True, exist_ok=True)
            self.file = (folder / time.strftime("%Y%m%d-%H%M%S.jsonl")).open("a")
            logger.warning("Capturing landmarks to %s", self.file.name)

    def write(self, message, response):
        if not self.file:
            return
        if isinstance(message, dict) and isinstance(message.get("landmarks"), list):
            message = {**message, "landmarks": [round(float(v), 5) for v in message["landmarks"]]}
        self.file.write(json.dumps({"at": time.time(), "in": message, "out": response}) + "\n")
        self.file.flush()

    def close(self):
        if self.file:
            self.file.close()


def load_model(directory: Path):
    """PARLANCE_RECOGNIZER=hybrid|transformer|forest.

    Default (auto): the transformer with forest suggestions when onnxruntime and
    the transformer model are installed, otherwise the forest alone.
    """
    choice = os.environ.get("PARLANCE_RECOGNIZER", "auto").strip().lower()
    if choice not in ("auto", "hybrid", "transformer", "forest"):
        raise ValueError("PARLANCE_RECOGNIZER must be auto, hybrid, transformer or forest")
    if choice == "forest" or (choice == "auto" and not transformer_available(directory)):
        return TemporalForest(directory)
    transformer = TransformerRecognizer(directory)
    if choice == "transformer":
        return transformer
    return HybridRecognizer(transformer, TemporalForest(directory))


@asynccontextmanager
async def lifespan(app):
    app.state.model = load_model(Path(__file__).parent / "models")
    logger.info("Recognition model: %s", app.state.model.capabilities()["name"])
    yield


app = FastAPI(title="Parlance recognition", lifespan=lifespan)

# Community (discussion spaces and live meetup rooms); see community.py.
app.include_router(community_router)


@app.exception_handler(CommunityError)
async def community_error(_request, error: CommunityError):
    return community_error_response(error)


@app.get("/health")
def health():
    return {"status": "ready", **app.state.model.capabilities()}


@app.websocket("/ws")
async def recognise(websocket: WebSocket):
    await websocket.accept()
    session = RecognitionSession(app.state.model)
    capture = Capture()
    await websocket.send_json({"status": "ready", "model": app.state.model.capabilities()})
    try:
        while True:
            raw = await websocket.receive_text()
            if len(raw) > 16384:
                await websocket.close(code=1009, reason="Landmark message too large")
                return
            started = time.perf_counter()
            message = None
            try:
                message = json.loads(raw)
                if not isinstance(message, dict):
                    raise ValueError("Expected a landmark message")
                if "config" in message:
                    threshold = message["config"]["confidence_threshold"]
                    if isinstance(threshold, bool) or not isinstance(threshold, (int, float)) or not math.isfinite(threshold) or not 0 <= threshold <= 1:
                        raise ValueError("Threshold must be between zero and one")
                    session.threshold = max(session.model.threshold, threshold)
                    session.reset()
                    response = {"status": "configured", "threshold": session.threshold}
                elif message.get("reset") is True:
                    session.reset()
                    response = {"status": "reset"}
                elif "confirm" in message:
                    response = session.confirm(message["confirm"], message.get("revision"))
                else:
                    vector = message.get("landmarks")
                    if not isinstance(vector, list) or len(vector) != 141 or any(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or abs(value) > 100 for value in vector):
                        raise ValueError("Expected 141 finite landmark coordinates")
                    timestamp = message.get("timestamp", time.monotonic() * 1000)
                    if isinstance(timestamp, bool) or not isinstance(timestamp, (int, float)) or not math.isfinite(timestamp):
                        raise ValueError("Invalid frame timestamp")
                    response = await run_in_threadpool(session.feed, vector, timestamp)
            except (ValueError, KeyError, TypeError) as error:
                response = {"error": str(error)}
            except Exception:
                logger.exception("Recognition failed")
                session.reset()
                response = {"error": "Recognition failed. Please sign the word again."}
            response["processingMs"] = round((time.perf_counter() - started) * 1000, 1)
            if isinstance(message, dict) and isinstance(message.get("frameId"), int):
                response["frameId"] = message["frameId"]
            capture.write(message, response)
            await websocket.send_json(response)
    except WebSocketDisconnect:
        pass
    finally:
        capture.close()
