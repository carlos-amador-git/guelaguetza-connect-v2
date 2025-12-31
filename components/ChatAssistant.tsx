import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/api';
import { sendMessageToGemini } from '../services/geminiService';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! Soy GuelaBot 🤖. Pregúntame sobre rutas de transporte, horarios o la historia de las danzas.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [useBackend, setUseBackend] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      let responseText: string;

      if (useBackend) {
        // Try backend API first
        try {
          const result = await sendChatMessage(userMsg.text, conversationId);
          responseText = result.response;
          setConversationId(result.conversationId);
        } catch {
          // Fallback to direct Gemini if backend fails
          setUseBackend(false);
          const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }));
          responseText = await sendMessageToGemini(userMsg.text, history) || '';
        }
      } else {
        // Direct Gemini call
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));
        responseText = await sendMessageToGemini(userMsg.text, history) || '';
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Disculpa, no entendí bien. ¿Puedes repetir?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-20">
      {/* Header */}
      <div className="bg-oaxaca-purple p-4 text-white shadow-md flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
           <Sparkles size={20} className="text-oaxaca-yellow" />
        </div>
        <div>
          <h2 className="font-bold">Asistente Cultural</h2>
          <p className="text-xs text-white/80">Impulsado por Gemini AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-gray-200' : 'bg-oaxaca-pink'}`}>
                  {isUser ? <User size={16} className="text-gray-600" /> : <Bot size={16} className="text-white" />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white px-4 py-2 rounded-full shadow-sm text-xs text-gray-500 animate-pulse">
                GuelaBot está escribiendo...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre rutas o historia..."
            className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-oaxaca-pink outline-none transition"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="bg-oaxaca-pink text-white p-3 rounded-full hover:bg-pink-700 disabled:opacity-50 transition shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
