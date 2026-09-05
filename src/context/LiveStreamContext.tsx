import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiveStream, LiveStreamComment, LiveStreamMode } from '../types';

interface LiveStreamContextType {
  currentStream: LiveStream | null;
  pastStreams: LiveStream[];
  liveComments: LiveStreamComment[];
  isLive: boolean;
  streamMode: LiveStreamMode;
  viewerCount: number;
  likesCount: number;
  
  // Admin stream controls
  startStream: (config: {
    title: string;
    speaker: string;
    description: string;
    mode: LiveStreamMode;
    coverImage?: string;
    customEmbedUrl?: string;
    category?: string;
  }) => void;
  stopStream: () => void;
  updateStreamMode: (mode: LiveStreamMode) => void;
  
  // Audience interactions
  sendComment: (text: string, userName?: string, isQuestion?: boolean) => void;
  sendHeart: () => void;
  pinComment: (commentId: string) => void;
  markQuestionAnswered: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  
  // Floating reactions state
  floatingHearts: { id: string; x: number }[];
}

const initialPastStreams: LiveStream[] = [
  {
    id: 'rec-1',
    title: 'श्रीमद्भगवद्गीता अध्याय २ - सांख्य योग एवं कर्म रहस्य (विशेष सत्संग)',
    speaker: 'स्वामी श्री अनन्तानन्द जी महाराज',
    description: 'अर्जुन विषाद एवं भगवान श्री कृष्ण के दिव्य उपदेशों पर आधारित अध्यात्मिक व्याख्यान व जिज्ञासा समाधान।',
    mode: 'video',
    status: 'ended',
    startedAt: '2026-08-01T10:00:00Z',
    endedAt: '2026-08-01T11:30:00Z',
    viewerCount: 1240,
    likesCount: 890,
    coverImage: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80',
    recordingUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Demo embed or video stream
    category: 'भगवद्गीता ज्ञान सत्र',
  },
  {
    id: 'rec-2',
    title: 'प्रातःकालीन वैदिक मन्त्रोच्चारण एवं ध्यान साधना (ऑडियो प्रवचन)',
    speaker: 'आचार्य पं. विष्णुदत्त शास्त्री',
    description: 'ऋग्वेद सूक्तों का सस्वर पाठ एवं प्रातः कालीन मानसिक शांति हेतु एकाग्रता अभ्यास।',
    mode: 'audio',
    status: 'ended',
    startedAt: '2026-08-02T06:00:00Z',
    endedAt: '2026-08-02T07:00:00Z',
    viewerCount: 850,
    likesCount: 620,
    coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
    recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    category: 'वैदिक मन्त्र पाठ',
  },
];

const initialComments: LiveStreamComment[] = [
  {
    id: 'c1',
    userName: 'आचार्य रामेश्वर',
    text: 'जय श्री कृष्णा! स्वामी जी सादर प्रणाम। 🙏✨',
    timestamp: '10:02 AM',
  },
  {
    id: 'c2',
    userName: 'सुनील शर्मा',
    text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन की सरल व्याख्या बहुत अद्भुत रही।',
    timestamp: '10:05 AM',
  },
  {
    id: 'c3',
    userName: 'प्रिया शर्मा',
    text: 'स्वामी जी, गृहस्थ जीवन में मन की एकाग्रता कैसे साध्य है?',
    timestamp: '10:12 AM',
    isQuestion: true,
  },
];

const LiveStreamContext = createContext<LiveStreamContextType | undefined>(undefined);

export const LiveStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default active demo live stream so the user can test watching live immediately or broadcast new
  const [currentStream, setCurrentStream] = useState<LiveStream | null>({
    id: 'live-now-1',
    title: '🔴 लाइव सत्संग: श्रीमद्भगवद्गीता ज्ञान ज्ञान यज्ञ & श्रोता प्रश्नोत्तरी',
    speaker: 'स्वामी श्री अनन्तानन्द जी महाराज',
    description: 'वेदांत सिद्धांत, भक्ति योग एवं दैनिक जीवन में आत्मिक शांति पर दिव्य संवाद। live question/answers included.',
    mode: 'video',
    status: 'live',
    startedAt: new Date().toISOString(),
    viewerCount: 428,
    likesCount: 312,
    coverImage: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80',
    category: 'लाइव सत्संग',
  });

  const [pastStreams, setPastStreams] = useState<LiveStream[]>(initialPastStreams);
  const [liveComments, setLiveComments] = useState<LiveStreamComment[]>(initialComments);
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number }[]>([]);

  // Simulation effect to make viewer count & comments organically feel like a real high-engagement live stream
  useEffect(() => {
    if (!currentStream || currentStream.status !== 'live') return;

    const interval = setInterval(() => {
      // Randomly fluctuation in viewer count
      const change = Math.floor(Math.random() * 5) - 2;
      setCurrentStream(prev => prev ? {
        ...prev,
        viewerCount: Math.max(1, prev.viewerCount + change),
      } : null);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentStream?.status]);

  const startStream = (config: {
    title: string;
    speaker: string;
    description: string;
    mode: LiveStreamMode;
    coverImage?: string;
    customEmbedUrl?: string;
    category?: string;
  }) => {
    const newStream: LiveStream = {
      id: `stream-${Date.now()}`,
      title: config.title,
      speaker: config.speaker,
      description: config.description,
      mode: config.mode,
      status: 'live',
      startedAt: new Date().toISOString(),
      viewerCount: 1,
      likesCount: 0,
      coverImage: config.coverImage || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80',
      customEmbedUrl: config.customEmbedUrl,
      category: config.category || 'लाइव प्रसारण',
    };

    setCurrentStream(newStream);
    setLiveComments([
      {
        id: `sys-${Date.now()}`,
        userName: 'प्रसारण सूचना',
        text: '🔴 व्यवस्थापक ने लाइव सत्र प्रारम्भ किया है। सभी श्रोताओं का हार्दिक स्वागत है।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isVIP: true,
      }
    ]);
  };

  const stopStream = () => {
    if (!currentStream) return;

    const endedStream: LiveStream = {
      ...currentStream,
      status: 'ended',
      endedAt: new Date().toISOString(),
    };

    setPastStreams(prev => [endedStream, ...prev]);
    setCurrentStream(null);
  };

  const updateStreamMode = (mode: LiveStreamMode) => {
    if (currentStream) {
      setCurrentStream({
        ...currentStream,
        mode,
      });
    }
  };

  const sendComment = (text: string, userName = 'साधक / श्रोता', isQuestion = false) => {
    if (!text.trim()) return;

    const newComment: LiveStreamComment = {
      id: `c-${Date.now()}`,
      userName,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isQuestion,
    };

    setLiveComments(prev => [...prev, newComment]);
  };

  const sendHeart = () => {
    if (currentStream) {
      setCurrentStream(prev => prev ? { ...prev, likesCount: prev.likesCount + 1 } : null);
    }

    const heartId = `h-${Date.now()}-${Math.random()}`;
    const xPos = Math.floor(Math.random() * 80) + 10; // 10% to 90% horizontal range
    setFloatingHearts(prev => [...prev, { id: heartId, x: xPos }]);

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 2000);
  };

  const pinComment = (commentId: string) => {
    setLiveComments(prev =>
      prev.map(c => ({
        ...c,
        isPinned: c.id === commentId ? !c.isPinned : false,
      }))
    );
  };

  const markQuestionAnswered = (commentId: string) => {
    setLiveComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, isAnswered: true } : c))
    );
  };

  const deleteComment = (commentId: string) => {
    setLiveComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <LiveStreamContext.Provider
      value={{
        currentStream,
        pastStreams,
        liveComments,
        isLive: !!currentStream && currentStream.status === 'live',
        streamMode: currentStream?.mode || 'video',
        viewerCount: currentStream?.viewerCount || 0,
        likesCount: currentStream?.likesCount || 0,
        startStream,
        stopStream,
        updateStreamMode,
        sendComment,
        sendHeart,
        pinComment,
        markQuestionAnswered,
        deleteComment,
        floatingHearts,
      }}
    >
      {children}
    </LiveStreamContext.Provider>
  );
};

export const useLiveStream = () => {
  const context = useContext(LiveStreamContext);
  if (!context) {
    throw new Error('useLiveStream must be used within a LiveStreamProvider');
  }
  return context;
};
