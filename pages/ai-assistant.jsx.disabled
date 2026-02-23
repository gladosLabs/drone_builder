import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';

export default function AIAssistant() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedSpecs, setAiGeneratedSpecs] = useState(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    // Initialize with welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your AI drone assistant. I can help you design and optimize drones for any use case.

**What I can help you with:**
• **Frame Selection** - Choose the right frame for your needs (racing, cinematography, payload, etc.)
• **Motor & ESC Pairing** - Optimal performance combinations
• **Battery Recommendations** - Flight time and power requirements
• **Flight Controller Selection** - Features and compatibility
• **Cost Estimation** - Budget-friendly options
• **Performance Analysis** - Flight time, speed, payload capacity

**Try asking me:**
• "I want a racing drone for FPV that can fly for 10 minutes and costs under $500"
• "Build me a cinewhoop for indoor filming with good stability"
• "I need a heavy lift drone for carrying a 2kg payload"
• "What's the best setup for a beginner drone under $300?"

Just describe your needs and I'll provide detailed specifications and recommendations!`,
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-specs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputMessage,
          model: 'openai'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          specs: data.specs
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (data.specs) {
          setAiGeneratedSpecs(data.specs);
        }
      } else {
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error generating your drone specifications. Please try again.',
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating your drone specifications. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySpecs = (specs, prompt) => {
    // Store the AI-generated specs in localStorage for the playground to use
    localStorage.setItem('ai_generated_specs', JSON.stringify(specs));
    localStorage.setItem('ai_prompt', prompt);
    
    // Navigate to playground
    router.push('/playground');
  };

  const formatMessage = (content) => {
    // Convert markdown-like formatting to JSX
    const lines = content.split('\n');
    const formattedLines = [];
    let inJsonBlock = false;
    let jsonContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for JSON code block start/end
      if (line.includes('```json')) {
        if (!inJsonBlock) {
          inJsonBlock = true;
          jsonContent = [];
          continue;
        } else {
          inJsonBlock = false;
          // Don't render JSON blocks in the main content
          continue;
        }
      }

      if (inJsonBlock) {
        jsonContent.push(line);
        continue;
      }

      // Format regular content
      if (line.startsWith('🎯') || line.startsWith('🏗️') || line.startsWith('⚡') || 
          line.startsWith('🔋') || line.startsWith('🧠') || line.startsWith('🔄') || 
          line.startsWith('📊') || line.startsWith('💡')) {
        // Format section headers with emojis
        formattedLines.push(<h3 key={i} className="text-lg font-bold mt-4 mb-2 text-[#8b95c9]">{line}</h3>);
      } else if (line.startsWith('• ')) {
        formattedLines.push(<li key={i} className="ml-4">{formatInlineBold(line.slice(2))}</li>);
      } else if (line.startsWith('- ')) {
        formattedLines.push(<li key={i} className="ml-4">{formatInlineBold(line.slice(2))}</li>);
      } else if (line.match(/^\d+\./)) {
        // Numbered lists
        formattedLines.push(<li key={i} className="ml-4">{formatInlineBold(line)}</li>);
      } else if (line.trim() === '') {
        formattedLines.push(<br key={i} />);
      } else {
        formattedLines.push(<span key={i}>{formatInlineBold(line)}</span>);
      }
    }

    return formattedLines;
  };

  // Helper function to format inline bold text
  const formatInlineBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#84dcc6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#8b95c9] to-[#84dcc6] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-[#8b95c9] bg-clip-text text-transparent">
                    AI Drone Assistant
                  </h1>
                  <p className="text-sm text-gray-500">Expert drone design and optimization</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-[#84dcc6] rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-500">AI Online</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#8b95c9] to-[#84dcc6] text-white'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#84dcc6] to-[#73cbb5] rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                        {formatMessage(message.content)}
                      </div>
                      
                      {message.specs && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleApplySpecs(message.specs, messages.find(m => m.role === 'user' && m.id < message.id)?.content || '')}
                            className="px-4 py-2 bg-gradient-to-r from-[#8b95c9] to-[#7a84b8] text-white rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Apply to New Build</span>
                          </button>
                        </div>
                      )}
                      
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#84dcc6] to-[#73cbb5] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-[#84dcc6] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#84dcc6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#84dcc6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Describe your drone needs..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#84dcc6] focus:border-transparent transition-all duration-200"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isGenerating}
              />
              <button
                onClick={handleSendMessage}
                disabled={isGenerating || !inputMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#84dcc6] to-[#73cbb5] text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Enter to send • AI responses are generated using advanced language models
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 