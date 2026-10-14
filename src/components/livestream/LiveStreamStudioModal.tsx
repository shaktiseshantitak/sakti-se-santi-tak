import React, { useState, useEffect, useRef } from 'react';
import {
  X, Video, VideoOff, Mic, MicOff, Radio, Users, Heart,
  Send, Pin, CheckCircle2, Trash2, Sparkles, Monitor,
  HardDrive, AlertCircle, Signal, Disc, Settings
} from 'lucide-react';
import { useLiveStream } from '../../context/LiveStreamContext';
import { LiveStreamMode } from '../../types';
import { validateGoogleDriveLink } from '../../utils/googleDrive';

interface LiveStreamStudioModalProps {
  onClose: () => void;
}

export const LiveStreamStudioModal: React.FC<LiveStreamStudioModalProps> = ({ onClose }) => {
  const {
    currentStream,
    isLive,
    viewerCount,
    likesCount,
    liveComments,
    startStream,
    stopStream,
    updateStreamMode,
    sendComment,
    pinComment,
    markQuestionAnswered,
    deleteComment,
  } = useLiveStream();

  // Form State for creating a new stream
  const [title, setTitle] = useState('🔴 विशेष सत्संग: श्रीमद्भगवद्गीता अध्यात्म रहस्य & शंका समाधान');
  const [speaker, setSpeaker] = useState('स्वामी श्री अनन्तानन्द जी महाराज');
  const [description, setDescription] = useState('दैनिक जीवन में आध्यात्मिक प्रगति, ध्यान साधना एवं श्रोताओं के प्रश्नों का live उत्तर।');
  const [mode, setMode] = useState<LiveStreamMode>('video');
  const [category, setCategory] = useState('भगवद्गीता ज्ञान यज्ञ');
  const [customEmbedUrl, setCustomEmbedUrl] = useState('');

  // Hardware controls state
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [adminCommentInput, setAdminCommentInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize camera/mic preview
  useEffect(() => {
    let active = true;

    async function initMedia() {
      if (!isCamOn && !isMicOn) {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCamOn,
          audio: isMicOn,
        });

        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Could not access camera/microphone:', err);
      }
    }

    if (isLive || !isLive) {
      initMedia();
    }

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCamOn, isMicOn]);

  const handleStartStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !speaker.trim()) return;

    startStream({
      title,
      speaker,
      description,
      mode,
      category,
      customEmbedUrl: customEmbedUrl.trim() || undefined,
    });
  };

  const handleEndStream = () => {
    if (window.confirm('क्या आप सचमुच इस लाइव प्रसारण को समाप्त करना चाहते हैं?')) {
      stopStream();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleToggleCam = () => setIsCamOn(prev => !prev);
  const handleToggleMic = () => setIsMicOn(prev => !prev);

  const handleSendAdminAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCommentInput.trim()) return;

    sendComment(`📢 [व्यवस्थापक/आचार्य]: ${adminCommentInput.trim()}`, 'स्वामी श्री अनन्तानन्द जी');
    setAdminCommentInput('');
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (videoRef.current && mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
          }
        };
      } else {
        setIsScreenSharing(false);
        if (videoRef.current && mediaStreamRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
        }
      }
    } catch (err) {
      console.warn('Screen share cancelled or failed', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-modal-title"
    >
      <div className="glass-panel text-zinc-900 dark:text-zinc-100 w-full max-w-5xl rounded-3xl shadow-sm overflow-hidden relative border border-amber-500/30 my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-amber-950 to-zinc-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="studio-modal-title" className="font-serif font-bold text-lg text-amber-100 flex items-center gap-2">
                <span>Admin Live Broadcast Studio (लाइव प्रसारण केंद्र)</span>
                {isLive && (
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE
                  </span>
                )}
              </h2>
              <p className="text-xs text-amber-200/70">
                Broadcast Audio/Video live stream to all customers & subscribers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Studio"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!isLive ? (
            /* ================= STREAM SETUP FORM ================= */
            <form onSubmit={handleStartStream} className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">लाइव ब्रॉडकास्ट प्रारंभ करें (Start Live Stream)</p>
                  <p>
                    You can broadcast directly using your device WebCam & Microphone, or paste a custom YouTube Live / HLS stream link. Customers can watch live or listen in low-data Audio mode.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    सत्संग / स्ट्रीम शीर्षक (Stream Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="जैसे: श्रीमद्भगवद्गीता ज्ञान यज्ञ..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Speaker */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    वक्ता / आचार्य का नाम (Speaker Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={speaker}
                    onChange={e => setSpeaker(e.target.value)}
                    placeholder="जैसे: स्वामी श्री अनन्तानन्द जी..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  प्रसारण माध्यम चुनें (Stream Mode)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('video')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                      mode === 'video'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Video + Audio (वीडियो व ऑडियो)</p>
                      <p className="text-[11px] opacity-80">Full HD webcam video broadcast with audio</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('audio')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                      mode === 'audio'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Audio Only / Radio (सत्संग रेडियो)</p>
                      <p className="text-[11px] opacity-80">Low-bandwidth voice pravachan & chants</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Camera Preview Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  कैमरा व माइक्रोफोन प्रीव्यू (Camera & Mic Preview)
                </label>
                <div className="relative aspect-video max-h-[260px] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {!isCamOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 text-zinc-400 gap-2">
                      <VideoOff className="w-10 h-10 text-zinc-600" />
                      <p className="text-xs font-medium">Camera is Off (कैमरा बंद है)</p>
                    </div>
                  )}

                  {/* Hardware Overlay Buttons */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 px-4 py-2 rounded-xl text-white">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleCam}
                        className={`p-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                          isCamOn ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400' : 'bg-red-600 text-white'
                        }`}
                      >
                        {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        <span>{isCamOn ? 'Cam On' : 'Cam Off'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleMic}
                        className={`p-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                          isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400' : 'bg-red-600 text-white'
                        }`}
                      >
                        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        <span>{isMicOn ? 'Mic On' : 'Mute'}</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Signal className="w-3.5 h-3.5" /> Hardware Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  विवरण (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="सत्संग का विवरण..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              {/* Start Stream Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-semibold text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm shadow-red-600/30 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Disc className="w-4 h-4 animate-spin" />
                  <span>Go Live Now (लाइव प्रसारण प्रारंभ करें)</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= ACTIVE LIVE BROADCAST CONTROL PANEL ================= */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Live Video Feed & Broadcast Controls */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-sm">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {!isCamOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 text-zinc-400 gap-2">
                      <Radio className="w-12 h-12 text-amber-500 animate-pulse" />
                      <p className="text-sm font-bold text-zinc-200">Audio Only Broadcast Active (केवल ऑडियो प्रसारित हो रहा है)</p>
                      <p className="text-xs text-zinc-400">Low-bandwidth Mode Active</p>
                    </div>
                  )}

                  {/* Top Live Stats Bar */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>LIVE BROADCASTING</span>
                      </span>

                      <span className="bg-black/60 text-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{viewerCount} Live Viewers</span>
                      </span>
                    </div>

                    <span className="bg-black/60 text-rose-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{likesCount} Hearts</span>
                    </span>
                  </div>

                  {/* Bottom Broadcast Control Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-zinc-900/90 px-4 py-2.5 rounded-2xl border border-zinc-800 text-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleCam}
                        className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                          isCamOn ? 'bg-zinc-800 text-emerald-400' : 'bg-red-600 text-white'
                        }`}
                      >
                        {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isCamOn ? 'Cam' : 'Off'}</span>
                      </button>

                      <button
                        onClick={handleToggleMic}
                        className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                          isMicOn ? 'bg-zinc-800 text-emerald-400' : 'bg-red-600 text-white'
                        }`}
                      >
                        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isMicOn ? 'Mic' : 'Muted'}</span>
                      </button>

                      <button
                        onClick={handleToggleScreenShare}
                        className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                          isScreenSharing ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
                      </button>

                      <button
                        onClick={() => updateStreamMode(currentStream?.mode === 'video' ? 'audio' : 'video')}
                        className="p-2 rounded-xl bg-purple-900/60 hover:bg-purple-900 text-purple-200 font-bold text-xs flex items-center gap-1.5 border border-purple-500/30"
                      >
                        <Radio className="w-4 h-4" />
                        <span className="hidden sm:inline">Mode: {currentStream?.mode.toUpperCase()}</span>
                      </button>
                    </div>

                    <button
                      onClick={handleEndStream}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
                    >
                      End Broadcast (समाप्त करें)
                    </button>
                  </div>
                </div>

                {/* Broadcast Info Header */}
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                  <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-100">
                    {currentStream?.title}
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    वक्ता: {currentStream?.speaker} • प्रारंभ: {new Date(currentStream?.startedAt || '').toLocaleTimeString()}
                  </p>
                </div>

                {/* Admin Announcement Input */}
                <form onSubmit={handleSendAdminAnnouncement} className="flex gap-2">
                  <input
                    type="text"
                    value={adminCommentInput}
                    onChange={e => setAdminCommentInput(e.target.value)}
                    placeholder="Send official admin announcement or pin a message..."
                    className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Msg</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Real-time Live Audience Chat & Moderation Panel */}
              <div className="flex flex-col h-[420px] lg:h-[500px] glass-panel rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs">Live Chat & Questions ({liveComments.length})</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                    Real-Time Feed
                  </span>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                  {liveComments.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-xs">
                      No live comments yet. Audience questions will appear here.
                    </div>
                  ) : (
                    liveComments.map(comment => (
                      <div
                        key={comment.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 transition-all ${
                          comment.isVIP
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                            : comment.isQuestion
                            ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-zinc-900 dark:text-zinc-100'
                            : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            {comment.userName}
                            {comment.isQuestion && (
                              <span className="bg-blue-600 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded">
                                QUESTION
                              </span>
                            )}
                            {comment.isAnswered && (
                              <span className="text-emerald-500 flex items-center gap-0.5 text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Answered
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400">{comment.timestamp}</span>
                        </div>

                        <p className="text-xs">{comment.text}</p>

                        {/* Moderation Controls */}
                        <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50 text-[10px]">
                          {comment.isQuestion && !comment.isAnswered && (
                            <button
                              onClick={() => markQuestionAnswered(comment.id)}
                              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Mark Answered
                            </button>
                          )}

                          <button
                            onClick={() => pinComment(comment.id)}
                            className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <Pin className="w-3 h-3" /> {comment.isPinned ? 'Unpin' : 'Pin'}
                          </button>

                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-rose-500 hover:underline flex items-center gap-0.5 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
