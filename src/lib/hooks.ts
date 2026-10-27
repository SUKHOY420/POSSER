import { useState, useEffect, useCallback } from 'react';
import { printer, PrinterConfig } from './printer';
import { paymentTerminal, TerminalConfig, TerminalStatus, PaymentResponse } from './payment-terminal';

export function usePrinter() {
  const [isConnected, setIsConnected] = useState(printer.isConnectedStatus());
  const [config, setConfig] = useState<PrinterConfig | null>(printer.getConfig());

  const updateConfig = useCallback((newConfig: PrinterConfig) => {
    printer.saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const connect = useCallback(async () => {
    const result = await printer.connect();
    setIsConnected(result);
    return result;
  }, []);

  const disconnect = useCallback(() => {
    printer.disconnect();
    setIsConnected(false);
  }, []);

  const printReceipt = useCallback(async (order: any, table: any) => {
    return await printer.printReceipt(order, table);
  }, []);

  const printKitchenTicket = useCallback(async (order: any, table: any, items: any[]) => {
    return await printer.printKitchenTicket(order, table, items);
  }, []);

  const printZReport = useCallback(async (session: any) => {
    return await printer.printZReport(session);
  }, []);

  const sendToKitchen = useCallback(async (order: any, table: any) => {
    const foodItems = order.items.filter((i: any) => i.menuItem.isFood);
    if (foodItems.length > 0) {
      return await printer.printKitchenTicket(order, table, foodItems);
    }
    return false;
  }, []);

  return {
    isConnected,
    config,
    updateConfig,
    connect,
    disconnect,
    printReceipt,
    printKitchenTicket,
    printZReport,
    sendToKitchen,
  };
}

export function usePaymentTerminal() {
  const [status, setStatus] = useState<TerminalStatus>(paymentTerminal.getStatus());
  const [config, setConfig] = useState<TerminalConfig | null>(paymentTerminal.getConfig());
  const [lastResponse, setLastResponse] = useState<PaymentResponse | null>(null);
  const [progress, setProgress] = useState<{ step: string; message: string } | null>(null);

  useEffect(() => {
    const handleStatusChange = (newStatus: TerminalStatus) => {
      setStatus(newStatus);
    };

    const handlePaymentComplete = (response: PaymentResponse) => {
      setLastResponse(response);
      setProgress(null);
    };

    const handlePaymentProgress = (data: { step: string; message: string }) => {
      setProgress(data);
    };

    paymentTerminal.on('statusChange', handleStatusChange);
    paymentTerminal.on('paymentComplete', handlePaymentComplete);
    paymentTerminal.on('paymentProgress', handlePaymentProgress);

    return () => {
      paymentTerminal.off('statusChange', handleStatusChange);
      paymentTerminal.off('paymentComplete', handlePaymentComplete);
      paymentTerminal.off('paymentProgress', handlePaymentProgress);
    };
  }, []);

  const updateConfig = useCallback((newConfig: TerminalConfig) => {
    paymentTerminal.saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const connect = useCallback(async () => {
    const result = await paymentTerminal.connect();
    return result;
  }, []);

  const processPayment = useCallback(async (amount: number, orderId: string) => {
    const response = await paymentTerminal.processPayment({
      id: Date.now().toString(),
      amount,
      currency: config?.currency || 'EUR',
      orderId,
      description: `Commande ${orderId.slice(0, 6)}`
    });
    return response;
  }, [config]);

  const cancel = useCallback(async () => {
    return await paymentTerminal.cancelTransaction();
  }, []);

  const disconnect = useCallback(() => {
    paymentTerminal.disconnect();
  }, []);

  return {
    status,
    config,
    lastResponse,
    progress,
    updateConfig,
    connect,
    processPayment,
    cancel,
    disconnect,
  };
}
