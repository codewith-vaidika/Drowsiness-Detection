# 🚗 Real-Time Driver Sleep Detection System

A robust, real-time drowsiness detection system that monitors the driver's Eye Aspect Ratio (EAR) using a webcam and triggers an audible + visual alarm if the driver's eyes remain closed for 5 consecutive seconds.

## Features

- **Facial Landmark Tracking** — dlib's 68-point model pinpoints left & right eye regions.
- **Eye Aspect Ratio (EAR)** — Mathematically detects eye closure with sub-frame precision.
- **Dynamic FPS-Based Alarm** — Adapts the 5-second threshold to the actual camera frame rate.
- **Multithreaded Audio Alert** — Plays `alert.wav` on a background thread via pygame (no feed stutter).
- **Visual Feedback** — Green convex-hull eye outlines + a red "DANGER: SLEEP DETECTED" banner.
- **Live HUD** — On-screen EAR value, FPS counter, and a progress bar showing time-to-alarm.

## Prerequisites

| Dependency | Purpose |
|---|---|
| Python 3.8+ | Runtime |
| OpenCV | Webcam capture & drawing |
| dlib | Face detection & landmark prediction |
| scipy | Euclidean distance for EAR |
| imutils | Landmark index helpers |
| pygame | Threaded audio playback |

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

> **Note:** `dlib` requires CMake and a C++ compiler. On Windows you may need
> [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

### 2. Download the landmark model

```bash
# Download and extract the dlib 68-point model
curl -LO http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
bunzip2 shape_predictor_68_face_landmarks.dat.bz2
```

Place `shape_predictor_68_face_landmarks.dat` in the project root.

### 3. Add an alert sound

Place an `alert.wav` file in the project root. Any short, loud alarm tone works.

## Usage

```bash
python sleep_detection.py
```

- The webcam feed will open in a window titled **Driver Sleep Detection**.
- Live EAR, FPS, and alarm progress are printed to the console and shown on-screen.
- Close your eyes for 5 seconds to trigger the alarm.
- Press **`q`** to quit.

## Configuration

Edit the constants at the top of `sleep_detection.py`:

| Constant | Default | Description |
|---|---|---|
| `EAR_THRESHOLD` | `0.25` | EAR below this = eyes closed |
| `ALARM_DURATION_SEC` | `5.0` | Seconds of closure before alarm |
| `ALERT_SOUND_PATH` | `alert.wav` | Path to the alarm sound file |
| `PREDICTOR_PATH` | `shape_predictor_68_face_landmarks.dat` | Path to the dlib model |

## Architecture

```
Webcam → Grayscale → dlib Face Detection → Landmark Prediction
  → EAR Calculation → Frame Counter (FPS-adaptive)
      → Below threshold for 5s? → Alarm Thread (pygame) + Visual Overlay
      → Above threshold?        → Reset counter, stop alarm
```
## 📦 System Architecture & Data Flow

```text
[ Webcam / Driver Camera ]
          │
          ▼ (Real-time Processing)
  [ Python Edge Node ] ──► (Local Audio Buzzer via winsound)
          │
          ▼ (HTTP POST with x-api-key Header / Debounced)
  [ Express.js REST API ]
          │
     ┌────┴────┐
     ▼         ▼
[MongoDB]   [React Dashboard] ◄── (Auto-polling GET /api/analytics)


