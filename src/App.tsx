/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { Upload, Send, File, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { MouseEvent, KeyboardEvent, ChangeEvent } from "react";
import { GLSLHills } from "./components/GLSLHills";
import { GeometricMesh } from "./components/GeometricMesh";
import Markdown from "react-markdown";

interface Attachment {
  type: 'image' | 'file' | 'url';
  url: string;
  name?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isVisible]);

  const toggleHUD = () => {
    setIsVisible(!isVisible);
  };

  /**
   * BACKEND HOOK: Replace the logic inside this function to connect your AI model.
   * This function is called after the user sends a message.
   */
  const getAIResponse = async (userMsg: string, _attachments?: Attachment[]) => {
    setIsTyping(true);
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I received: "${userMsg}". \n\nYou can hook up your custom model here. I can handle [links](https://google.com), images, and files in my responses.`,
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleSend = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage("");
    
    // Trigger AI response hook
    getAIResponse(newMessage.content);
  };

  const handleUploadClick = (e: MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');
      
      const attachment: Attachment = {
        type: isImage ? 'image' : 'file',
        url: url,
        name: file.name
      };

      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `Attached ${isImage ? 'image' : 'file'}: ${file.name}`,
        attachments: [attachment]
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Trigger AI response hook (with attachment context)
      getAIResponse(newMessage.content, [attachment]);
    }
  };

  return (
    <div 
      className="min-h-screen bg-black flex items-center justify-center overflow-hidden selection:bg-white/20 cursor-pointer"
      onClick={toggleHUD}
    >
      {/* Layer 0: Hills */}
      <GLSLHills />

      {/* Layer 1: Geometric Mesh */}
      <GeometricMesh />

      {/* Background ambience (subtle) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Glass HUD - Now with Visibility Control */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="hud"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            dragElastic={0.1}
            dragMomentum={true}
            whileDrag={{ scale: 1.02, cursor: "grabbing" }}
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
            animate={{ 
              opacity: 1, 
              y: [0, -15, 0],
              scale: 1,
              filter: "blur(0px)"
            }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)", y: 20 }}
            transition={{ 
              opacity: { duration: 0.5 },
              y: { 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              },
              scale: { duration: 0.4 },
              filter: { duration: 0.4 }
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the HUD
            className="relative z-20 w-[500px] h-[520px] rounded-2xl border border-white/30 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.5),0_0_12px_rgba(255,255,255,0.3)] flex flex-col p-8 overflow-hidden cursor-grab active:cursor-grabbing"
          >
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20 rounded-br-2xl" />

            {/* Content Area - Chat History */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4 scrollbar-hide custom-scrollbar"
              style={{
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              {messages.length === 0 && !isTyping && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-white/10 text-xs tracking-widest uppercase font-display">System Ready</div>
                </div>
              )}
              
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm font-sans leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-white/10 text-white/90 border border-white/10' 
                      : 'bg-black/20 text-white/70 border border-white/5'
                  }`}>
                    {msg.attachments && msg.attachments.map((att, i) => (
                      <div key={i} className="mb-2">
                        {att.type === 'image' ? (
                          <img 
                            src={att.url} 
                            alt={att.name} 
                            referrerPolicy="no-referrer"
                            className="rounded-lg max-w-full h-auto max-h-40 object-cover border border-white/10 shadow-lg" 
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                            <File className="w-4 h-4 text-white/40" />
                            <span className="text-xs truncate max-w-[150px]">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="markdown-body">
                      <Markdown components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                          {props.children} <ExternalLink className="w-3 h-3" />
                        </a>,
                        img: ({node, ...props}) => <img {...props} className="rounded-lg border border-white/10 my-2 max-w-full" referrerPolicy="no-referrer" />
                      }}>
                        {msg.content}
                      </Markdown>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-1 p-2"
                >
                  <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </motion.div>
              )}
            </div>

            {/* Message Bar Container */}
            <div className="mt-auto relative group">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/20 backdrop-blur-2xl transition-all duration-300 group-focus-within:border-white/40 group-focus-within:bg-white/10">
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />

                <motion.button
                  onClick={handleUploadClick}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  title="Upload"
                  className="p-3 rounded-lg text-white/50 hover:text-white transition-colors"
                >
                  <Upload className="w-5 h-5" />
                </motion.button>
                
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder=""
                  className="flex-1 bg-transparent border-none outline-none text-white font-sans text-sm px-2"
                />

                <motion.button
                  onClick={handleSend}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  whileTap={{ scale: 0.9 }}
                  title="Send"
                  className="p-3 rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aesthetic Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-30" />
    </div>
  );
}


