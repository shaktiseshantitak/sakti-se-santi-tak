import React, { useState } from 'react';
import {
  X, Radio, Video, Users, Heart, Send, Sparkles, Share2,
  Volume2, VolumeX, MessageSquare, HelpCircle, CheckCircle2,
  Play, ShieldCheck, Disc
} from 'lucide-react';
import { useLiveStream } from '../../context/LiveStreamContext';
import { useAuth } from '../../context/AuthContext';
import { LiveStream } from '../../types';

interface LiveStreamPlayerModalProps {
  onClose: () => void;
  selectedStream?: LiveStream | null;
}

export const LiveStreamPlayerModal: React.FC<LiveStreamPlayerModalProps> = ({
  onClose,
  selectedStream,
}) => {
  const { user } = useAuth();
  const {
    currentStream,
    isLive,
    viewerCount,
    likesCount,
    liveComments,
    sendComment,
    sendHeart,
    floatingHearts,
    pastStreams,
  } = useLiveStream();

  // Active stream to display (either current live or selected recorded replay)
  const stream = selectedStream || currentStream;
  const isCurrentlyLive = stream?.status === 'live';

  const [activeTab, setActiveTab] = useState<'chat' | 'questions' | 'replays'>('chat');
  const [commentInput, setCommentInput] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [audioOnlyMode, setAudioOnlyMode] = useState(stream?.mode === 'audio');
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!stream) return null;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const userName = user?.fullName || 'साधक / श्रोता';
    sendComment(commentInput.trim(), userName, isQuestion);
    setCommentInput('');
    setIsQuestion(false);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredComments = activeTab === 'questions'
    ? liveComments.filter(c => c.isQuestion)
    : liveComments;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="livestream-player-title"
    >
      <div className="glass-panel text-zinc-900 dark:text-zinc-100 w-full max-w-6xl rounded-3xl shadow-sm overflow-hidden relative border border-amber-500/30 flex flex-col max-h-[95vh] my-auto">
        {/* Top Header */}
        <div className="bg-[#251307] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            {isCurrentlyLive ? (
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>LIVE SATSANG</span>
              </span>
            ) : (
              <span className="bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" /> RECORDED REPLAY
              </span>
            )}

            <div>
              <h2 id="livestream-player-title" className="font-serif font-bold text-sm sm:text-base text-amber-100 truncate max-w-[280px] sm:max-w-[500px]">
                {stream.title}
              </h2>
              <p className="text-[11px] text-amber-200/80">
                वक्ता: <span className="font-semibold text-amber-300">{stream.speaker}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="p-2 rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 text-xs"
              title="Share Stream Link"
              aria-label="Share Stream Link"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Live Stream Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 overflow-y-auto flex-1">
          {/* Left / Top 2 Cols: Main Media Player */}
          <div className="lg:col-span-2 bg-zinc-950 flex flex-col justify-between p-3 sm:p-4 relative">
            {/* Floating Physics Hearts Container */}
            <div className="absolute right-6 bottom-20 z-30 pointer-events-none h-60 w-24 overflow-hidden">
              {floatingHearts.map(heart => (
                <div
                  key={heart.id}
                  style={{ left: `${heart.x}%` }}
                  className="absolute bottom-0 text-2xl animate-bounce transition-all duration-1000 opacity-90 text-rose-500"
                >
                  ❤️
                </div>
              ))}
            </div>

            {/* Media Player Screen */}
            <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-sm flex items-center justify-center">
              {audioOnlyMode || stream.mode === 'audio' ? (
                /* Audio Only Radio Mode Visualizer */
                <div className="w-full h-full bg-amber-950 flex flex-col items-center justify-center p-6 text-center space-y-4 relative">
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-amber-500/40 shadow-sm animate-spin-slow">
                    <img
                      src={stream.coverImage || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80'}
                      alt={stream.title}
                      className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-amber-400 font-serif text-sm font-bold">
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>वेदांत सत्संग रेडियो (Audio Broadcast)</span>
                    </div>
                    <p className="text-xs text-amber-200/80 max-w-md mx-auto line-clamp-2">
                      {stream.description}
                    </p>
                  </div>

                  {/* Audio Equalizer Bars Animation */}
                  <div className="flex items-end justify-center gap-1.5 h-8">
                    {[40, 75, 100, 60, 85, 45, 90, 65, 30, 80, 50, 95].map((h, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${h}%` }}
                        className="w-1.5 bg-gradient-to-t from-amber-600 to-amber-300 rounded-full animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ) : stream.customEmbedUrl ? (
                /* Custom Embed Player (YouTube Live / HLS / Google Drive Embed) */
                <iframe
                  src={stream.customEmbedUrl}
                  title={stream.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                /* Standard Live Camera Stream Canvas */
                <div className="relative w-full h-full bg-zinc-950 flex flex-col items-center justify-center">
                  <img
                    src={stream.coverImage || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80'}
                    alt={stream.title}
                    className="w-full h-full object-cover opacity-80"  loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>{stream.category || 'आध्यात्मिक ज्ञान सत्र'}</span>
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight">
                      {stream.title}
                    </h3>
                  </div>
                </div>
              )}

              {/* Top Media Overlay Bar */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCurrentlyLive && (
                    <span className="bg-black/60 text-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-500/30">
                      <Users className="w-3.5 h-3.5" />
                      <span>{viewerCount} Viewers</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAudioOnlyMode(!audioOnlyMode)}
                    className="bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20 transition-all flex items-center gap-1"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>{audioOnlyMode ? 'Switch to Video' : 'Audio Mode (Low Data)'}</span>
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full border border-white/20"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Interaction Bar (React Heart / Pranam Button) */}
            <div className="mt-3 flex items-center justify-between bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 text-white">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-300 font-medium hidden sm:inline">100% Authentic Vedic Satsang Stream</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={sendHeart}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-transform active:scale-90"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{likesCount} Hearts</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Chat & Questions Room */}
          <div className="flex flex-col h-[400px] lg:h-auto glass-panel border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800">
            {/* Tabs Bar */}
            <div className="bg-zinc-900 text-white p-2 flex items-center justify-around border-b border-zinc-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'chat' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>लाइव चैट</span>
              </button>

              <button
                onClick={() => setActiveTab('questions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'questions' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>प्रश्नोत्तरी</span>
              </button>

              <button
                onClick={() => setActiveTab('replays')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'replays' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Disc className="w-3.5 h-3.5" />
                <span>पूर्व सत्र ({pastStreams.length})</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {activeTab === 'replays' ? (
                /* Recorded Replays Tab */
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500 font-semibold mb-2">Previous Recorded Live Streams:</p>
                  {pastStreams.map(rec => (
                    <div
                      key={rec.id}
                      className="p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2 hover:border-amber-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px] text-amber-600 font-bold">
                        <span>{rec.category || 'सत्संग रिकॉर्डिंग'}</span>
                        <span>{rec.viewerCount} Views</span>
                      </div>
                      <h4 className="font-serif font-bold text-xs text-zinc-900 dark:text-white leading-snug">
                        {rec.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate">{rec.speaker}</p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Chat / Question List */
                <div className="space-y-2.5">
                  {filteredComments.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-xs">
                      {activeTab === 'questions'
                        ? 'कोई प्रश्न नहीं पूछा गया है। आप पहला प्रश्न पूछें!'
                        : 'सत्संग चैट में आपका स्वागत है!'}
                    </div>
                  ) : (
                    filteredComments.map(comment => (
                      <div
                        key={comment.id}
                        className={`p-2.5 rounded-xl text-xs space-y-1 ${
                          comment.isVIP
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-950 dark:text-amber-100 font-semibold'
                            : comment.isQuestion
                            ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-zinc-900 dark:text-zinc-100'
                            : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            {comment.userName}
                            {comment.isQuestion && (
                              <span className="bg-blue-600 text-white font-bold text-[9px] px-1.5 py-0.2 rounded">
                                QUESTION
                              </span>
                            )}
                            {comment.isAnswered && (
                              <span className="text-emerald-500 flex items-center gap-0.5 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Answered
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400">{comment.timestamp}</span>
                        </div>

                        <p className="text-xs leading-relaxed">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Comment / Question Send Input Box */}
            {activeTab !== 'replays' && (
              <form onSubmit={handleSendComment} className="p-3 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isQuestion}
                      onChange={e => setIsQuestion(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-amber-800 dark:text-amber-300">
                      पूछें अपना प्रश्न (Mark as Question for Swami Ji)
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder={isQuestion ? 'स्वाी जी से अपना प्रश्न यहाँ लिखें...' : 'सत्संग में टिप्पणी / जय श्री कृष्णा लिखें...'}
                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
