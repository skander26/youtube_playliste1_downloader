import React from 'react';
import { Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function VideoCard({ video, selected, onToggle, progress }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(video.id)}
            className={`
        relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
        ${selected
                    ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/30'
                    : 'hover:shadow-xl hover:shadow-black/30'
                }
      `}
        >
            {/* Thumbnail Container */}
            <div className="aspect-video relative overflow-hidden bg-[hsl(var(--bg-secondary))]">
                {video.thumbnail ? (
                    <>
                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--bg-secondary))] to-[hsl(var(--bg-tertiary))]">
                        <div className="text-[hsl(var(--text-muted))] text-sm">No thumbnail</div>
                    </div>
                )}

                {/* Duration Badge */}
                {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md text-xs font-medium text-white flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(video.duration)}
                    </div>
                )}

                {/* Selection Indicator */}
                <div className={`
          absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200
          ${selected
                        ? 'bg-primary-600 scale-100 shadow-lg'
                        : 'bg-black/40 backdrop-blur-sm scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                    }
        `}>
                    <motion.div
                        initial={false}
                        animate={selected ? { scale: [0, 1.2, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Check size={16} className="text-white" strokeWidth={3} />
                    </motion.div>
                </div>

                {/* Hover Glow Effect */}
                {selected && (
                    <div className="absolute inset-0 bg-primary-600/10 pointer-events-none" />
                )}

                {/* Progress Bar Overlay */}
                {progress !== undefined && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                        <div className="w-3/4 h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        <span className="mt-2 text-white font-medium text-sm">{progress}%</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={`
        p-3 transition-colors duration-200
        ${selected
                    ? 'bg-primary-600/10 border-t border-primary-500/30'
                    : 'bg-[hsl(var(--bg-secondary))] group-hover:bg-[hsl(var(--bg-tertiary))]'
                }
      `}>
                <h3 className="font-medium text-sm leading-snug text-[hsl(var(--text-primary))] line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {video.title || 'Untitled Video'}
                </h3>
            </div>
        </motion.div>
    );
}

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}
