/**
 * Synchronisation en temps réel entre les postes POS
 * Utilise BroadcastChannel API pour la communication cross-tab/cross-window
 * Permet la synchronisation entre :
 * - Tablettes serveurs (plusieurs)
 * - Écran principal (caisse)
 * - Écran cuisine (KDS)
 */

import { Order, Table, Session } from '../types';

export type SyncEvent =
  | { type: 'ORDER_CREATED'; order: Order }
  | { type: 'ORDER_UPDATED'; order: Order }
  | { type: 'ORDER_CLOSED'; orderId: string }
  | { type: 'ITEM_ADDED'; orderId: string; item: any }
  | { type: 'ITEM_REMOVED'; orderId: string; itemId: string }
  | { type: 'ITEM_UPDATED'; orderId: string; itemId: string; updates: any }
  | { type: 'ORDER_SENT_TO_KITCHEN'; orderId: string }
  | { type: 'ITEM_STATUS_CHANGED'; orderId: string; itemId: string; status: string }
  | { type: 'TABLE_STATUS_CHANGED'; tableId: string; status: string }
  | { type: 'PAYMENT_PROCESSED'; orderId: string; method: string; amount: number }
  | { type: 'SESSION_CLOSED'; session: Session }
  | { type: 'KITCHEN_NOTIFICATION'; orderId: string; message: string }
  | { type: 'SERVER_NOTIFICATION'; message: string; from: string };

class SyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private postId: string;
  private postType: 'main' | 'kitchen' | 'server';
  private serverName: string;

  constructor() {
    this.postId = 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    this.postType = 'main';
    this.serverName = '';
  }

  initialize(postType: 'main' | 'kitchen' | 'server', serverName: string = '') {
    this.postType = postType;
    this.serverName = serverName;

    // Fermer l'ancien channel s'il existe
    if (this.channel) {
      this.channel.close();
    }

    // Créer un nouveau BroadcastChannel
    this.channel = new BroadcastChannel('quickpos-sync');

    // Écouter les messages
    this.channel.onmessage = (event) => {
      const { postId, event: syncEvent } = event.data;
      
      // Ignorer nos propres messages
      if (postId === this.postId) return;

      // Émettre l'événement aux listeners
      this.emit(syncEvent.type, syncEvent);
    };

    console.log(`[Sync] Poste initialisé: ${postType} (${this.postId})`);
  }

  // Envoyer un événement à tous les autres postes
  broadcast(event: SyncEvent) {
    if (!this.channel) {
      console.warn('[Sync] Channel non initialisé');
      return;
    }

    const message = {
      postId: this.postId,
      postType: this.postType,
      serverName: this.serverName,
      timestamp: Date.now(),
      event,
    };

    this.channel.postMessage(message);
    console.log(`[Sync] Broadcast:`, event.type);
  }

  // S'abonner à un type d'événement (retourne une fonction de cleanup)
  on(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      const cbs = this.listeners.get(eventType);
      if (cbs) {
        this.listeners.set(eventType, cbs.filter(cb => cb !== callback));
      }
    };
  }

  // Se désabonner
  off(eventType: string, callback: Function) {
    const cbs = this.listeners.get(eventType);
    if (cbs) {
      this.listeners.set(eventType, cbs.filter(cb => cb !== callback));
    }
  }

  // Émettre un événement localement
  private emit(eventType: string, data: any) {
    const cbs = this.listeners.get(eventType);
    if (cbs) {
      cbs.forEach(cb => cb(data));
    }
  }

  // Envoyer une notification à la cuisine
  notifyKitchen(orderId: string, message: string) {
    this.broadcast({
      type: 'KITCHEN_NOTIFICATION',
      orderId,
      message,
    });
  }

  // Envoyer une notification à un serveur
  notifyServer(message: string, from: string) {
    this.broadcast({
      type: 'SERVER_NOTIFICATION',
      message,
      from,
    });
  }

  // Notifier qu'une commande est prête
  notifyOrderReady(orderId: string, tableName: string) {
    this.broadcast({
      type: 'SERVER_NOTIFICATION',
      message: `Commande ${tableName} prête !`,
      from: 'Cuisine',
    });
  }

  // Notifier qu'une nouvelle commande est en cuisine
  notifyNewOrder(orderId: string, tableName: string, serverName: string) {
    this.broadcast({
      type: 'KITCHEN_NOTIFICATION',
      orderId,
      message: `Nouvelle commande ${tableName} par ${serverName}`,
    });
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
  }
}

export const syncManager = new SyncManager();

// Hook React pour utiliser la synchronisation
import { useEffect, useCallback } from 'react';

export function useSync() {
  const broadcast = useCallback((event: SyncEvent) => {
    syncManager.broadcast(event);
  }, []);

  const on = useCallback((eventType: string, callback: Function) => {
    syncManager.on(eventType, callback);
    return () => syncManager.off(eventType, callback);
  }, []);

  return { broadcast, on };
}
