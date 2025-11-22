import React, { useState } from 'react';
import axios from 'axios';
import { VideoCard } from './components/VideoCard';
import { Download, Loader2, Search, Sparkles, Music, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [format, setFormat] = useState('mp3');
  const [downloading, setDownloading] = useState(new Set());

  const [downloadProgress, setDownloadProgress] = useState({});

  const fetchPlaylist = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/playlist', { url });
      setPlaylist(res.data);
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || 'Failed to fetch playlist. Please check the URL.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (playlist?.videos) {
      if (selected.size === playlist.videos.length) {
        setSelected(new Set());
      } else {
        setSelected(new Set(playlist.videos.map(v => v.id)));
      }
    }
  };

  const downloadSelected = async () => {
    for (const videoId of selected) {
      setDownloading(prev => new Set(prev).add(videoId));
      setDownloadProgress(prev => ({ ...prev, [videoId]: 0 }));

      try {
        const response = await axios.get(`http://localhost:8000/api/download`, {
          params: { video_id: videoId, format },
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(prev => ({ ...prev, [videoId]: percentCompleted }));
          }
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;

        // Extract filename from content-disposition
        const contentDisposition = response.headers['content-disposition'];
        let filename = `video-${videoId}.${format}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match) filename = match[1];
          // Decode filename if it's URL encoded (common with some browsers/servers)
          try { filename = decodeURIComponent(filename); } catch (e) { }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error(`Failed to download ${videoId}`, err);
        let errorMessage = `Failed to download video ${videoId}`;
        if (err.response && err.response.data) {
          // Try to read blob as text to get error message
          try {
            const text = await err.response.data.text();
            const json = JSON.parse(text);
            if (json.detail) errorMessage = json.detail;
          } catch (e) { }
        }
        alert(errorMessage);
      } finally {
        setDownloading(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
        setDownloadProgress(prev => {
          const next = { ...prev };
          delete next[videoId];
          return next;
        });
      }
    }
  };

  const totalDuration = playlist?.videos
    .filter(v => selected.has(v.id))
    .reduce((acc, v) => acc + (v.duration || 0), 0);

  const formatTotalDuration = (seconds) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-primary))] text-[hsl(var(--text-primary))] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 mb-12"
        >
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg animate-pulse-glow bg-white/10 backdrop-blur-sm p-1">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight">
            <span className="gradient-text">YouTube</span>
            <br />
            <span className="text-[hsl(var(--text-primary))]">Playlist Downloader</span>
          </h1>

          <p className="text-lg sm:text-xl text-[hsl(var(--text-secondary))] max-w-2xl mx-auto">
            Download your favorite playlists in MP3 or MP4 format with ease
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={fetchPlaylist}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-accent-500 to-pink-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 group-focus-within:opacity-60 transition-all duration-500" />

            {/* Input Container */}
            <div className="relative glass-strong rounded-2xl p-2 flex items-center gap-3 shadow-2xl">
              <div className="pl-4">
                <Search size={24} className="text-[hsl(var(--text-secondary))]" />
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your YouTube playlist URL here..."
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg py-4 text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-muted))]"
              />

              <button
                type="submit"
                disabled={loading || !url}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-primary-500/50 hover:scale-105"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span className="hidden sm:inline">Load Playlist</span>
                    <span className="sm:hidden">Load</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.form>

        {/* Playlist Content */}
        <AnimatePresence mode="wait">
          {playlist && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Controls Bar */}
              <div className="glass-strong rounded-2xl p-4 sm:p-6 sticky top-4 z-20 shadow-xl backdrop-blur-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Playlist Info */}
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[hsl(var(--text-primary))]">
                      {playlist.title}
                    </h2>
                    <span className="px-3 py-1 bg-primary-600/20 text-primary-400 text-sm font-medium rounded-full border border-primary-500/30">
                      {playlist.videos.length} videos
                    </span>
                    {selected.size > 0 && (
                      <span className="px-3 py-1 bg-accent-600/20 text-accent-400 text-sm font-medium rounded-full border border-accent-500/30">
                        Total: {formatTotalDuration(totalDuration)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={selectAll}
                      className="px-4 py-2 text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors"
                    >
                      {selected.size === playlist.videos.length ? 'Deselect All' : 'Select All'}
                    </button>

                    <div className="h-6 w-px bg-white/10" />

                    {/* Format Toggle */}
                    <div className="flex gap-1 p-1 bg-[hsl(var(--bg-secondary))] rounded-lg border border-white/5">
                      <button
                        onClick={() => setFormat('mp3')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${format === 'mp3'
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                          : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
                          }`}
                      >
                        <Music size={16} />
                        MP3
                      </button>
                      <button
                        onClick={() => setFormat('mp4')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${format === 'mp4'
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                          : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
                          }`}
                      >
                        <Video size={16} />
                        MP4
                      </button>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={downloadSelected}
                      disabled={selected.size === 0 || downloading.size > 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-500 hover:to-accent-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-accent-500/50 hover:scale-105"
                    >
                      {downloading.size > 0 ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Downloading {downloading.size}...</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span>Download ({selected.size})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Grid */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                {playlist.videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <VideoCard
                      video={video}
                      selected={selected.has(video.id)}
                      onToggle={toggleSelection}
                      progress={downloadProgress[video.id]}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!playlist && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-600/10 border border-primary-500/20 mb-6">
              <Search size={32} className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-[hsl(var(--text-secondary))] mb-2">
              No playlist loaded yet
            </h3>
            <p className="text-[hsl(var(--text-muted))]">
              Paste a YouTube playlist URL above to get started
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;
