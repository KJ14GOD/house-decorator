import React, { useState, useEffect } from "react";

export type ShareUser = {
  email: string;
  permission: "view" | "edit";
};

export type LinkSharing = {
  enabled: boolean;
  permission: "restricted" | "view" | "edit";
  link: string;
};

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  owner: { email: string; name: string };
  sharedWith: ShareUser[];
  linkSharing: LinkSharing;
  onUpdateShare: (data: { sharedWith: ShareUser[]; linkSharing: LinkSharing }) => void;
}

const accent = "#facc15";
const gray = "#f3f4f6";
const dark = "#18181b";
const light = "#f9fafb";

const dropdownOptions = [
  { value: "restricted", label: "Restricted", desc: "Only people with access can open with the link", icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2" style={{ marginRight: 8 }}><circle cx="12" cy="12" r="10" fill="#e5e7eb"/><rect x="8" y="12" width="8" height="5" rx="1.5" fill="#fff" stroke="#18181b" strokeWidth="1.5"/><circle cx="12" cy="14.5" r="1" fill="#18181b"/></svg>
  ) },
  { value: "view", label: "Anyone with the link", desc: "The project link is publicly viewable", icon: null },
  { value: "edit", label: "Anyone with the link (Can edit)", desc: "The project link is publicly editable", icon: null },
];

const roleOptions = [
  { value: "view", label: "Viewer" },
  { value: "edit", label: "Editor" },
];

const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onClose,
  roomId,
  roomName,
  owner,
  sharedWith: initialSharedWith,
  linkSharing: initialLinkSharing,
  onUpdateShare,
}) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [sharedWith, setSharedWith] = useState<ShareUser[]>(initialSharedWith);
  const [linkSharing, setLinkSharing] = useState<LinkSharing>(initialLinkSharing);
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Sync local state with props when they change
  useEffect(() => {
    console.log('ShareModal received sharedWith:', initialSharedWith);
    setSharedWith(initialSharedWith);
  }, [initialSharedWith]);

  useEffect(() => {
    setLinkSharing(initialLinkSharing);
  }, [initialLinkSharing]);

  useEffect(() => {
    if (open) {
      setShow(true);
      setTimeout(() => {
        const modal = document.getElementById("share-modal");
        if (modal) modal.style.opacity = "1";
      }, 10); // Small delay to ensure transition is applied
    } else {
      const modal = document.getElementById("share-modal");
      if (modal) modal.style.opacity = "0";
      setTimeout(() => setShow(false), 200);
    }
  }, [open]);

  if (!open && !show) return null;

  const handleAddUser = () => {
    if (!email.trim() || sharedWith.some(u => u.email === email.trim())) return;
    const newUser = { email: email.trim(), permission };
    const updated = [...sharedWith, newUser];
    setSharedWith(updated);
    setEmail("");
    setPermission("view");
    onUpdateShare({ sharedWith: updated, linkSharing });
  };

  const handleRemoveUser = (email: string) => {
    const updated = sharedWith.filter(u => u.email !== email);
    setSharedWith(updated);
    onUpdateShare({ sharedWith: updated, linkSharing });
  };

  const handleLinkPermission = (perm: "restricted" | "view" | "edit") => {
    const updated = { ...linkSharing, permission: perm };
    setLinkSharing(updated);
    onUpdateShare({ sharedWith, linkSharing: updated });
    setDropdownOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(linkSharing.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Helper for avatar initials
  const getInitials = (name: string, email: string) => {
    if (name && name.trim().length > 0) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  // Helper for icon
  const getAccessIcon = () => {
    if (linkSharing.permission === "restricted") {
      return (
        <div style={{ width: 38, height: 38, borderRadius: 19, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 18 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2"><rect x="7" y="11" width="10" height="7" rx="2" fill="#fff" stroke="#18181b" strokeWidth="1.5"/><path d="M12 15v-2" stroke="#18181b" strokeWidth="1.5"/><circle cx="12" cy="8.5" r="3.5" fill="#e5e7eb" stroke="#18181b" strokeWidth="1.5"/></svg>
        </div>
      );
    }
    // Globe icon for 'Anyone with the link'
    return (
      <div style={{ width: 38, height: 38, borderRadius: 19, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 18 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2"><circle cx="12" cy="12" r="10" fill="#e5e7eb" stroke="#18181b" strokeWidth="1.5"/><path d="M2 12h20" stroke="#18181b" strokeWidth="1.5"/><path d="M12 2a15.3 15.3 0 0 1 0 20" stroke="#18181b" strokeWidth="1.5"/><path d="M12 2a15.3 15.3 0 0 0 0 20" stroke="#18181b" strokeWidth="1.5"/></svg>
      </div>
    );
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Animation styles
  const modalOverlayAnim = open
    ? { opacity: 1, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }
    : { opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" };

  const modalAnim = open
    ? { opacity: 1, transform: "scale(1)" }
    : { opacity: 0, transform: "scale(0.96)" };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 10010,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(24,24,27,0.12)",
        transition: "opacity 0.22s, backdrop-filter 0.22s, -webkit-backdrop-filter 0.22s",
        pointerEvents: open ? "auto" : "none",
        ...modalOverlayAnim
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
        maxWidth: 600, minWidth: 420, width: "100%", padding: 0, position: "relative",
        transition: "opacity 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1)",
        ...modalAnim
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 40px 0 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: dark, letterSpacing: -0.2 }}>Share "{roomName}"</span>
          </div>
        </div>
        {/* Input bar */}
        <div style={{ display: "flex", gap: 10, margin: "28px 40px 0 40px" }}>
          <input
            type="email"
            placeholder="Add a name or email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ flex: 1, padding: "14px 16px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 16, color: dark, outline: email ? `2px solid ${accent}` : "none", fontWeight: 500, transition: "outline 0.2s" }}
            onFocus={e => (e.currentTarget.style.outline = `2px solid ${accent}`)}
            onBlur={e => (e.currentTarget.style.outline = email ? `2px solid ${accent}` : "none")}
          />
          <button
            onClick={handleAddUser}
            style={{
              background: email ? accent : gray,
              border: email ? `1.5px solid ${accent}` : `1.5px solid ${gray}`,
              color: email ? dark : "#bdbdbd",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              cursor: email ? "pointer" : "not-allowed",
              opacity: email ? 1 : 0.6,
              height: 48,
              padding: "0 22px",
              transition: "all 0.15s"
            }}
            disabled={!email}
          >
            Send invitation
          </button>
        </div>
        {/* People with access */}
        <div style={{ margin: "36px 0 0 0", padding: "0 40px" }}>
          <div style={{ fontSize: 15, color: dark, fontWeight: 600, marginBottom: 18 }}>People with access</div>
          {/* Owner */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: gray, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: accent, fontSize: 16 }}>{getInitials(owner.name, owner.email)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: dark }}>{owner.name} (you)</div>
              <div style={{ fontSize: 12, color: "#a3a3a3" }}>{owner.email}</div>
            </div>
            <span style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 500 }}>Owner</span>
          </div>
          {/* Shared users */}
          {sharedWith.map(u => (
            <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: gray, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: accent, fontSize: 16 }}>{getInitials(u.email, u.email)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: dark }}>{u.email}</div>
                <div style={{ fontSize: 12, color: "#a3a3a3" }}>{u.permission === "edit" ? "Editor" : "Viewer"}</div>
              </div>
              <select value={u.permission} onChange={e => {
                const newPerm = e.target.value as "view" | "edit";
                setSharedWith(prev => prev.map(b => b.email === u.email ? { ...b, permission: newPerm } : b));
                onUpdateShare({ sharedWith: sharedWith.map(b => b.email === u.email ? { ...b, permission: newPerm } : b), linkSharing });
              }} style={{ borderRadius: 7, border: "none", background: light, fontSize: 14, color: dark, fontWeight: 600, padding: "7px 10px", outline: `1.5px solid #e5e7eb` }}>
                <option value="edit">Editor</option>
                <option value="view">Viewer</option>
              </select>
              <button onClick={() => handleRemoveUser(u.email)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 20, cursor: "pointer", fontWeight: 600, lineHeight: 1, marginLeft: 6, opacity: 0.7 }} title="Remove">×</button>
            </div>
          ))}
        </div>
        {/* Divider */}
        <div style={{ height: 1, background: gray, margin: "36px 0 0 0" }} />
        {/* General access (Google Docs style) */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "28px 40px 40px 40px", position: "relative" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: dark, marginBottom: 14, letterSpacing: -0.2 }}>General access</div>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: gray,
            borderRadius: 8,
            padding: "16px 20px",
            width: "100%",
            position: "relative"
          }}>
            {getAccessIcon()}
            <span style={{ fontSize: 15, color: dark, fontWeight: 600, flex: 1, marginRight: 12 }}>Anyone with the link</span>
            {/* Role dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 7,
                  fontSize: 15,
                  color: dark,
                  fontWeight: 600,
                  padding: "7px 18px 7px 12px",
                  cursor: "pointer",
                  minWidth: 110,
                  boxShadow: roleDropdownOpen ? `0 2px 8px ${gray}` : "none"
                }}
                onClick={() => setRoleDropdownOpen(v => !v)}
                tabIndex={0}
              >
                {roleOptions.find(opt => opt.value === linkSharing.permission)?.label || "Viewer"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {roleDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: 38,
                  right: 0,
                  background: "#fff",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  zIndex: 10,
                  minWidth: 180,
                  padding: "6px 0"
                }}>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, padding: "8px 18px 4px 18px", letterSpacing: 1 }}>ROLE</div>
                  {roleOptions.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => { handleLinkPermission(opt.value as "view" | "edit"); setRoleDropdownOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 18px",
                        fontSize: 15,
                        color: dark,
                        fontWeight: 500,
                        cursor: "pointer",
                        background: linkSharing.permission === opt.value ? gray : "#fff",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = gray)}
                      onMouseLeave={e => (e.currentTarget.style.background = linkSharing.permission === opt.value ? gray : "#fff")}
                    >
                      {linkSharing.permission === opt.value && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8, marginLeft: 56, textAlign: "left" }}>
            {dropdownOptions.find(opt => opt.value === linkSharing.permission)?.desc}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
            <button
              onClick={handleCopyLink}
              style={{
                background: accent,
                color: dark,
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: "12px 22px",
                boxShadow: "0 2px 8px rgba(250,204,21,0.10)",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={onClose}
              style={{
                background: gray,
                color: dark,
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                padding: "12px 22px",
                transition: "background 0.15s"
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 