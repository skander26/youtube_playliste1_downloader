# YouTube Playlist Downloader

A web application to download videos from YouTube playlists in MP3 or MP4 format.

## Prerequisites

1.  **Python 3.8+**
2.  **Node.js 16+**
3.  **FFmpeg**: Required for media conversion.
    - Windows: [Download FFmpeg](https://ffmpeg.org/download.html), extract it, and add the `bin` folder to your System PATH.

## Installation & Running

### 1. Backend (FastAPI)

Open a terminal in the project root (`yt/`):

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run the server
python -m uvicorn backend.main:app --reload --port 8000
```

The backend will start at `http://localhost:8000`.

### 2. Frontend (React)

Open a **new** terminal in the `frontend/` directory (`yt/frontend/`):

```bash
# Install dependencies (first time only)
npm install

# Run the development server
npm run dev
```

The frontend will start at `http://localhost:5173`.

## Usage

1.  Open `http://localhost:5173` in your browser.
2.  Paste a public YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=...`).
3.  Click **Load**.
4.  Select the videos you want to download.
5.  Choose **MP3** or **MP4**.
6.  Click **Download**.
