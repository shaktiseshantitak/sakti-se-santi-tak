import React, { useState, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Headphones, Music, RefreshCw } from 'lucide-react';
import { Book } from '../../types';

interface AudioPlayerModalProps {
  book: Book;
  onClose: () => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ book, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180); // default 3 min sample

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Audio playback simulation:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-amber-950 text-amber-50 w-full max-w-md rounded-2xl shadow-sm p-6 border border-amber-500/40 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-amber-300 hover:text-white hover:bg-amber-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Art & Title */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-sm border-2 border-amber-500/50 mb-4 relative group">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Headphones className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
          </div>

          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1 flex items-center gap-1">
            <Music className="w-3.5 h-3.5" /> Chanted Audio Sample
          </span>
          <h3 className="font-semibold text-lg text-white leading-snug line-clamp-2">
            {book.title}
          </h3>
          <p className="text-xs text-amber-300 mt-1">By {book.authorName}</p>
        </div>

        {/* Hidden Audio element with fallback handler */}
        <audio
          ref={audioRef}
          src={book.sampleAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Progress Bar */}
        <div className="mt-6">
          <input
            type="range"
            min={0}
            max={duration || 180}
            value={currentTime}
            onChange={e => {
              const val = Number(e.target.value);
              setCurrentTime(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="w-full h-1.5 bg-amber-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-amber-400 font-mono mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={toggleMute}
            className="p-2 text-amber-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm transition-transform transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="p-2 text-amber-300 hover:text-white transition-colors"
            title="Replay Sample"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
