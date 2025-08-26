import { db } from "@/lib/firebase/firebase";
import { collection, doc, addDoc, getDocs, query, orderBy, limit, startAfter, Timestamp, updateDoc} from "firebase/firestore";


export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    agent?: string;
    confidence?: number;
    reasoning?: string;
    amazonResults?: any;
    showAllProducts?: boolean;
    // Optional fields used by multi-agent streaming
    progressData?: any;
    clarificationNeeded?: boolean;
    clarificationType?: string;
    questions?: Array<{ text: string; action: string } | string>;
    createdAt?: Timestamp;
    userId?: string;
}

export interface RoomSummary {
    lastMessageAt?: Timestamp;
    messageCount?: number;
    lastMessage?: {
        role: 'user' | 'assistant';
        content: string;
        preview: string;
    };
}

export class MessageStorage {
    static async addMessage(roomId: string, message: Omit<ChatMessage, 'createdAt'>) {
        const messagesRef = collection(db, "rooms", roomId, "messages");
        const messageWithTimeStamp: ChatMessage = {
            ...message,
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(messagesRef, messageWithTimeStamp);
        await this.updateRoomSummary(roomId, messageWithTimeStamp);
        return docRef.id;
    }

    static async getRecentMessages(roomId: string, limitCount: number = 10) {
        const messagesRef = collection(db, "rooms", roomId, "messages");
        const q = query(
            messagesRef,
            orderBy("createdAt", "desc"),
            limit(limitCount)
        )

        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),

        })) as (ChatMessage & { id: string}) []

        return messages.reverse();

    }
    
    static async getMessagesAfter(roomId: string, lastDoc: any, limitCount: number = 10) {
        const messagesRef = collection(db, "rooms", roomId, "messages");
        const q = query(
            messagesRef,
            orderBy("createdAt", "desc"),
            startAfter(lastDoc),
            limit(limitCount)
        )
        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as (ChatMessage & { id: string}) []

        return {
            messages: messages.reverse(),
            lastDoc: snapshot.docs[snapshot.docs.length - 1],

        };
        
    }
    
    static async getAllMessages(roomId: string) {
        const messagesRef = collection(db, "rooms", roomId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as (ChatMessage & { id: string}) []
    }

    private static async updateRoomSummary(roomId: string, lastMessage: ChatMessage) {
        const roomRef = doc(db, "rooms", roomId);
        const summary: RoomSummary = {
            lastMessageAt: lastMessage.createdAt,
            messageCount: 1,
            lastMessage: {
                role: lastMessage.role,
                content: lastMessage.content,
                preview: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '')              
            }
        };

        try{
            await updateDoc(roomRef, {
                lastMessageAt: summary.lastMessageAt,
                messageCount: summary.messageCount,
                lastMessage: summary.lastMessage
            });
        } catch (error){
            console.error("Error updating room summary: ", error);
        }

    }

    static async migrateExistingMessages(roomId: string, existingMessages: any[]) {
        if(!existingMessages || existingMessages.length === 0) return;

        const messagesRef = collection(db, "rooms", roomId, "messages");
        for(const msg of existingMessages){
            const messageWithTimeStamp: ChatMessage = {
                role: msg.role,
                content: msg.content,
                agent: msg.agent,
                confidence: msg.confidence,
                reasoning: msg.reasoning,
                amazonResults: msg.amazonResults,
                showAllProducts: msg.showAllProducts,
                progressData: msg.progressData,
                clarificationNeeded: msg.clarificationNeeded,
                clarificationType: msg.clarificationType,
                questions: msg.questions,
                createdAt: msg.createdAt || Timestamp.now(),
                userId: msg.userId || 'unknown',
            };
            await addDoc(messagesRef, messageWithTimeStamp);
        }
        if(existingMessages.length > 0){
            const lastMsg = existingMessages[existingMessages.length - 1];
            await this.updateRoomSummary(roomId, {
                ...lastMsg,
                createdAt: lastMsg.createdAt || Timestamp.now(),
            });
        }
    }
}

