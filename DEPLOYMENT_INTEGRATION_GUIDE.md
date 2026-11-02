# CHIXUS Architecture & DevOps Integration Guide

This guide documents the technical contracts, environment variables, safety verification specifications, and deployment steps for connecting the CHIXUS frontend application with your live FastAPI backend.

---

## 1. Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite Single-Page Application (SPA) with rear-camera optical capture, multi-angle keyframe acquisition, and Web Audio synthesis.
- **Backend**: FastAPI (Python) or Node.js microservice running YOLOv8 / DeepSeek reasoning models.
- **Protocol**: REST HTTP for static frame scans and user lookup; WebSocket (`ws://` / `wss://`) for live rear-camera frame streaming.

---

## 2. Environment Variables

Configure these variables in your frontend deployment environment or `.env` file:

| Variable | Default (Fallback) | Description |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | *Same origin (`""`)* | Base URL for FastAPI REST services (e.g. `http://localhost:8000` or `https://api.chixus.network`). |
| `VITE_WS_URL` | `ws://${host}/ws/rear-camera-stream` | WebSocket streaming endpoint for rear-camera frame transmission. |
| `VITE_FASTAPI_URL` | *Same origin (`""`)* | Alias for `VITE_BACKEND_URL`. |
| `VITE_FASTAPI_WS_URL`| `ws://${host}/ws/rear-camera-stream` | Alias for `VITE_WS_URL`. |

---

## 3. API Technical Specification

### A. Backend Health & Model Readiness
- **Route**: `GET /health`
- **Response `200 OK`**:
```json
{
  "status": "HEALTHY",
  "model_readiness": "READY",
  "service": "CHIXUS-FASTAPI-INSPECTION-ENGINE",
  "version": "1.0.0",
  "engine": "FastAPI / YOLOv8 Nano / Core Edge Model",
  "timestamp": "2026-11-02T12:00:00.000Z",
  "telemetry_stream": "ACTIVE"
}
```

### B. Optical Inspection Scan
- **Route**: `POST /api/v1/inspect-scan`
- **Content-Type**: `multipart/form-data` or `application/json`
- **Fields (FormData)**:
  - `file`: Image Blob (`live_capture.jpg`)
  - `symptom_text`: String (e.g., operator notes from "Additional Equipment Information")
  - `is_live_capture`: `"true"`
  - `capture_source`: `"rear_camera"`
- **Response Contract (`200 OK`)**:
```json
{
  "status": "SUCCESS", // "SUCCESS" | "NO_FAULT_DETECTED" | "REROUTE_TO_SPECIALIST"
  "reroute_reason": null, // "LOW_VISION_CONFIDENCE" | "LOW_DIAGNOSTIC_CONFIDENCE" | null
  "vision_analysis": {
    "board_condition": "DEFECTIVE", // "DEFECTIVE" | "HEALTHY_INTACT"
    "detected_anomaly": "Cold Solder Joint on Pin 12",
    "component_identifier": "IC-PWR-QFN24",
    "fault_tag": "COLD_JOINT",
    "vision_confidence_score": 0.942
  },
  "circuit_reasoning": {
    "matched_fault_id": "FLT-CLD-8421",
    "knowledge_base_reference": "IPC-A-610G Class 3 Electronic Assemblies",
    "reasoning_confidence_score": 0.965,
    "repair_steps": [
      "1. Verify zero energy and discharge input filter capacitors (C101, C102).",
      "2. Apply flux pen (RMA-223) across QFN24 pin perimeter.",
      "3. Reflow joint using fine-chisel iron at 350°C for 2.5 seconds.",
      "4. Clean residue with 99% isopropyl alcohol and re-verify under 20x magnification."
    ]
  },
  "database_routing_filter": {
    "target_fault_tag": "COLD_JOINT",
    "minimum_engineer_tier": "Tier 2 Hardware Specialist"
  },
  "bounding_box": {
    "x": 38.4,
    "y": 42.1,
    "w": 18.2,
    "h": 14.5
  }
}
```

### C. Live Rear-Camera WebSocket Stream
- **Route**: `ws://<backend-host>:8000/ws/rear-camera-stream`
- **Client Frame Transmission Payload (15–20 FPS)**:
```json
{
  "frame_base64": "<base64_encoded_jpeg>",
  "symptom_notes": "Live inspection stream",
  "client_timestamp_ms": 1798891200000,
  "is_live_capture": true
}
```
- **Backend Stream Response**:
  - Delivers `CoreDiagnosticResponse` with `circuit_reasoning: null` (repair procedures are intentionally locked during streaming).

### D. Zero-Energy Live-Dead-Live Safety Verification
- **Route**: `POST /inspect/verify-safety`
- **Request Payload**:
```json
{
  "voltage_reading": 0.00,
  "meter_self_test_passed": true,
  "circuit_deenergized": true,
  "notes": "Multimeter verified on 12V bench supply prior to bus measurement"
}
```
- **Response Contract**:
```json
{
  "status": "SAFETY_VERIFIED", // "SAFETY_VERIFIED" | "HAZARD_DETECTED"
  "zero_energy_state_confirmed": true,
  "protocol": "NFPA 70E / IEEE 1584 Live-Dead-Live Zero-Energy State",
  "safety_clearance_id": "SAF-2026-9041",
  "timestamp": "2026-11-02T12:00:00.000Z"
}
```

### E. Operator ID Registry Lookup
- **Route**: `GET /api/users/search?id=<OPERATOR_KEY>`
- **Response `200 OK`**:
```json
{
  "status": "success",
  "user": {
    "operator_key": "CHI-7649-NG",
    "name": "Chinaza Joseph",
    "role": "Founder | CPO CHIXUS System",
    "avatar_url": "",
    "location": "Lagos, Nigeria",
    "headline": "Lead Embedded Systems Architect",
    "inspections": 128,
    "faults": 14,
    "accuracy": "99.1%"
  }
}
```
- **Response `404 Not Found`**:
```json
{
  "status": "error",
  "message": "Operator ID does not exist."
}
```

---

## 4. What Zero-Energy & Observation Notes Mean

### What is "Zero-Energy Verification" (Live-Dead-Live)?
In electrical and high-voltage electronics (such as power inverters, solar charge controllers, industrial switchgear, and capacitor banks), technicians face severe arc-flash and electrocution hazards.
The **Live-Dead-Live (LDL)** safety procedure requires:
1. **Live Test 1**: Measure a known energized test source to prove the multimeter, fuses, and test leads are functioning.
2. **Dead Test**: Measure the equipment under test across all phases/rails to prove voltage is **0.00V** (zero energy potential) and capacitors are fully discharged.
3. **Live Test 2**: Measure the known live test source once more to prove the meter did not fail open or blow an internal fuse during the measurement.
Only after all 3 steps pass does the system issue a valid electrical safety clearance.

### What is "Additional Equipment Information"?
This field allows operators to provide real-world operating context (e.g., *"Power supply buzzing under load, suspected bridge rectifier failure, unit shut down after lightning surge"*) directly to the AI vision and reasoning models. This symptom context guides the backend's DeepSeek reasoning engine to correlate visible physical anomalies with schematic circuitry.

---

## 5. Deployment Checklist for DevOps

1. **Deploy FastAPI Backend**:
   - Host FastAPI backend container on your cloud provider (Google Cloud Run, AWS ECS, or Kubernetes).
   - Ensure CORS headers allow requests from the frontend domain:
     `Access-Control-Allow-Origin: https://<frontend-domain>`
   - Enable WebSocket proxying with protocol upgrade headers (`Upgrade: websocket`, `Connection: Upgrade`).

2. **Deploy Frontend**:
   - Build frontend assets: `npm run build`
   - Set environment variables `VITE_BACKEND_URL` and `VITE_WS_URL` pointing to your deployed backend domain.
   - Serve static `dist/` directory via CDN, Nginx, or Dockerized Express container.
