import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage } from '../types';
import { LEARNING_MODES } from '../constants';
import { streamChat } from '../services/chatService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ModeSelector from './chat/ModeSelector';

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
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isPreschool = user.type === 'PRESCHOOLER';
  const { speak, stop: stopSpeaking } = useSpeechSynthesis();
  const { isListening, transcript, startListening, stopListening, isSupported: micSupported } = useSpeechRecognition();

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

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend || isTyping) return;

    // Stop listening if active
    if (isListening) stopListening();
    setError(null);

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const apiMessages = [
      ...messages.map(m => ({
        role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      })),
      { role: 'user' as const, content: textToSend },
    ];

    let currentAiResponse = '';

    // Placeholder AI message
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
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeakMessage = (text: string) => {
    speak(text);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <ChatHeader
        subject={subject}
        selectedMode={selectedMode}
        onBack={() => { stopSpeaking(); onBack(); }}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isTyping={isTyping}
          isListening={isListening}
          onMicToggle={handleMicToggle}
          micSupported={micSupported}
          isPreschool={isPreschool}
        />
      )}
    </div>
  );
};

export default AIChat;
