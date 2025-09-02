"use client";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Edit3, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";

interface Pinboard {
  id: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
  notes?: any[];
  images?: any[];
  drawings?: any[];
}

export default function Board(){
    const { user } = useAuth();
    const [pinboards, setPinboards] = useState<Pinboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Fetch all pinboards for the current user
    const fetchPinboards = async () => {
        if (!user) return;
        
        try {
            const pinboardsRef = collection(db, "pinboards");
            const q = query(
                pinboardsRef,
                where("userId", "==", user.uid),
                orderBy("updatedAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            
            const pinboardList: Pinboard[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                pinboardList.push({
                    id: doc.id,
                    name: data.name, // Add the name field
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    notes: data.pinboard?.notes || [],
                    images: data.pinboard?.images || [],
                    drawings: data.pinboard?.drawings || []
                });
            });
            
            setPinboards(pinboardList);
        } catch (error) {
            console.error("Error fetching pinboards:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPinboards();
    }, [user]);

    const openPinboard = async () => {
        console.log("openPinboard called, user:", user);
        if (!user) {
            console.log("No user found");
            return;
        }
        
        try {
            console.log("Creating new pinboard...");
            
            // Generate sequential name based on existing pinboards count
            const nextNumber = pinboards.length + 1;
            const defaultName = `Pinboard ${nextNumber}`;
            
            // Create a new pinboard document in Firebase
            const newPinboardData = {
                userId: user.uid,
                name: defaultName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                pinboard: {
                    notes: [],
                    images: [],
                    drawings: []
                }
            };
            
            console.log("Pinboard data to save:", newPinboardData);
            const docRef = await addDoc(collection(db, "pinboards"), newPinboardData);
            console.log("New pinboard created with ID: ", docRef.id);
            
            // Refresh the pinboards list to show the new one
            await fetchPinboards();
            
            // Open the pinboard with the new ID
            const pinboardUrl = `/pinboard?pinboardId=${docRef.id}`;
            console.log("Opening pinboard URL:", pinboardUrl);
            window.open(pinboardUrl);
        } catch (error) {
            console.error("Error creating pinboard:", error);
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return "Unknown";
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const deletePinboard = async (pinboardId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        
        if (!user) return;
        
        if (!confirm("Are you sure you want to delete this pinboard? This action cannot be undone.")) {
            return;
        }
        
        try {
            await deleteDoc(doc(db, "pinboards", pinboardId));
            setPinboards(prev => prev.filter(p => p.id !== pinboardId));
        } catch (error) {
            console.error("Error deleting pinboard:", error);
        }
    };

    const startRename = (pinboardId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingId(pinboardId);
        setEditName(pinboardId.slice(-6));
    };

    const saveRename = async (pinboardId: string) => {
        if (!user || !editName.trim()) return;
        
        try {
            await updateDoc(doc(db, "pinboards", pinboardId), {
                name: editName.trim()
            });
            setPinboards(prev => prev.map(p => 
                p.id === pinboardId ? { ...p, name: editName.trim() } : p
            ));
            setEditingId(null);
            setEditName('');
        } catch (error) {
            console.error("Error renaming pinboard:", error);
        }
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditName('');
    };

    return (
        <div style={{ position: 'relative', padding: '32px' }}>
            {/* Plus button - keeping original position */}
            <button
                onClick={() => {
                    console.log("Button clicked!");
                    openPinboard().catch(error => {
                        console.error("Failed to open pinboard:", error);
                    });
                }}
                style={{ 
                    position: 'absolute', 
                    left: '160px', 
                    top: '160px',
                    background: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#333';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#000';
                }}
            >
                <Plus size={20} />
            </button>

            {/* Pinboards list - keeping original position */}
            <div style={{ marginTop: '240px' }}>
                <h2 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    marginBottom: '24px',
                    color: '#111827'
                }}>
                    Your Pinboards
                </h2>
                
                {loading ? (
                    <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px'
                    }}>
                        Loading pinboards...
                    </div>
                ) : pinboards.length === 0 ? (
                    <div style={{ 
                        color: '#6b7280', 
                        fontSize: '14px'
                    }}>
                        No pinboards yet. Click the + button to create your first one.
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '16px'
                    }}>
                        {pinboards.map((pinboard) => (
                            <div
                                key={pinboard.id}
                                onClick={() => window.open(`/pinboard?pinboardId=${pinboard.id}`)}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                {/* Action buttons - appear on hover */}
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    display: 'flex',
                                    gap: '4px',
                                    opacity: '0',
                                    transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0';
                                }}>
                                    <button
                                        onClick={(e) => startRename(pinboard.id, e)}
                                        style={{
                                            background: '#f3f4f6',
                                            border: 'none',
                                            borderRadius: '4px',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#6b7280'
                                        }}
                                        title="Rename"
                                    >
                                        <Edit3 size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => deletePinboard(pinboard.id, e)}
                                        style={{
                                            background: '#fef2f2',
                                            border: 'none',
                                            borderRadius: '4px',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#dc2626'
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '8px'
                                }}>
                                    {editingId === pinboard.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveRename(pinboard.id);
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                                style={{
                                                    fontSize: '15px',
                                                    fontWeight: '500',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    outline: 'none'
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    saveRename(pinboard.id);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#10b981'
                                                }}
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    cancelRename();
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#6b7280'
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 style={{ 
                                            fontSize: '15px',
                                            fontWeight: '500',
                                            color: '#111827',
                                            margin: 0
                                        }}>
                                            {pinboard.name || pinboard.id.slice(-6)}
                                        </h3>
                                    )}
                                    <span style={{ 
                                        fontSize: '12px',
                                        color: '#9ca3af'
                                    }}>
                                        {formatDate(pinboard.updatedAt)}
                                    </span>
                                </div>
                                
                                <div style={{ 
                                    fontSize: '13px',
                                    color: '#6b7280'
                                }}>
                                    {pinboard.notes?.length || 0} notes
                                    {(pinboard.images?.length || 0) > 0 && ` • ${pinboard.images?.length || 0} images`}
                                    {(pinboard.drawings?.length || 0) > 0 && ` • ${pinboard.drawings?.length || 0} drawings`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}