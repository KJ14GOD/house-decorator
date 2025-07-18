import React from 'react';

interface ChatSession {
  id: string;
  title: string;
  snippet: string;
  timestamp: string;
}

interface SidebarProps {
  chats: ChatSession[];
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNewChat?: () => void;
  search: string;
  setSearch: (s: string) => void;
  onSearchClick?: () => void;
  accentColor?: string;
  mainTextColor?: string;
  secondaryTextColor?: string;
  backgroundColor?: string;
  accentOrange?: string;
  accentRed?: string;
  accentPink?: string;
}

const SIDEBAR_WIDTH = 300;
const BORDER = '#e5e7eb';
const SHADOW = '2px 0 16px rgba(0,0,0,0.04)';
const SELECTED_BG_DEFAULT = 'rgba(59,130,246,0.07)';

const SIDEBAR_BG = '#18181b';
const SIDEBAR_TEXT = '#f3f4f6';
const SIDEBAR_ICON = '#d1d5db';
const SIDEBAR_BORDER = '#23272f';

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  selectedChat,
  onSelectChat,
  collapsed,
  onToggleCollapse,
  onNewChat,
  search,
  setSearch,
  onSearchClick,
  accentColor = '#facc14',
  mainTextColor = '#000',
  secondaryTextColor = '#444',
  backgroundColor = '#fff',
  accentOrange = 'rgba(255, 69, 0, 0.8)',
  accentRed = 'rgba(239, 68, 68, 0.6)',
  accentPink = '#fda4af',
}) => {
  const SELECTED_BG = selectedChat ? accentRed : (accentColor === '#facc14' ? 'rgba(250,204,20,0.13)' : 'rgba(59,130,246,0.07)');
  return (
    <aside
      style={{
        width: collapsed ? 64 : SIDEBAR_WIDTH,
        background: SIDEBAR_BG,
        borderRight: `1px solid ${SIDEBAR_BORDER}`,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        boxShadow: SHADOW,
        zIndex: 100,
        position: 'relative',
      }}
    >
      {/* Back to Room Button */}
      <div style={{ padding: collapsed ? '28px 0 0 0' : '16px 0 0 0', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', alignItems: 'center' }}>
        <button
          onClick={() => window.location.href = '/model'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: SIDEBAR_ICON,
            fontWeight: 500,
            fontSize: 14,
            padding: collapsed ? 0 : '4px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            marginLeft: collapsed ? 0 : 12,
            transition: 'background 0.2s',
          }}
          title="Back to Room"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SIDEBAR_ICON} strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          {!collapsed && 'Back to Room'}
        </button>
      </div>
      {/* Top: Hamburger + Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '20px 20px 12px 20px',
        minHeight: 64,
        background: SIDEBAR_BG,
      }}>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: SIDEBAR_ICON,
            fontSize: 22,
            transition: 'background 0.2s',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SIDEBAR_ICON} strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 22, color: SIDEBAR_TEXT, letterSpacing: '-0.02em', userSelect: 'none' }}>
            Decorator AI
          </span>
        )}
      </div>
      {/* New Chat Button */}
      <div style={{ padding: collapsed ? '12px 0' : '20px', display: 'flex', justifyContent: 'center', background: SIDEBAR_BG }}>
        <div style={{ display: 'flex', alignItems: 'center', width: collapsed ? 36 : '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <button
            style={{
              width: 36,
              height: 36,
              background: accentColor,
              color: '#18181b',
              border: 'none',
              borderRadius: '50%',
              padding: 0,
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${accentColor}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            title="New Chat"
            onClick={onNewChat}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          {!collapsed && (
            <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', height: 36 }}>
              <span style={{ fontWeight: 600, fontSize: 16, color: '#fff', userSelect: 'none' }}>New Chat</span>
            </div>
          )}
        </div>
      </div>
      {/* Search Trigger */}
      <div style={{ padding: collapsed ? '12px 0' : '20px', display: 'flex', justifyContent: 'center', background: SIDEBAR_BG }}>
        <div style={{ display: 'flex', alignItems: 'center', width: collapsed ? 36 : '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <button
            onClick={onSearchClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              width: collapsed ? 36 : 'auto',
              height: 36,
              borderRadius: 18,
              transition: 'background 0.2s',
            }}
            title="Search chats"
          >
            <span style={{
              width: 36,
              height: 36,
              background: '#23272f',
              color: SIDEBAR_ICON,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SIDEBAR_ICON} strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            {!collapsed && (
              <span style={{ marginLeft: 16, fontWeight: 500, fontSize: 15, color: SIDEBAR_TEXT, userSelect: 'none' }}>Search chats</span>
            )}
          </button>
        </div>
      </div>
      {/* Chats Label and List */}
      {!collapsed && (
        <>
          <div style={{ padding: '18px 20px 8px 20px', color: '#a1a1aa', fontWeight: 600, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', background: SIDEBAR_BG }}>
            Chats
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', background: SIDEBAR_BG }}>
            {chats.length === 0 ? (
              <div style={{ color: '#71717a', fontSize: 15, marginTop: 32, textAlign: 'center', opacity: 0.7 }}>
                No chats yet
              </div>
            ) : chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                style={{
                  margin: '4px 8px',
                  padding: 0,
                  width: 'calc(100% - 16px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  cursor: 'pointer',
                  background: selectedChat === chat.id ? '#23272f' : 'none',
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: 'none',
                  minHeight: 44,
                  position: 'relative',
                  transition: 'background 0.18s',
                  outline: 'none',
                }}
                title={chat.title}
                tabIndex={0}
                onMouseOver={e => { if (selectedChat !== chat.id) e.currentTarget.style.background = '#23272f'; }}
                onMouseOut={e => { if (selectedChat !== chat.id) e.currentTarget.style.background = 'none'; }}
              >
                {/* Left accent bar for selected chat */}
                {selectedChat === chat.id && (
                  <div style={{ width: 4, height: 36, borderRadius: 4, background: accentColor, marginRight: 12 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', padding: selectedChat === chat.id ? '6px 0 6px 0' : '6px 0' }}>
                  <span style={{ fontWeight: selectedChat === chat.id ? 700 : 500, fontSize: 15, color: selectedChat === chat.id ? '#fff' : SIDEBAR_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: selectedChat === chat.id ? 4 : 8 }}>{chat.title}</span>
                  {/* <span style={{ fontSize: 13, color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: selectedChat === chat.id ? 4 : 8 }}>{chat.snippet}</span> */}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar; 