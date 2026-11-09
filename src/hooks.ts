import { useState, useEffect } from 'react';
import { isBackendAvailable, connectWebSocket, disconnectWS } from './api';

export function useBackend() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    isBackendAvailable().then(setIsAvailable);
  }, []);

  return { isAvailable };
}

export function useWebSocket(type: string, serverName: string = '') {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    connectWebSocket(type, serverName);
    setIsConnected(true);

    return () => {
      disconnectWS();
    };
  }, [type, serverName]);

  return { isConnected };
}
