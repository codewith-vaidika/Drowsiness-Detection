"""
Real-Time Driver Sleep Detection System
========================================
Uses OpenCV for webcam capture and MediaPipe Face Mesh (478 landmarks) to
monitor the driver's Eye Aspect Ratio (EAR).  If EAR stays below a
configurable threshold for 5 consecutive seconds, a multithreaded audio
alarm is triggered, a visual danger overlay is rendered on the feed, and
a single debounced alert is POSTed to the Node.js backend API.

Platform:
    Windows (uses the built-in `winsound` module for audio alerts)

Dependencies:
    pip install opencv-python mediapipe numpy requests

No C++ compiler or external model files are required — MediaPipe bundles
its own TFLite models automatically.
"""

import sys
import os
import time
import math
import threading
import logging
import winsound
from collections import deque

import requests

import urllib.request

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# ─── Logging Configuration ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Constants ───────────────────────────────────────────────────────────────
# Eye Aspect Ratio threshold.  Below this value the eyes are considered closed.
# MediaPipe uses normalized coordinates; typical open-eye EAR is ~0.25-0.35.
EAR_THRESHOLD = 0.22

# Duration (in seconds) the eyes must remain closed before the alarm fires.
ALARM_DURATION_SEC = 5.0

# Beep tone configuration (frequency in Hz, duration of each beep in ms).
ALERT_BEEP_FREQ = 2500
ALERT_BEEP_MS = 500

# Number of recent frame-time samples used for the rolling FPS estimate.
FPS_WINDOW_SIZE = 30

# ─── Backend API Configuration ──────────────────────────────────────────────
# URL of the Node.js Express alert endpoint.
BACKEND_API_URL = os.environ.get(
    "SLEEP_API_URL",
    "http://localhost:5000/api/alerts",
)

# Secret API key used to authenticate with the backend.
API_KEY = os.environ.get("SLEEP_API_KEY", "your-secret-api-key-here")

# HTTP request timeout (seconds) to avoid blocking the thread indefinitely.
HTTP_TIMEOUT_SEC = 5


# ─── MediaPipe Eye Landmark Indices ─────────────────────────────────────────
# MediaPipe Face Mesh 478-landmark model.
#
# For the EAR formula we need 6 ordered points per eye matching the layout:
#   p1 (outer corner) → p2 (upper-outer lid) → p3 (upper-inner lid)
#   p4 (inner corner) → p5 (lower-inner lid) → p6 (lower-outer lid)
#
# These indices are taken from the canonical Face Mesh UV map.

RIGHT_EYE_EAR_IDX = [33, 160, 158, 133, 153, 144]
LEFT_EYE_EAR_IDX  = [362, 385, 387, 263, 373, 380]

# Full contour indices for drawing (ordered around each eye).
RIGHT_EYE_CONTOUR = [33, 246, 161, 160, 159, 158, 157, 173,
                     133, 155, 154, 153, 145, 144, 163, 7]
LEFT_EYE_CONTOUR  = [362, 398, 384, 385, 386, 387, 388, 466,
                     263, 249, 390, 373, 374, 380, 381, 382]


# ─── EAR Calculation ────────────────────────────────────────────────────────
def _euclidean(p1: tuple[float, float], p2: tuple[float, float]) -> float:
    """Euclidean distance between two 2-D points (avoids scipy dependency)."""
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])


def eye_aspect_ratio(eye_pts: list[tuple[int, int]]) -> float:
    """Compute the Eye Aspect Ratio (EAR) from six landmark points.

    The EAR formula:

        EAR = (||p2 - p6|| + ||p3 - p5||) / (2 · ||p1 - p4||)

    Args:
        eye_pts: List of 6 (x, y) *pixel* coordinates ordered as
                 [outer_corner, upper_outer, upper_inner,
                  inner_corner, lower_inner, lower_outer].

    Returns:
        Scalar EAR value.
    """
    # Vertical distances (upper ↔ lower lid)
    vertical_a = _euclidean(eye_pts[1], eye_pts[5])
    vertical_b = _euclidean(eye_pts[2], eye_pts[4])

    # Horizontal distance (outer ↔ inner corner)
    horizontal = _euclidean(eye_pts[0], eye_pts[3])

    if horizontal == 0:
        return 0.0

    return (vertical_a + vertical_b) / (2.0 * horizontal)


def extract_eye_pixels(
    landmarks,
    indices: list[int],
    img_w: int,
    img_h: int,
) -> list[tuple[int, int]]:
    """Convert normalized MediaPipe landmarks to pixel coordinates.

    Args:
        landmarks: `results.multi_face_landmarks[0].landmark` list.
        indices:   Which landmark indices to extract.
        img_w:     Frame width in pixels.
        img_h:     Frame height in pixels.

    Returns:
        List of (x, y) integer pixel coordinates.
    """
    return [
        (int(landmarks[i].x * img_w), int(landmarks[i].y * img_h))
        for i in indices
    ]


# ─── Audio Alert (Threaded via winsound) ────────────────────────────────────
class AlarmPlayer:
    """Plays a repeating alert tone on a background thread using the
    built-in `winsound` module so the video feed is never blocked.

    Uses `winsound.Beep(frequency, duration_ms)` which generates a
    pure tone through the system speaker — no external files or
    third-party libraries required.

    Attributes:
        _freq:    Tone frequency in Hz (default 2500).
        _dur_ms:  Duration of each individual beep in milliseconds.
        _playing: Atomic flag indicating whether the alarm is active.
        _lock:    Threading lock to protect state transitions.
    """

    def __init__(self, freq: int = ALERT_BEEP_FREQ, dur_ms: int = ALERT_BEEP_MS) -> None:
        self._freq = freq
        self._dur_ms = dur_ms
        self._playing = False
        self._lock = threading.Lock()
        logger.info(
            "Audio system initialized (winsound.Beep @ %d Hz, %d ms).",
            self._freq,
            self._dur_ms,
        )

    def start(self) -> None:
        """Begin looping the alert tone on a background thread (idempotent)."""
        with self._lock:
            if self._playing:
                return
            self._playing = True

        thread = threading.Thread(target=self._beep_loop, daemon=True)
        thread.start()
        logger.info("🚨  ALARM STARTED — drowsiness detected!")

    def stop(self) -> None:
        """Stop the alert tone (idempotent).

        The background thread will exit naturally at the end of the
        current Beep call since `_playing` is checked between beeps.
        """
        with self._lock:
            if not self._playing:
                return
            self._playing = False

        logger.info("✅  Alarm stopped — driver alert.")

    @property
    def is_playing(self) -> bool:
        return self._playing

    def _beep_loop(self) -> None:
        """Background thread target: repeatedly beeps until stopped.

        Each `winsound.Beep` call is blocking for `_dur_ms` milliseconds,
        but since it runs on a daemon thread the main loop is unaffected.
        A short sleep between beeps allows the stop flag to be checked.
        """
        try:
            while self._playing:
                winsound.Beep(self._freq, self._dur_ms)
                # Brief gap between beeps — also lets the stop flag propagate
                time.sleep(0.05)
        except Exception as exc:
            logger.error("Audio playback error: %s", exc)


# ─── Backend Alert Dispatcher (Threaded + Debounced) ────────────────────────
class AlertDispatcher:
    """Sends drowsiness alerts to the Node.js backend on a background thread.

    Guarantees:
      - Network I/O never blocks the OpenCV video loop.
      - Exactly ONE POST request fires per sleep event (debounced).
      - Connection failures are caught gracefully without crashing.

    Lifecycle per sleep event:
      1. The main loop calls `dispatch()` on every alarm-active frame.
      2. Only the *first* call actually fires the HTTP request;
         subsequent calls are no-ops until `reset()` is called.
      3. When the driver's eyes reopen, `main()` calls `reset()`
         so the next sleep event can trigger a fresh request.
    """

    def __init__(self, api_url: str, api_key: str, timeout: int) -> None:
        self._api_url = api_url
        self._api_key = api_key
        self._timeout = timeout
        self._sent = False          # True once a POST has been fired for the current event
        self._lock = threading.Lock()

    def dispatch(self, alert_duration: float) -> None:
        """Fire a single POST request for this sleep event (idempotent).

        Subsequent calls while `_sent` is True are silently ignored,
        preventing the API from being flooded every frame.

        Args:
            alert_duration: Seconds the driver's eyes remained closed.
        """
        with self._lock:
            if self._sent:
                return
            self._sent = True

        # Offload the blocking HTTP call to a daemon thread
        thread = threading.Thread(
            target=self._post_alert,
            args=(alert_duration,),
            daemon=True,
        )
        thread.start()

    def reset(self) -> None:
        """Reset the debounce flag so the next sleep event triggers a new POST."""
        with self._lock:
            self._sent = False

    def _post_alert(self, alert_duration: float) -> None:
        """Background thread target: sends the alert payload to the backend.

        Args:
            alert_duration: Seconds the driver's eyes remained closed.
        """
        payload = {
            "alertDuration": alert_duration,
        }
        headers = {
            "x-api-key": self._api_key,
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                self._api_url,
                json=payload,
                headers=headers,
                timeout=self._timeout,
            )
            if response.status_code == 201:
                logger.info(
                    "📡  Alert dispatched to backend — (%.1fs)",
                    alert_duration,
                )
            else:
                logger.warning(
                    "⚠️  Backend returned HTTP %d: %s",
                    response.status_code,
                    response.text[:200],
                )
        except requests.ConnectionError:
            logger.warning("Backend offline — alert saved locally")
        except requests.Timeout:
            logger.warning("Backend offline — alert saved locally")
        except requests.RequestException as exc:
            logger.warning("Backend request failed: %s", exc)


# ─── FPS Estimator ───────────────────────────────────────────────────────────
class FPSEstimator:
    """Maintains a rolling estimate of the webcam's effective frame rate.

    This is used to convert the 5-second alarm duration into a frame count
    that adapts dynamically to the actual camera/processing speed.
    """

    def __init__(self, window_size: int = FPS_WINDOW_SIZE) -> None:
        self._timestamps: deque[float] = deque(maxlen=window_size)

    def tick(self) -> None:
        """Record the current timestamp for a new frame."""
        self._timestamps.append(time.perf_counter())

    @property
    def fps(self) -> float:
        """Return the current rolling FPS estimate, or 0 if insufficient data."""
        if len(self._timestamps) < 2:
            return 0.0
        elapsed = self._timestamps[-1] - self._timestamps[0]
        if elapsed <= 0:
            return 0.0
        return (len(self._timestamps) - 1) / elapsed

    @property
    def alarm_frame_count(self) -> int:
        """Number of consecutive below-threshold frames equivalent to
        ALARM_DURATION_SEC seconds at the current FPS."""
        current_fps = self.fps
        if current_fps <= 0:
            # Fallback: assume 30 FPS until we have enough samples
            current_fps = 30.0
        return int(current_fps * ALARM_DURATION_SEC)


# ─── Drawing Helpers ─────────────────────────────────────────────────────────
def draw_eye_contour(
    frame: np.ndarray,
    contour_pts: list[tuple[int, int]],
    color: tuple[int, int, int] = (0, 255, 0),
) -> None:
    """Draw the eye contour as a closed polyline with landmark dots.

    Args:
        frame:       The BGR video frame (modified in-place).
        contour_pts: Ordered list of (x, y) pixel coordinates around the eye.
        color:       BGR color for the polyline.
    """
    pts = np.array(contour_pts, dtype=np.int32)
    cv2.polylines(frame, [pts], isClosed=True, color=color, thickness=1, lineType=cv2.LINE_AA)
    for (x, y) in contour_pts:
        cv2.circle(frame, (x, y), 2, (0, 255, 255), -1)


def draw_danger_overlay(frame: np.ndarray) -> None:
    """Render a prominent red 'DANGER: SLEEP DETECTED' banner on the frame.

    A semi-transparent red rectangle is drawn at the top of the frame with
    bold white text to ensure maximum visibility.

    Args:
        frame: The BGR video frame (modified in-place).
    """
    h, w = frame.shape[:2]

    # Semi-transparent red banner
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 80), (0, 0, 180), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    # Bold white text
    text = "DANGER: SLEEP DETECTED"
    font = cv2.FONT_HERSHEY_DUPLEX
    scale = 1.2
    thickness = 3

    # Center the text horizontally
    (tw, th), _ = cv2.getTextSize(text, font, scale, thickness)
    x = (w - tw) // 2
    y = 55

    # Drop-shadow for legibility
    cv2.putText(frame, text, (x + 2, y + 2), font, scale, (0, 0, 0), thickness + 1, cv2.LINE_AA)
    cv2.putText(frame, text, (x, y), font, scale, (255, 255, 255), thickness, cv2.LINE_AA)


def draw_hud(frame: np.ndarray, ear: float, fps: float, alarm_active: bool,
             closed_frames: int, alarm_threshold: int) -> None:
    """Draw the heads-up display with live stats on the bottom of the frame.

    Args:
        frame:           The BGR video frame (modified in-place).
        ear:             Current averaged EAR value.
        fps:             Current FPS estimate.
        alarm_active:    Whether the alarm is currently triggered.
        closed_frames:   Consecutive frames with EAR below threshold.
        alarm_threshold: Frame count required to trigger the alarm.
    """
    h, w = frame.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    color = (0, 255, 0) if not alarm_active else (0, 0, 255)
    y_base = h - 15

    # EAR value
    cv2.putText(frame, f"EAR: {ear:.3f}", (10, y_base - 40),
                font, 0.6, color, 2, cv2.LINE_AA)

    # FPS
    cv2.putText(frame, f"FPS: {fps:.1f}", (10, y_base - 15),
                font, 0.6, (200, 200, 200), 1, cv2.LINE_AA)

    # Progress bar: how close we are to the alarm threshold
    if alarm_threshold > 0:
        progress = min(closed_frames / alarm_threshold, 1.0)
    else:
        progress = 0.0

    bar_x, bar_y, bar_w, bar_h = w - 220, y_base - 50, 200, 20
    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h),
                  (80, 80, 80), -1)
    fill_w = int(bar_w * progress)
    bar_color = (0, 255, 0) if progress < 0.6 else (0, 165, 255) if progress < 0.9 else (0, 0, 255)
    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + fill_w, bar_y + bar_h),
                  bar_color, -1)
    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h),
                  (255, 255, 255), 1)

    label = f"Closed: {closed_frames}/{alarm_threshold}"
    cv2.putText(frame, label, (bar_x, bar_y - 5),
                font, 0.5, (200, 200, 200), 1, cv2.LINE_AA)


# ─── Main Detection Loop ────────────────────────────────────────────────────
def main() -> None:
    """Entry point: initialises MediaPipe Face Mesh, opens the webcam, and
    runs the real-time sleep detection loop until the user presses 'q'."""

    # ── Initialise MediaPipe Face Landmarker (Tasks API) ───────────────────
    logger.info("Initializing MediaPipe Face Landmarker…")
    
    model_path = "face_landmarker.task"
    if not os.path.exists(model_path):
        logger.info(f"Downloading {model_path} (this may take a moment)…")
        url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        urllib.request.urlretrieve(url, model_path)
        logger.info("Download complete.")

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        running_mode=vision.RunningMode.VIDEO)
    
    face_landmarker = vision.FaceLandmarker.create_from_options(options)
    logger.info("MediaPipe Face Landmarker ready (478 landmarks).")

    # ── Open webcam ──────────────────────────────────────────────────────
    logger.info("Opening webcam (index 0)…")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error(
            "Cannot open webcam. Ensure a camera is connected and not in "
            "use by another application."
        )
        sys.exit(1)

    # Allow the camera sensor to warm up
    time.sleep(1.0)
    logger.info("Webcam opened successfully. Press 'q' to quit.")

    # ── State variables ──────────────────────────────────────────────────
    closed_frame_counter = 0          # Consecutive frames with EAR < threshold
    fps_estimator = FPSEstimator()
    alarm = AlarmPlayer()
    dispatcher = AlertDispatcher(BACKEND_API_URL, API_KEY, HTTP_TIMEOUT_SEC)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                logger.warning("Failed to grab frame — retrying…")
                continue

            fps_estimator.tick()
            img_h, img_w = frame.shape[:2]

            # MediaPipe expects RGB input
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            # Timestamp required for VIDEO running mode (in milliseconds)
            timestamp_ms = int(time.perf_counter() * 1000)
            
            results = face_landmarker.detect_for_video(mp_image, timestamp_ms)

            if results.face_landmarks:
                landmarks = results.face_landmarks[0]

                # ── Extract eye coordinates in pixel space ───────────
                left_ear_pts  = extract_eye_pixels(landmarks, LEFT_EYE_EAR_IDX, img_w, img_h)
                right_ear_pts = extract_eye_pixels(landmarks, RIGHT_EYE_EAR_IDX, img_w, img_h)

                # Full contours for drawing
                left_contour  = extract_eye_pixels(landmarks, LEFT_EYE_CONTOUR, img_w, img_h)
                right_contour = extract_eye_pixels(landmarks, RIGHT_EYE_CONTOUR, img_w, img_h)

                # ── Compute averaged EAR ─────────────────────────────
                left_ear  = eye_aspect_ratio(left_ear_pts)
                right_ear = eye_aspect_ratio(right_ear_pts)
                avg_ear   = (left_ear + right_ear) / 2.0

                # Print live EAR to console
                print(
                    f"\rEAR: {avg_ear:.4f}  |  FPS: {fps_estimator.fps:.1f}  "
                    f"|  Closed frames: {closed_frame_counter}/{fps_estimator.alarm_frame_count}",
                    end="", flush=True,
                )

                # ── Draw eye contours ────────────────────────────────
                draw_eye_contour(frame, left_contour)
                draw_eye_contour(frame, right_contour)

                # ── Alarm logic ──────────────────────────────────────
                if avg_ear < EAR_THRESHOLD:
                    closed_frame_counter += 1

                    if closed_frame_counter >= fps_estimator.alarm_frame_count:
                        # Eyes have been closed for >= 5 seconds — trigger alarm
                        draw_danger_overlay(frame)
                        alarm.start()

                        # Dispatch exactly ONE alert to the backend per sleep event.
                        # The dispatcher's internal debounce flag prevents duplicate
                        # POSTs on subsequent frames while the alarm is still active.
                        dispatcher.dispatch(alert_duration=ALARM_DURATION_SEC)
                else:
                    # Eyes are open — reset everything
                    closed_frame_counter = 0
                    alarm.stop()
                    dispatcher.reset()  # Allow a fresh POST on the next sleep event

                # Draw the HUD
                draw_hud(
                    frame,
                    ear=avg_ear,
                    fps=fps_estimator.fps,
                    alarm_active=alarm.is_playing,
                    closed_frames=closed_frame_counter,
                    alarm_threshold=fps_estimator.alarm_frame_count,
                )

            # Display the annotated frame
            cv2.imshow("Driver Sleep Detection", frame)

            # Exit on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord("q"):
                logger.info("Quit key pressed — shutting down.")
                break

    except KeyboardInterrupt:
        logger.info("Interrupted — shutting down.")
    finally:
        # Graceful cleanup
        alarm.stop()
        if 'face_landmarker' in locals():
            face_landmarker.close()
        cap.release()
        cv2.destroyAllWindows()
        print()  # Newline after the \r-overwritten console line
        logger.info("Resources released. Goodbye.")


if __name__ == "__main__":
    main()
