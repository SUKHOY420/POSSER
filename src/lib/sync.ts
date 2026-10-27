/**
 * Synchronisation en temps réel entre les postes POS
 * Utilise BroadcastChannel API + localStorage pour la persistance
 */

import { Order, Table, Session, OrderItem } from '../types';

export type SyncEventType =
  | 'STATE_SNAPSHOT'
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_CLOSED'
  | 'ITEM_ADDED'
  | 'ITEM_REMOVED'
  | 'ITEM_UPDATED'
  | 'ORDER_SENT_TO_KITCHEN'
  | 'ITEM_STATUS_CHANGED'
  | 'TABLE_STATUS_CHANGED'
  | 'PAYMENT_PROCESSED'
  | 'KITCHEN_NOTIFICATION'
  | 'SERVER_NOTIFICATION';

interface SyncMessage {
  id: string;
  postId: string;
  postType: 'main' | 'kitchen' | 'server';
  serverName: string;
  timestamp: number;
  type: SyncEventType;
  payload: any;
}

type SyncCallback = (payload: any) => void;

class SyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<SyncEventType, Set<SyncCallback>> = new Map();
  private postId: string;
  private postType: 'main' | 'kitchen' | 'server' = 'main';
  private serverName: string = '';
  private initialized: boolean = false;

  constructor() {
    this.postId = 'post-' + Math.random().toString(36).substr(2, 9);
  }

  initialize(postType: 'main' | 'kitchen' | 'server', serverName: string = '') {
    // Fermer l'ancien channel
    if (this.channel) {
      this.channel.close();
    }

    this.postType = postType;
    this.serverName = serverName;

    // Créer le BroadcastChannel
    this.channel = new BroadcastChannel('quickpos-sync-v2');

    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const msg = event.data;
      
      // Ignorer nos propres messages
      if (msg.postId === this.postId) return;

      console.log(`[Sync ${this.postType}] ✅ Message reçu de ${msg.postType}:`, msg.type, msg.payload);

      // Émettre aux listeners
      const cbs = this.listeners.get(msg.type);
      if (cbs) {
        cbs.forEach(cb => {
          try {
            cb(msg.payload);
          } catch (e) {
            console.error('[Sync] Erreur listener:', e);
          }
        });
      }
    };

    this.initialized = true;
    console.log(`[Sync] Poste initialisé: ${postType} (${this.postId})`);
  }

  broadcast(type: SyncEventType, payload: any) {
    if (!this.channel || !this.initialized) {
      console.warn('[Sync] Pas initialisé, broadcast ignoré:', type);
      return;
    }

    const msg: SyncMessage = {
      id: Math.random().toString(36).substr(2, 9),
      postId: this.postId,
      postType: this.postType,
      serverName: this.serverName,
      timestamp: Date.now(),
      type,
      payload,
    };

    try {
      this.channel.postMessage(msg);
      console.log(`[Sync ${this.postType}] ✅ Broadcast envoyé:`, type, payload);
    } catch (e) {
      console.error('[Sync] ❌ Erreur broadcast:', e);
    }
  }

  on(type: SyncEventType, callback: SyncCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Retourne une fonction de cleanup
    return () => {
      const cbs = this.listeners.get(type);
      if (cbs) {
        cbs.delete(callback);
      }
    };
  }

  getPostId(): string {
    return this.postId;
  }

  getPostType(): string {
    return this.postType;
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

export const syncManager = new SyncManager();
