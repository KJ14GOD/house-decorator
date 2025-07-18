'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';

// Color scheme
const PINK_GRADIENT = 'radial-gradient(circle at 50% 60%, #fce4ec 0%, #fff 100%)';
const YELLOW = '#facc14';
const MAIN_BG = '#fff';
const MAIN_TEXT = '#000';
const SECONDARY_TEXT = '#444';
const ACCENT_ORANGE = 'rgba(255, 69, 0, 0.8)';
const ACCENT_RED = 'rgba(239, 68, 68, 0.6)';
const ACCENT_PINK = '#fda4af'; // Soft pink for branding/icons

// UI color constants
const CHAT_BG = '#f7f7f8';
const INPUT_BG = '#fff';
const TOOLS_BG = '#fff';
const TOOLS_BORDER = '#e5e7eb';
const TOOLS_ACTIVE = '#18181b';
const TOOLS_ACTIVE_TEXT = '#fff';
const TOOLS_TEXT = '#18181b';
const TOOLS_HOVER = '#f3f4f6';

const DARK_BG = '#18181b';
const INPUT_DARK = '#23272f';
const INPUT_BORDER = '#23272f';
const INPUT_TEXT = '#f3f4f6';
const ACCENT_YELLOW = '#facc14';

// Add a Card component for source links
function SourceCard({ url, title, domain, image }: { url: string, title: string, domain: string, image?: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      background: '#23272f',
      borderRadius: 12,
      boxShadow: '0 2px 8px #18181b44',
      border: '1px solid #2d2f36',
      padding: 16,
      minWidth: 280,
      maxWidth: 360,
      margin: 8,
      textDecoration: 'none',
      color: '#f3f4f6',
      transition: 'box-shadow 0.18s, transform 0.18s',
      cursor: 'pointer',
    }}
    onMouseOver={e => {
      e.currentTarget.style.boxShadow = '0 4px 16px #18181b66';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseOut={e => {
      e.currentTarget.style.boxShadow = '0 2px 8px #18181b44';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <div style={{ 
        width: '100%', 
        height: 140, 
        marginBottom: 12, 
        borderRadius: 8, 
        background: '#18181b', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden',
        border: '1px solid #2d2f36'
      }}>
        {image ? (
          <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, color: '#facc14' }}>🔗</span>
            <span style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>{domain}</span>
          </div>
        )}
      </div>
      <div style={{ 
        fontWeight: 700, 
        fontSize: 15, 
        marginBottom: 6, 
        color: '#facc14', 
        textOverflow: 'ellipsis', 
        overflow: 'hidden', 
        whiteSpace: 'nowrap', 
        width: '100%',
        lineHeight: 1.3
      }}>
        {title || domain}
      </div>
      <div style={{ fontSize: 13, color: '#a3e635', marginBottom: 4 }}>{domain}</div>
      <div style={{ 
        fontSize: 12, 
        color: '#bdbdbd', 
        marginTop: 2, 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap', 
        width: '100%',
        opacity: 0.8
      }}>
        {url}
      </div>
    </a>
  );
}

// Helper to extract domain from URL
function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Helper to remove emojis from text
function removeEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
}

// Helper to extract title from URL or use domain as fallback
function getTitleFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    // Convert domain to title case
    return domain.split('.').slice(0, -1).join('.').replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return getDomain(url);
  }
}

// Helper to parse and render Deep Research content
function renderDeepResearch(content: string) {
  // Remove emojis from content
  const cleanContent = removeEmojis(content);
  
  // Extract URLs from the content
  const urlRegex = /(https?:\/\/[^\s)\]]+)/g;
  const urls = Array.from(new Set(cleanContent.match(urlRegex) || []));
  
  // Parse the content into sections
  const lines = cleanContent.split('\n');
  let sections: { title: string, body: string[], urls: string[] }[] = [];
  let current: { title: string, body: string[], urls: string[] } | null = null;
  
  for (let line of lines) {
    // Check if line is a header
    if (line.match(/^#+ /)) {
      if (current) sections.push(current);
      const title = line.replace(/^#+ /, '').trim();
      current = { title, body: [], urls: [] };
    } else if (current) {
      current.body.push(line);
      // Extract URLs from this line
      const found = line.match(urlRegex);
      if (found) current.urls.push(...found);
    }
  }
  if (current) sections.push(current);

  // Render
  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif', 
      color: '#f3f4f6', 
      fontSize: 16, 
      lineHeight: 1.7,
      width: '100%'
    }}>
      {sections.map((sec, i) => (
        <div key={i} style={{ marginBottom: 32 }}>
          <div style={{ 
            fontWeight: 800, 
            fontSize: 22, 
            color: '#facc14', 
            marginBottom: 12,
            borderBottom: '1px solid #2d2f36',
            paddingBottom: 8
          }}>
            {sec.title}
          </div>
          <div style={{ whiteSpace: 'pre-line', marginBottom: 16 }}>
            {sec.body.map((b, j) => {
              // Skip empty lines
              if (!b.trim()) return null;
              
              // Render lists
              if (b.trim().startsWith('- ') || b.trim().startsWith('* ')) {
                return (
                  <li key={j} style={{ 
                    marginLeft: 24, 
                    marginBottom: 4,
                    listStyle: 'none',
                    position: 'relative'
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: -16, 
                      color: '#facc14',
                      fontWeight: 700
                    }}>•</span>
                    {b.replace(/^[-*] /, '')}
                  </li>
                );
              }
              // Render numbered lists
              if (b.trim().match(/^\d+\. /)) {
                return (
                  <li key={j} style={{ 
                    marginLeft: 24, 
                    marginBottom: 4,
                    listStyle: 'none',
                    position: 'relative'
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: -16, 
                      color: '#facc14',
                      fontWeight: 700
                    }}>{b.match(/^\d+\./)?.[0]}</span>
                    {b.replace(/^\d+\. /, '')}
                  </li>
                );
              }
              // Render bold
              if (b.trim().startsWith('**') && b.trim().endsWith('**')) {
                return (
                  <div key={j} style={{ 
                    fontWeight: 700, 
                    color: '#fff', 
                    margin: '12px 0 8px 0',
                    fontSize: 18
                  }}>
                    {b.replace(/\*\*/g, '')}
                  </div>
                );
              }
              // Render normal text
              return <div key={j} style={{ marginBottom: 8 }}>{b}</div>;
            })}
          </div>
          
          {/* Render source cards if this section has URLs */}
          {sec.urls.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 12, 
              marginTop: 16,
              padding: '16px 0',
              borderTop: '1px solid #2d2f36'
            }}>
              {sec.urls.map((url, idx) => (
                <SourceCard 
                  key={url} 
                  url={url} 
                  title={getTitleFromUrl(url)} 
                  domain={getDomain(url)} 
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [useLangGraph, setUseLangGraph] = useState(false);
  const [researchProgress, setResearchProgress] = useState<string>('');
  const [researchStartTime, setResearchStartTime] = useState<number | null>(null);
  const [researchElapsedTime, setResearchElapsedTime] = useState<number>(0);
  const [liveTimer, setLiveTimer] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sidebar/chat session state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState<Array<{ id: string; title: string; snippet: string; timestamp: string }>>([]);
  const [selectedChat, setSelectedChat] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  // Plus button menu state for empty state
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  // Search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Add this state to manage messages per chat
  const [chatMessages, setChatMessages] = useState<{ [chatId: string]: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }> }>({});

  // Deep Research progress state
  const [progressTimer, setProgressTimer] = useState(0);
  const [progressStepIndex, setProgressStepIndex] = useState(0);
  const progressSteps = [
    'Gathering sources...',
    'Analyzing information...',
    'Synthesizing insights...',
    'Finalizing response...'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const chatId = typeof selectedChat === 'string' ? selectedChat : '';
    scrollToBottom();
  }, [typeof selectedChat === 'string' ? chatMessages[selectedChat] : undefined]);

  // Live timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (researchStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.round((Date.now() - researchStartTime) / 1000);
        setLiveTimer(elapsed);
      }, 1000);
    } else {
      setLiveTimer(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [researchStartTime]);

  // Deep Research progress effect
  useEffect(() => {
    let timerInt: NodeJS.Timeout | null = null;
    let stepInt: NodeJS.Timeout | null = null;
    if (deepResearchMode && useLangGraph && isLoading) {
      setProgressTimer(0);
      setProgressStepIndex(0);
      timerInt = setInterval(() => setProgressTimer(t => t + 1), 1000);
      stepInt = setInterval(() => setProgressStepIndex(i => (i < progressSteps.length - 1 ? i + 1 : i)), 1500);
    } else {
      setProgressStepIndex(0);
      setProgressTimer(0);
    }
    return () => {
      if (timerInt) clearInterval(timerInt);
      if (stepInt) clearInterval(stepInt);
    };
  }, [deepResearchMode, useLangGraph, isLoading]);

  // Add chat if none exists when sending a message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    let newChatId = selectedChat;
    let updatedChats = chats;
    let isNewChat = false;
    // If no chat selected, create a new chat
    if (!selectedChat) {
      const now = new Date();
      newChatId = now.getTime().toString();
      const newChat = {
        id: newChatId,
        title: userMessage.slice(0, 32),
        snippet: userMessage.slice(0, 64),
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setSelectedChat(newChatId);
      isNewChat = true;
    } else {
      // Update snippet for existing chat
      updatedChats = chats.map(chat =>
        chat.id === selectedChat ? { ...chat, snippet: userMessage.slice(0, 64) } : chat
      );
      setChats(updatedChats);
    }

    // Add user message to the correct chat
    const currentChatId = newChatId!;
    const prevMessages = chatMessages[currentChatId] || [];
    const newMessages = [...prevMessages, {
      role: 'user' as const,
      content: userMessage,
      timestamp: Date.now()
    }];
    setChatMessages({ ...chatMessages, [currentChatId]: newMessages });

    try {
      let aiResponse;
      if (deepResearchMode) {
        setResearchProgress('🤔 Thinking...');
        setResearchStartTime(Date.now());
        setResearchElapsedTime(0);
        setLiveTimer(0);
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            messages: newMessages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
            useLangGraph: useLangGraph,
          }),
        });
        if (!response.body) throw new Error('No response body');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  setResearchProgress('');
                  break;
                }
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'progress') {
                    setResearchProgress(parsed.step);
                  } else if (parsed.type === 'result') {
                    result = parsed.content;
                    setResearchProgress('');
                    if (researchStartTime) {
                      const totalTime = Math.round((Date.now() - researchStartTime) / 1000);
                      setResearchElapsedTime(totalTime);
                      setResearchStartTime(null);
                      setLiveTimer(0);
                    }
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.message);
                  }
                } catch (e) {}
              }
            }
          }
        } finally {
          reader.releaseLock();
          setResearchProgress('');
        }
        aiResponse = result;
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userMessage,
            roomState: {},
            messages: newMessages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
            agentSystem: {
              selectedAgent: 'design-specialist',
              agentName: 'Design Assistant',
              agentEmoji: '🎨',
              systemPrompt: 'You are a helpful interior design assistant.',
              specialties: ['general design advice', 'color theory', 'space planning'],
              confidence: 0.9,
              context: {},
              activeAgents: []
            }
          }),
        });
        aiResponse = await response.text();
      }
      const updatedMessages = [...newMessages, {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: Date.now()
      }];
      setChatMessages({ ...chatMessages, [currentChatId]: updatedMessages });
      // Update chat snippet with assistant response
      if (currentChatId) {
        setChats(prevChats => {
          const updated = prevChats.map(chat =>
            chat.id === currentChatId ? { ...chat, snippet: aiResponse.slice(0, 64) } : chat
          );
          // Move the active chat to the top
          const active = updated.find(chat => chat.id === currentChatId);
          const rest = updated.filter(chat => chat.id !== currentChatId);
          return active ? [active, ...rest] : updated;
        });
      }
    } catch (error) {
      const updatedMessages = [...newMessages, {
        role: 'assistant' as const,
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      }];
      setChatMessages({ ...chatMessages, [currentChatId]: updatedMessages });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Sidebar chat selection
  const handleSelectChat = (id: string) => {
    setSelectedChat(id);
    setInputMessage("");
  };

  // Sidebar new chat
  const handleNewChat = () => {
    setSelectedChat(undefined);
    setInputMessage("");
    setDeepResearchMode(false);
    setUseLangGraph(false);
    setPlusMenuOpen(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Types for source cards
  interface Source {
    id: number;
    url: string;
    domain: string;
    title: string;
    snippet: string;
  }

  interface ParsedSection {
    title: string;
    body: string;
    level: number;
  }

  // Function to extract and render sources as cards
  const extractSources = (content: string): Source[] => {
    const sources: Source[] = [];
    
    // AGGRESSIVE URL extraction - capture EVERYTHING from console logs
    const urlPatterns = [
      // Standard URLs (most comprehensive)
      /https?:\/\/[^\s\)\]\}\n\r"'<>]+/g,
      // URLs after "preview:" or similar console patterns
      /(?:preview|First result preview|Source):\s*([^\s\n]+(?:\.com|\.org|\.net|\.edu|\.gov)[^\s\n]*)/g,
      // Domain patterns in console logs
      /(?:Domain|domain):\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s\n]*)?)/g,
      // Reddit links specifically
      /reddit\.com\/[^\s\)\]\}\n\r"'<>]*/g,
      // Amazon links specifically  
      /amazon\.com\/[^\s\)\]\}\n\r"'<>]*/g,
      // YouTube links
      /youtube\.com\/[^\s\)\]\}\n\r"'<>]*/g,
      // Any .com/.org/.net domains with paths
      /[a-zA-Z0-9.-]+\.(com|org|net|edu|gov)\/[^\s\)\]\}\n\r"'<>]*/g,
    ];
    
    const allMatches = new Set<string>();
    
    // Extract all URLs using different patterns
    urlPatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        let cleanUrl = match[1] || match[0]; // Use capture group if available
        
        // Clean and normalize URL
        cleanUrl = cleanUrl.replace(/[,\.\!\?\)\]\}]+$/, ''); // Remove trailing punctuation
        cleanUrl = cleanUrl.replace(/^\s+|\s+$/g, ''); // Trim whitespace
        
        if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('//')) {
          cleanUrl = 'https://' + cleanUrl.replace(/^www\./, '');
        }
        
        // Only add if it looks like a valid URL
        if (cleanUrl.includes('.') && cleanUrl.length > 8) {
          allMatches.add(cleanUrl);
        }
      });
    });
    
         // Extract from ACTUAL console patterns I see in your logs
     const consolePatterns = [
       { pattern: /📊\s+Query:\s*"([^"]+)"/g, type: 'query' },
       { pattern: /🔍\s+Search\s+\d+:\s*"([^"]+)"/g, type: 'query' },
       { pattern: /Researching:\s*([^\n]+)/g, type: 'query' },
       { pattern: /🔍\s+Executing Tavily search for:\s*([^\n]+)/g, type: 'query' },
       { pattern: /📝\s+First result preview:\s*([^\n]+)/g, type: 'preview' },
       { pattern: /📄\s+Content preview:\s*([^\n]+)/g, type: 'preview' },
       { pattern: /🌐\s+Domain:\s*([^\s\n]+)/g, type: 'domain' },
       { pattern: /📊\s+Title:\s*([^\n]+)/g, type: 'title' },
       { pattern: /🎯\s+Source:\s*([^\n]+)/g, type: 'source' },
       // Extract specific URLs from console logs
       { pattern: /First result preview:\s*([^-]+)\s*-\s*(https?:\/\/[^\s]+)/g, type: 'url_with_title' },
     ];
     
     const consoleData: Array<{query?: string, preview?: string, domain?: string, title?: string}> = [];
     
     consolePatterns.forEach(({ pattern, type }) => {
       let match;
       while ((match = pattern.exec(content)) !== null) {
         const value = match[1];
         if (type === 'query') {
           consoleData.push({query: value});
         } else if (type === 'preview') {
           consoleData.push({preview: value});
         } else if (type === 'domain') {
           consoleData.push({domain: value});
         } else if (type === 'title') {
           consoleData.push({title: value});
         } else if (type === 'url_with_title') {
           // Special handling for "Title - URL" format
           const title = match[1]?.trim();
           const url = match[2]?.trim();
           if (title && url) {
             allMatches.add(url);
             consoleData.push({title, preview: title});
           }
         }
       }
     });
    
    // Convert URLs to source objects
    Array.from(allMatches).forEach((url, index) => {
      // Extract domain for display
      const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      
      // Try to extract context around the URL
      const urlIndex = content.indexOf(url);
      const beforeText = content.substring(Math.max(0, urlIndex - 200), urlIndex);
      const afterText = content.substring(urlIndex + url.length, urlIndex + url.length + 200);
      
      // Extract title from surrounding context or console data
      let title = domain;
      let snippet = '';
      
             // Look for console data patterns around this URL
       const contextText = beforeText + afterText;
       
       // Try to extract title from "First result preview: Title - URL" pattern
       const previewMatch = content.match(new RegExp(`First result preview:\\s*([^-]+)\\s*-\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
       if (previewMatch && previewMatch[1]) {
         title = previewMatch[1].trim().substring(0, 80);
       } else {
         // Fallback title extraction
         const titleMatches = [
           contextText.match(/📊\s+Title:\s*([^\n]+)/),
           contextText.match(/📝\s+First result preview:\s*([^\n]+)/),
           contextText.match(/📄\s+Content preview:\s*([^\n]+)/),
           beforeText.match(/([A-Z][^\.!?\n]*[^\n]*)/),
           afterText.match(/^([^\.!?\n]*)/),
         ];
         
         for (const match of titleMatches) {
           if (match && match[1] && match[1].trim().length > 3) {
             title = match[1].trim().substring(0, 80);
             break;
           }
         }
       }
      
             // Extract snippet from console output or surrounding text
       const snippetMatches = [
         content.match(new RegExp(`${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\n]*\n\\s*📄\\s+Content preview:\\s*([^\n]+)`)),
         contextText.match(/📄\s+Content preview:\s*([^\n]+)/),
         contextText.match(/📝\s+First result preview:\s*([^\n]+)/),
         contextText.match(/🎯\s+Content:\s*([^\n]+)/),
       ];
       
       for (const match of snippetMatches) {
         if (match && match[1] && match[1].trim().length > 10) {
           snippet = match[1].trim().substring(0, 150) + '...';
           break;
         }
       }
       
       // Fallback to surrounding text if no console snippet found
       if (!snippet) {
         const surroundingText = (beforeText + afterText).trim();
         if (surroundingText.length > 20) {
           snippet = surroundingText.substring(0, 150) + '...';
         }
       }
      
      if (!snippet) {
        snippet = `Research source from ${domain}`;
      }
      
      sources.push({
        id: index,
        url,
        domain,
        title: title || domain,
        snippet
      });
    });
    
    // Add console trace data as "sources" even if no URL
    consoleData.forEach((data, index) => {
      if (data.query && data.query.length > 0 && !sources.find(s => s.snippet.includes(data.query!))) {
        sources.push({
          id: sources.length + index,
          url: '#',
          domain: 'Search Query',
          title: data.query,
          snippet: `Research query executed: "${data.query}"`
        });
      }
    });
    
    // Remove duplicates and return all sources (no limit)
    const uniqueSources = sources.filter((source, index, self) => 
      index === self.findIndex(s => s.url === source.url || (s.title === source.title && s.domain === source.domain))
    );
    
    return uniqueSources;
  };

  // Function to parse and structure research content
  const parseResearchContent = (content: string): { sections: ParsedSection[], sources: Source[] } => {
    const sources = extractSources(content);
    
    // Split content into sections
    const sections = content.split(/(?=##\s)|(?=###\s)/).filter(s => s.trim());
    
    const parsedSections: ParsedSection[] = sections.map(section => {
      const lines = section.split('\n').filter(l => l.trim());
      const title = lines[0]?.replace(/^#+\s*/, '').trim() || '';
      const body = lines.slice(1).join('\n').trim();
      
      return { title, body, level: (section.match(/^#+/) || [''])[0].length };
    });

    return { sections: parsedSections, sources };
  };

  // Modern Perplexity-style renderer
  const renderModernResponse = (content: string) => {
    const { sections, sources } = parseResearchContent(content);
    
    const isComprehensiveReport = content.includes('Deep Research Report') || 
                                  content.includes('Executive Summary') ||
                                  sources.length > 3;

    if (!isComprehensiveReport) {
      return <div style={{ 
        whiteSpace: 'pre-wrap', 
        lineHeight: 1.6,
        color: '#1f2937',
        fontSize: '15px'
      }}>{content}</div>;
    }

    return (
      <div style={{
        maxWidth: '100%',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        {/* Research Timer */}
        {researchElapsedTime > 0 && (
          <div style={{
            marginBottom: '24px',
            padding: '12px 16px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#0c4a6e' }}>⏱️</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#0c4a6e' }}>
              Deep Research completed in {researchElapsedTime} seconds
            </span>
          </div>
        )}

        {/* Sources Section */}
        {sources.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#374151',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔗 Sources & Research Trace
              <span style={{
                fontSize: '12px',
                fontWeight: 'normal',
                color: '#6b7280',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                {sources.length} found
              </span>
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {sources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => source.url !== '#' && window.open(source.url, '_blank')}
                  style={{
                    display: 'block',
                    padding: '20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.3s ease',
                    cursor: source.url !== '#' ? 'pointer' : 'default',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    opacity: source.url === '#' ? 0.9 : 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (source.url !== '#') {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.2)';
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (source.url !== '#') {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}>
                      {source.url === '#' ? '🔍' : source.domain.includes('reddit') ? '💬' : source.domain.includes('youtube') ? '📺' : source.domain.includes('amazon') ? '🛒' : '🔗'}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      {source.domain}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '6px',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {source.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {source.snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {sections.map((section, index) => {
            if (!section.title && !section.body) return null;
            
            const isMainTitle = section.level === 1;
            const isSubHeader = section.level === 2;
            const isSubSection = section.level === 3;

            return (
              <div key={index} style={{
                padding: isMainTitle ? '24px 32px' : '20px 32px',
                borderBottom: index < sections.length - 1 ? '1px solid #f3f4f6' : 'none',
                backgroundColor: isMainTitle ? '#f8fafc' : '#ffffff'
              }}>
                {section.title && (
                  <h2 style={{
                    fontSize: isMainTitle ? '24px' : isSubHeader ? '18px' : '16px',
                    fontWeight: isMainTitle ? '700' : '600',
                    color: '#111827',
                    margin: '0 0 16px 0',
                    lineHeight: '1.3'
                  }}>
                    {section.title}
                  </h2>
                )}
                
                {section.body && (
                  <div style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#374151'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: section.body
                      // Format bold text
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #111827;">$1</strong>')
                      // Format links
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: 500;">$1</a>')
                      // Format bullet points
                      .replace(/^[\-\*\+]\s+(.+)$/gm, '<div style="display: flex; align-items: flex-start; margin: 8px 0;"><span style="color: #6b7280; margin-right: 8px; margin-top: 2px;">•</span><span>$1</span></div>')
                      // Format numbered lists
                      .replace(/^\d+\.\s+(.+)$/gm, '<div style="display: flex; align-items: flex-start; margin: 8px 0;"><span style="color: #6b7280; margin-right: 8px; margin-top: 2px; font-weight: 500;">$&</span></div>')
                      // Convert line breaks
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n/g, '<br/>')
                  }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Function to render card-based responses
  const renderCardResponse = (content: string) => {
    // Always use the modern renderer for research content
    if (content.includes('🔍') || content.includes('Research') || content.includes('##') || content.includes('http')) {
      return renderModernResponse(content);
    }
    
    // Simple text for basic responses
    return <div style={{ 
      whiteSpace: 'pre-wrap', 
      lineHeight: 1.6,
      color: '#1f2937',
      fontSize: '15px'
    }}>{content}</div>;
  };

  // For rendering messages, use:
  const chatId = typeof selectedChat === 'string' ? selectedChat : '';
  const messages = chatId ? chatMessages[chatId] || [] : [];

  // Filter chats for the search bar
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(search.toLowerCase()) ||
    chat.snippet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 80%, 100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .message-container {
          animation: fadeIn 0.3s ease-out;
        }
        .user-message {
          animation: slideIn 0.3s ease-out;
        }
        .assistant-message {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#18181b', fontFamily: 'Inter, sans-serif' }}>
        <Sidebar
          chats={chats}
          selectedChat={selectedChat ?? null}
          onSelectChat={handleSelectChat}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onNewChat={handleNewChat}
          search={search}
          setSearch={setSearch}
          onSearchClick={() => {
            setSearchModalOpen(true);
            setModalSearch('');
          }}
          accentColor={ACCENT_YELLOW}
          mainTextColor={MAIN_TEXT}
          secondaryTextColor={SECONDARY_TEXT}
          backgroundColor={DARK_BG}
          accentOrange={ACCENT_ORANGE}
          accentRed={ACCENT_RED}
          accentPink={ACCENT_PINK}
        />
        <div style={{ flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: '#18181b' }}>
          {/* Top bar with profile avatar/menu */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '24px 40px 0 0', minHeight: 48 }}>
            {!loading && user && (
              <ProfileMenu user={user} />
            )}
          </div>
          {/* Centered header and sticky-style input, moved up a bit */}
          {messages.length === 0 ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flex: 1, minHeight: '60vh', marginTop: 240, background: '#18181b' }}>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 38, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.15, marginBottom: 32 }}>
                {deepResearchMode && useLangGraph
                  ? 'Your Deep Research Agent'
                  : deepResearchMode && !useLangGraph
                    ? 'Your Research Agent'
                    : 'Your Design Assistant'}
              </h1>
              <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
                <ChatInputBar
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleSubmit={handleSubmit}
                  handleKeyPress={handleKeyPress}
                  isLoading={isLoading}
                  deepResearchMode={deepResearchMode}
                  plusMenuOpen={plusMenuOpen}
                  setPlusMenuOpen={setPlusMenuOpen}
                  setDeepResearchMode={setDeepResearchMode}
                  setUseLangGraph={setUseLangGraph}
                  useLangGraph={useLangGraph}
                  isSticky={messages.length > 0}
                />
              </div>
            </div>
          ) : (
            <div style={{ position: 'fixed', left: 300, right: 0, bottom: 32, display: 'flex', justifyContent: 'center', zIndex: 200, pointerEvents: 'none', background: 'transparent' }}>
              <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', pointerEvents: 'auto', background: 'transparent' }}>
                <ChatInputBar
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleSubmit={handleSubmit}
                  handleKeyPress={handleKeyPress}
                  isLoading={isLoading}
                  deepResearchMode={deepResearchMode}
                  plusMenuOpen={plusMenuOpen}
                  setPlusMenuOpen={setPlusMenuOpen}
                  setDeepResearchMode={setDeepResearchMode}
                  setUseLangGraph={setUseLangGraph}
                  useLangGraph={useLangGraph}
                  isSticky={messages.length > 0}
                />
              </div>
            </div>
          )}
          {/* Main chat area when there are messages */}
          {messages.length > 0 && (
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: messages.length > 0 ? 120 : 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#18181b' }}>
              <div style={{ 
                width: '100%', 
                maxWidth: (deepResearchMode && useLangGraph) ? 1000 : 700, 
                margin: '0 auto' 
              }}>
                {messages.map((message, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    margin: '16px 0',
                  }}>
                    <div style={{
                      maxWidth: (deepResearchMode && useLangGraph && message.role === 'assistant') ? '100%' : '70%',
                      background: message.role === 'user' ? '#23272f' : 'transparent',
                      color: message.role === 'user' ? '#fff' : '#f3f4f6',
                      borderRadius: message.role === 'user' ? 18 : 0,
                      padding: message.role === 'user' ? '12px 18px' : '0',
                      fontSize: 16,
                      lineHeight: 1.6,
                      boxShadow: message.role === 'user' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      textAlign: 'left',
                      wordBreak: 'break-word',
                    }}>
                      {(deepResearchMode && useLangGraph && message.role === 'assistant') ? renderDeepResearch(message.content) : message.content}
                    </div>
                  </div>
                ))}
                {deepResearchMode && useLangGraph && isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                  <div style={{
                    width: '100%',
                    maxWidth: 1000,
                    margin: '16px auto 0 auto',
                    background: '#20232a',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px #18181b44',
                    padding: '18px 28px 18px 24px',
                    fontFamily: 'Menlo, Monaco, monospace',
                    color: '#f3f4f6',
                    fontSize: 15,
                    border: '1px solid #23272f',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span style={{ color: '#facc14', fontWeight: 700, fontSize: 15 }}>Generating...</span>
                      <span style={{ color: '#facc14', fontWeight: 600, fontSize: 14 }}>{String(Math.floor(progressTimer / 60)).padStart(2, '0')}:{String(progressTimer % 60).padStart(2, '0')}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {progressSteps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {i < progressStepIndex ? (
                            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 13 }}>✔</span>
                          ) : i === progressStepIndex ? (
                            <span style={{ color: '#facc14', fontWeight: 700, fontSize: 13 }}>➔</span>
                          ) : (
                            <span style={{ color: '#444', fontWeight: 700, fontSize: 13 }}>•</span>
                          )}
                          <span style={{ color: i === progressStepIndex ? '#facc14' : i < progressStepIndex ? '#a3e635' : '#888', fontWeight: i === progressStepIndex ? 700 : 500 }}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Search Modal */}
      {searchModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSearchModalOpen(false)}
        >
          <div 
            style={{
              background: '#23272f',
              borderRadius: 16,
              padding: '24px',
              width: '90%',
              maxWidth: 500,
              border: '1px solid #23272f',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f3f4f6" strokeWidth="2" style={{ marginRight: 12 }}>
                <circle cx="11" cy="11" r="7"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ color: '#f3f4f6', fontSize: 18, fontWeight: 600 }}>Search chats</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <button
                onClick={() => { setDeepResearchMode(true); setUseLangGraph(false); setSearchModalOpen(false); }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: deepResearchMode && !useLangGraph ? '#facc14' : '#23272f',
                  color: deepResearchMode && !useLangGraph ? '#18181b' : '#f3f4f6',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: deepResearchMode && !useLangGraph ? '0 2px 8px #facc1422' : 'none',
                  transition: 'background 0.18s',
                }}
              >
                Deep Research
              </button>
              <button
                onClick={() => { setDeepResearchMode(true); setUseLangGraph(true); setSearchModalOpen(false); }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: deepResearchMode && useLangGraph ? '#facc14' : '#23272f',
                  color: deepResearchMode && useLangGraph ? '#18181b' : '#f3f4f6',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: deepResearchMode && useLangGraph ? '0 2px 8px #facc1422' : 'none',
                  transition: 'background 0.18s',
                }}
              >
                Deeper Research
              </button>
            </div>
            <input
              type="text"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="Search by title or content..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #23272f',
                fontSize: 16,
                background: '#18181b',
                color: '#f3f4f6',
                outline: 'none',
                marginBottom: 16,
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchModalOpen(false);
                }
              }}
            />
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {(() => {
                const filteredModalChats = chats.filter(chat =>
                  chat.title.toLowerCase().includes(modalSearch.toLowerCase()) ||
                  chat.snippet.toLowerCase().includes(modalSearch.toLowerCase())
                );
                return filteredModalChats.length === 0 ? (
                  <div style={{ color: '#71717a', fontSize: 15, textAlign: 'center', padding: '20px' }}>
                    No chats found
                  </div>
                ) : (
                  filteredModalChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        handleSelectChat(chat.id);
                        setSearchModalOpen(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: selectedChat === chat.id ? '#18181b' : 'transparent',
                        border: '1px solid transparent',
                        marginBottom: 4,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedChat !== chat.id) {
                          e.currentTarget.style.background = '#18181b';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedChat !== chat.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ fontWeight: selectedChat === chat.id ? 600 : 500, fontSize: 15, color: '#f3f4f6', marginBottom: 4 }}>
                        {chat.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#a1a1aa' }}>
                        {chat.snippet}
                      </div>
                    </div>
                  ))
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ProfileMenu component (copied from Navbar)
function ProfileMenu({ user }: { user: any }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <div 
      style={{ position: 'relative', marginLeft: 24 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ cursor: 'pointer', padding: 0, borderRadius: '50%' }}>
        {user.photoURL ? (
          <img src={user.photoURL} alt="User Avatar" style={{ width: 40, height: 40, borderRadius: '50%', display: 'block' }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#23272f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f3f4f6', fontWeight: 'bold', fontSize: 20 }}>
            {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: 0,
        background: '#23272f',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: '1px solid #23272f',
        zIndex: 10,
        minWidth: 220,
        opacity: dropdownOpen ? 1 : 0,
        transform: `translateY(${dropdownOpen ? 0 : '-5px'})`,
        transition: 'opacity 150ms ease-in-out, transform 150ms ease-in-out',
        pointerEvents: dropdownOpen ? 'auto' : 'none',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #23272f' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#f3f4f6' }}>{user.displayName || 'Anonymous User'}</p>
          <p style={{ margin: 0, fontSize: 14, color: '#a1a1aa', marginTop: 4, wordBreak: 'break-all' }}>{user.email}</p>
        </div>
        <div style={{ padding: '8px' }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#f3f4f6',
              cursor: 'pointer',
              padding: '8px 12px',
              width: '100%',
              textAlign: 'left',
              fontSize: 14,
              borderRadius: 8
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#23272f'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: 16, marginRight: 6 }}>⎋</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// ToolsMenu component (update signature to accept insideInput)
type ToolsMenuProps = {
  deepResearchMode: boolean;
  useLangGraph: boolean;
  setDeepResearchMode: (v: boolean) => void;
  setUseLangGraph: (v: boolean) => void;
  insideInput?: boolean;
};

function ToolsMenu({ deepResearchMode, useLangGraph, setDeepResearchMode, setUseLangGraph, insideInput }: ToolsMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: insideInput ? 'flex' : 'flex', flexDirection: insideInput ? 'row' : 'column', alignItems: 'center', marginRight: insideInput ? 8 : 0 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: insideInput ? INPUT_DARK : TOOLS_BG,
          color: insideInput ? '#f3f4f6' : TOOLS_TEXT,
          fontSize: 22,
          boxShadow: insideInput ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        title="Tools"
      >
        +
      </button>
      {open && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99,
              background: 'transparent',
            }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#23272f',
            border: 'none',
            borderRadius: 24,
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.22)',
            minWidth: 0,
            width: 'auto',
            zIndex: 100,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginTop: 8,
            alignItems: 'center',
          }}>
            <button
              onClick={() => {
                setDeepResearchMode(false);
                setUseLangGraph(false);
                setOpen(false);
              }}
              style={{
                padding: '12px 28px',
                borderRadius: 999,
                border: 'none',
                background: !deepResearchMode ? '#facc14' : '#23272f',
                color: !deepResearchMode ? '#18181b' : '#f3f4f6',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: !deepResearchMode ? '0 2px 8px #facc1422' : 'none',
                transition: 'background 0.18s',
                outline: 'none',
                minWidth: 180,
              }}
            >
              Research
            </button>
            <button
              onClick={() => {
                setDeepResearchMode(true);
                setUseLangGraph(false);
                setOpen(false);
              }}
              style={{
                padding: '12px 28px',
                borderRadius: 999,
                border: 'none',
                background: deepResearchMode && !useLangGraph ? '#facc14' : '#23272f',
                color: deepResearchMode && !useLangGraph ? '#18181b' : '#f3f4f6',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: deepResearchMode && !useLangGraph ? '0 2px 8px #facc1422' : 'none',
                transition: 'background 0.18s',
                outline: 'none',
                minWidth: 180,
              }}
            >
              Deep Research
            </button>
            <button
              onClick={() => {
                setDeepResearchMode(true);
                setUseLangGraph(true);
                setOpen(false);
              }}
              style={{
                padding: '12px 28px',
                borderRadius: 999,
                border: 'none',
                background: deepResearchMode && useLangGraph ? '#facc14' : '#23272f',
                color: deepResearchMode && useLangGraph ? '#18181b' : '#f3f4f6',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: deepResearchMode && useLangGraph ? '0 2px 8px #facc1422' : 'none',
                transition: 'background 0.18s',
                outline: 'none',
                minWidth: 180,
              }}
            >
              Deeper Research
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type ChatInputBarProps = {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  deepResearchMode: boolean;
  plusMenuOpen: boolean;
  setPlusMenuOpen: (fn: (prev: boolean) => boolean) => void;
  setDeepResearchMode: (v: boolean) => void;
  setUseLangGraph: (v: boolean) => void;
  useLangGraph: boolean;
  isSticky: boolean; // Add isSticky prop
};

function ChatInputBar({
  inputMessage,
  setInputMessage,
  handleSubmit,
  handleKeyPress,
  isLoading,
  deepResearchMode,
  plusMenuOpen,
  setPlusMenuOpen,
  setDeepResearchMode,
  setUseLangGraph,
  useLangGraph,
  isSticky // Destructure isSticky
}: ChatInputBarProps) {
  const [timer, setTimer] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const steps = [
    'Gathering sources...',
    'Analyzing information...',
    'Synthesizing insights...',
    'Finalizing response...'
  ];

  useEffect(() => {
    let timerInt: NodeJS.Timeout | null = null;
    let stepInt: NodeJS.Timeout | null = null;
    if (deepResearchMode && useLangGraph && isLoading) {
      setTimer(0);
      setStepIndex(0);
      timerInt = setInterval(() => setTimer(t => t + 1), 1000);
      stepInt = setInterval(() => setStepIndex(i => (i < steps.length - 1 ? i + 1 : i)), 1500);
    } else {
      setStepIndex(0);
      setTimer(0);
    }
    return () => {
      if (timerInt) clearInterval(timerInt);
      if (stepInt) clearInterval(stepInt);
    };
  }, [deepResearchMode, useLangGraph, isLoading]);

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', background: '#23272f', borderRadius: 16, border: '1px solid #23272f', boxShadow: '0 1px 8px rgba(0,0,0,0.10)', padding: 24, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={deepResearchMode && useLangGraph
            ? "Ask for in-depth, multi-step research or advanced design analysis..."
            : deepResearchMode && !useLangGraph
              ? "Ask for sources, facts, or detailed design research..."
              : "Ask about colors, furniture, layouts, or any design questions..."}
          disabled={isLoading}
          style={{
            width: '100%',
            minHeight: 36,
            maxHeight: 120,
            padding: '8px 12px',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            backgroundColor: 'transparent',
            color: '#f3f4f6',
            fontWeight: 400,
          }}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        {/* Up arrow submit button, right-aligned */}
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: (!inputMessage.trim() || isLoading) ? '#23272f' : '#facc14',
            color: (!inputMessage.trim() || isLoading) ? '#9ca3af' : '#18181b',
            cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            marginLeft: 12,
            transition: 'all 0.2s ease',
            boxShadow: (!inputMessage.trim() || isLoading) ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          ↑
        </button>
      </div>
      {/* + Button, below textarea, left-aligned, opens menu */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 'auto', marginTop: 18, marginLeft: 0 }}>
        <button type="button" onClick={() => setPlusMenuOpen((o) => !o)} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#facc14', color: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }} title="Tools">
          +
        </button>
        {(deepResearchMode && !useLangGraph) && (
          <span style={{
            marginLeft: 10,
            padding: '2px 8px 2px 12px',
            borderRadius: 999,
            background: '#facc14',
            color: '#18181b',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 0.1,
            boxShadow: '0 1px 4px #facc1422',
            display: 'inline-flex',
            alignItems: 'center',
            height: 28,
            minWidth: 0,
            whiteSpace: 'nowrap',
            transition: 'background 0.18s, color 0.18s',
          }}>
            Deep Research
            <button
              onClick={() => {
                setDeepResearchMode(false);
                setUseLangGraph(false);
              }}
              aria-label="Remove Deep Research mode"
              style={{
                marginLeft: 8,
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: 'none',
                background: '#18181b',
                color: '#facc14',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s',
                padding: 0,
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#23272f';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#18181b';
                e.currentTarget.style.color = '#facc14';
              }}
            >
              ×
            </button>
          </span>
        )}
        {(deepResearchMode && useLangGraph) && (
          <span style={{
            marginLeft: 10,
            padding: '2px 8px 2px 12px',
            borderRadius: 999,
            background: '#facc14',
            color: '#18181b',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 0.1,
            boxShadow: '0 1px 4px #facc1422',
            display: 'inline-flex',
            alignItems: 'center',
            height: 28,
            minWidth: 0,
            whiteSpace: 'nowrap',
            transition: 'background 0.18s, color 0.18s',
          }}>
            Deeper Research
            <button
              onClick={() => {
                setDeepResearchMode(false);
                setUseLangGraph(false);
              }}
              aria-label="Remove Deeper Research mode"
              style={{
                marginLeft: 8,
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: 'none',
                background: '#18181b',
                color: '#facc14',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s',
                padding: 0,
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#23272f';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#18181b';
                e.currentTarget.style.color = '#facc14';
              }}
            >
              ×
            </button>
          </span>
        )}
      </div>
      {plusMenuOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99,
              background: 'transparent',
            }}
            onClick={() => setPlusMenuOpen(() => false)}
          />
          <div style={{
            position: 'absolute',
            ...(isSticky
              ? { bottom: 56, left: 0 }
              : { top: 'calc(100% + 8px)', left: 0 }),
            background: '#23272f',
            border: 'none',
            borderRadius: 16,
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.22)',
            minWidth: 0,
            width: 'auto',
            zIndex: 100,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'center',
          }}>
            <button
              onClick={() => {
                setDeepResearchMode(true);
                setUseLangGraph(false);
                setPlusMenuOpen(() => false);
              }}
              style={{
                padding: '6px 18px',
                borderRadius: 999,
                border: 'none',
                background: deepResearchMode && !useLangGraph ? '#facc14' : '#23272f',
                color: deepResearchMode && !useLangGraph ? '#18181b' : '#f3f4f6',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: deepResearchMode && !useLangGraph ? '0 1px 4px #facc1422' : 'none',
                transition: 'background 0.18s, color 0.18s, font-weight 0.18s',
                outline: 'none',
                minWidth: 120,
                marginBottom: 2,
              }}
              onMouseOver={e => {
                if (!(deepResearchMode && !useLangGraph)) {
                  e.currentTarget.style.background = '#2d2f36';
                  e.currentTarget.style.fontWeight = '700';
                }
              }}
              onMouseOut={e => {
                if (!(deepResearchMode && !useLangGraph)) {
                  e.currentTarget.style.background = '#23272f';
                  e.currentTarget.style.fontWeight = '600';
                }
              }}
            >
              Research
            </button>
            <button
              onClick={() => {
                setDeepResearchMode(true);
                setUseLangGraph(true);
                setPlusMenuOpen(() => false);
              }}
              style={{
                padding: '6px 18px',
                borderRadius: 999,
                border: 'none',
                background: deepResearchMode && useLangGraph ? '#facc14' : '#23272f',
                color: deepResearchMode && useLangGraph ? '#18181b' : '#f3f4f6',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: deepResearchMode && useLangGraph ? '0 1px 4px #facc1422' : 'none',
                transition: 'background 0.18s, color 0.18s, font-weight 0.18s',
                outline: 'none',
                minWidth: 120,
              }}
              onMouseOver={e => {
                if (!(deepResearchMode && useLangGraph)) {
                  e.currentTarget.style.background = '#2d2f36';
                  e.currentTarget.style.fontWeight = '700';
                }
              }}
              onMouseOut={e => {
                if (!(deepResearchMode && useLangGraph)) {
                  e.currentTarget.style.background = '#23272f';
                  e.currentTarget.style.fontWeight = '600';
                }
              }}
            >
              Deep Research
            </button>
          </div>
        </>
      )}
    </form>
  );
}