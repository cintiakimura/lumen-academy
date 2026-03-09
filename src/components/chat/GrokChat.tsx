import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../shared/ui/Button';
import { Mic, Send, PauseCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'coach' | 'learner';
  text: string;
}

export default function GrokChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'coach',
      text: "Hey João. Let's talk about brake pads. If the pad's worn down, what's the first thing you usually hear?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), role: 'learner', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'coach',
        text: "That's right, a squeal. Happens to everyone. Now, imagine you're under the hood. What's making that noise?"
      }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAFAFA] font-light text-gray-800">
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/learner')}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-50 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg text-gray-900 tracking-tight">Brake Pads: The Squeal</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="h-1 w-20 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 w-1/3"></div>
              </div>
              <span className="text-xs text-gray-400">In progress</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
          <PauseCircle className="h-5 w-5" />
          Pause
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'learner' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-6 py-4 text-base leading-relaxed ${
                  msg.role === 'coach' 
                    ? 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm' 
                    : 'bg-teal-600 text-white rounded-tr-sm'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 p-6 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex items-end gap-3 bg-gray-50/50 border border-gray-200 rounded-3xl p-2 focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-500 focus-within:bg-white transition-all shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[48px] py-3 px-4 text-base outline-none font-light"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Chat input"
            />
            
            <div className="flex items-center gap-2 shrink-0 pb-1 pr-1">
              {input.trim() ? (
                <button type="submit" className="h-12 w-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center hover:bg-teal-700 transition-colors" aria-label="Send message">
                  <Send className="h-5 w-5 ml-1" />
                </button>
              ) : (
                <button type="button" onClick={() => setIsRecording(!isRecording)} className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                    isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`} aria-label={isRecording ? "Stop recording" : "Start voice recording"}>
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">Take your time. No rush.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
