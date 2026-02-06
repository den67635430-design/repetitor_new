import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage } from '../types';
import { LEARNING_MODES } from '../constants';
import { streamChat } from '../services/chatService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useChatHistory, ChatSession } from '../hooks/useChatHistory';
import { supabase } from '@/integrations/supabase/client';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ModeSelector from './chat/ModeSelector';
import ChatHistory from './chat/ChatHistory';

interface Props {
  user: UserProfile;
  subject: string;
  mode: string;
  onBack: () => void;
}

const AIChat: React.FC<Props> = ({ user, subject, mode, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [showModes, setShowModes] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isPreschool = user.type === 'PRESCHOOLER';
  const { speak, stop: stopSpeaking } = useSpeechSynthesis();
  const { isListening, transcript, startListening, stopListening, isSupported: micSupported } = useSpeechRecognition();
  const {
    sessions, loading: historyLoading, searchQuery, setSearchQuery,
    fetchSessions, searchSessions, createSession, saveMessage, loadSessionMessages,
  } = useChatHistory(user.id);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Sync voice transcript to input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file);
    if (error) return null;
    // Use signed URL for private bucket (1 hour expiry)
    const { data: urlData } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(path, 3600);
    return urlData?.signedUrl || null;
  };

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend && !attachedImage) return;
    if (isTyping) return;

    if (isListening) stopListening();
    setError(null);

    // Upload image if attached
    let imageUrl: string | undefined;
    if (attachedImage) {
      imageUrl = (await uploadImage(attachedImage.file)) || undefined;
      setAttachedImage(null);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend || (imageUrl ? '📎 Изображение' : ''),
      timestamp: new Date().toISOString(),
      imageUrl,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Create session if needed
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createSession(subject, selectedMode);
      setCurrentSessionId(sessionId);
    }

    // Save user message
    if (sessionId) {
      await saveMessage(sessionId, userMessage, imageUrl);
    }

    const apiMessages = [
      ...messages.map(m => ({
        role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      })),
      { role: 'user' as const, content: textToSend || 'Посмотри на прикреплённое изображение' },
    ];

    let currentAiResponse = '';

    setMessages(prev => [...prev, { role: 'model', text: '', timestamp: new Date().toISOString() }]);

    await streamChat({
      messages: apiMessages,
      userType: user.type,
      subject,
      mode: selectedMode,
      classLevel: user.classLevel,
      onDelta: (chunk) => {
        currentAiResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            text: currentAiResponse,
          };
          return newMessages;
        });
      },
      onDone: () => {
        setIsTyping(false);
        // Auto-speak for preschoolers
        if (isPreschool && currentAiResponse) {
          speak(currentAiResponse);
        }
        // Save AI message
        if (sessionId && currentAiResponse) {
          const aiMsg: ChatMessage = { role: 'model', text: currentAiResponse, timestamp: new Date().toISOString() };
          saveMessage(sessionId, aiMsg);
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setIsTyping(false);
        if (!currentAiResponse) {
          setMessages(prev => prev.slice(0, -1));
        }
      },
    });
  };

  const startWithMode = (mId: string) => {
    setSelectedMode(mId);
    setShowModes(false);

    const modeName = LEARNING_MODES.find(m => m.id === mId)?.name;
    const initialPrompt = isPreschool
      ? `Привет! Давай заниматься в режиме "${modeName}"!`
      : `Привет! Я хочу изучить тему в режиме "${modeName}". С чего начнем?`;
    setInput(initialPrompt);
  };

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSpeakMessage = (text: string) => {
    speak(text);
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Можно прикрепить только изображения');
      return;
    }
    const preview = URL.createObjectURL(file);
    setAttachedImage({ file, preview });
    e.target.value = '';
  };

  const handleShowHistory = () => {
    fetchSessions();
    setShowHistory(true);
  };

  const handleSelectSession = async (session: ChatSession) => {
    const msgs = await loadSessionMessages(session.id);
    setMessages(msgs);
    setCurrentSessionId(session.id);
    setSelectedMode(session.mode);
    setShowModes(false);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setShowModes(true);
    setShowHistory(false);
  };

  if (showHistory) {
    return (
      <ChatHistory
        sessions={sessions}
        loading={historyLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={searchSessions}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <ChatHeader
        subject={subject}
        selectedMode={selectedMode}
        onBack={() => { stopSpeaking(); onBack(); }}
        onShowHistory={handleShowHistory}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {showModes && (
          <ModeSelector onSelect={startWithMode} />
        )}

        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          error={error}
          isPreschool={isPreschool}
          onSpeakMessage={handleSpeakMessage}
        />
      </div>

      {!showModes && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            isTyping={isTyping}
            isListening={isListening}
            onMicToggle={handleMicToggle}
            micSupported={micSupported}
            isPreschool={isPreschool}
            onAttachFile={handleAttachFile}
            attachedImage={attachedImage}
            onRemoveAttachment={() => {
              if (attachedImage) {
                URL.revokeObjectURL(attachedImage.preview);
                setAttachedImage(null);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default AIChat;
