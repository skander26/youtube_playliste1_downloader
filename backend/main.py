from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import shutil

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)

# Models
class PlaylistRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    video_id: str
    format: str  # 'mp3' or 'mp4'

# Temp directory for downloads
DOWNLOAD_DIR = "temp_downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def cleanup_file(path: str):
    """Deletes the file after streaming."""
    try:
        if os.path.exists(path):
            os.remove(path)
            print(f"Deleted temp file: {path}")
    except Exception as e:
        print(f"Error deleting file {path}: {e}")

@app.post("/api/playlist")
async def get_playlist(request: PlaylistRequest):
    """Fetches playlist metadata without downloading."""
    try:
        ydl_opts = {
            'extract_flat': True,  # Don't download, just get metadata
            'dump_single_json': True,
            'quiet': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=False)
            
            if 'entries' not in info:
                raise HTTPException(status_code=400, detail="Invalid playlist URL or no videos found")

            videos = []
            for entry in info['entries']:
                # Some entries might be None if deleted
                if entry:
                    videos.append({
                        'id': entry.get('id'),
                        'title': entry.get('title'),
                        'thumbnail': entry.get('thumbnails', [{}])[0].get('url') if entry.get('thumbnails') else None,
                        'duration': entry.get('duration')
                    })
            return {"title": info.get('title'), "videos": videos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download")
async def download_video(video_id: str, format: str, background_tasks: BackgroundTasks):
    """Downloads a video and streams it to the client."""
    if format not in ['mp3', 'mp4']:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'mp3' or 'mp4'.")

    # Check for FFmpeg if format is mp3 or we need merging
    if shutil.which('ffmpeg') is None:
        if format == 'mp3':
             raise HTTPException(status_code=500, detail="FFmpeg is not installed on the server. Required for MP3 conversion.")
        # For MP4, we might get away with 'best' if we don't merge, but quality suffers.
        # We'll warn or try a fallback, but for now let's be explicit.
        # raise HTTPException(status_code=500, detail="FFmpeg is not installed. Required for high quality video.")

    try:
        # Get video info first to get the title
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            video_title = info.get('title', f'video_{video_id}')
            
        # Sanitize filename
        safe_title = "".join([c for c in video_title if c.isalpha() or c.isdigit() or c in " .-_"]).strip()
        if not safe_title:
            safe_title = f"video_{video_id}"
            
        # Unique filename to avoid collisions but keep title
        filename_base = f"{safe_title}_{uuid.uuid4().hex[:8]}"
        output_template = os.path.join(DOWNLOAD_DIR, f"{filename_base}.%(ext)s")
        
        ydl_opts = {
            'outtmpl': output_template,
            'quiet': True,
        }

        if format == 'mp3':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            })
        else:
            # If ffmpeg is missing, avoid merging
            if shutil.which('ffmpeg') is None:
                ydl_opts['format'] = 'best[ext=mp4]/best'
            else:
                ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

        # Find the generated file
        final_filename = f"{filename_base}.{'mp3' if format == 'mp3' else 'mp4'}"
        file_path = os.path.join(DOWNLOAD_DIR, final_filename)
        
        # Fallback search
        if not os.path.exists(file_path):
            for f in os.listdir(DOWNLOAD_DIR):
                if f.startswith(filename_base):
                    file_path = os.path.join(DOWNLOAD_DIR, f)
                    final_filename = f
                    break
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=500, detail="Download failed: File not found after download")

        # Schedule cleanup
        background_tasks.add_task(cleanup_file, file_path)
        
        # Return with the clean title as filename
        download_name = f"{safe_title}.{format}"

        return FileResponse(
            file_path, 
            media_type='audio/mpeg' if format == 'mp3' else 'video/mp4', 
            filename=download_name
        )

    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(status_code=400, detail=f"YouTube Download Error: {str(e)}")
    except Exception as e:
        print(f"Server Error: {str(e)}") # Log it
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
