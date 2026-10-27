/**
 * ESC/POS Printer Protocol Implementation
 * Supporte les imprimantes thermiques Epson, Star, Bixolon, etc.
 * Connexion via USB, Série (RS232), Bluetooth, ou Network
 */

// Commandes ESC/POS de base
const ESC = '\x1B';
const GS = '\x1D';
const LF = '\x0A';

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'usb' | 'serial' | 'bluetooth' | 'network';
  connection: string; // Port, IP, MAC address
  paperWidth: 58 | 80; // mm
  autoCut: boolean;
  isOpenDrawer: boolean;
}

export interface PrintJob {
  id: string;
  type: 'ticket' | 'kitchen' | 'report' | 'receipt';
  data: any;
  timestamp: Date;
  status: 'pending' | 'printing' | 'success' | 'error';
  error?: string;
}

class ESCPOSPrinter {
  private config: PrinterConfig | null = null;
  private isConnected: boolean = false;
  private buffer: string = '';

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const saved = localStorage.getItem('printer_config');
    if (saved) {
      this.config = JSON.parse(saved);
    }
  }

  saveConfig(config: PrinterConfig) {
    this.config = config;
    localStorage.setItem('printer_config', JSON.stringify(config));
  }

  getConfig(): PrinterConfig | null {
    return this.config;
  }

  // Initialiser la connexion
  async connect(): Promise<boolean> {
    if (!this.config) {
      console.error('No printer configured');
      return false;
    }

    try {
      // Simulation de connexion (en production, utiliser WebUSB, WebSerial, ou fetch pour network)
      switch (this.config.type) {
        case 'usb':
          return await this.connectUSB();
        case 'serial':
          return await this.connectSerial();
        case 'bluetooth':
          return await this.connectBluetooth();
        case 'network':
          return await this.connectNetwork();
        default:
          return false;
      }
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  // Connexion USB via WebUSB API
  private async connectUSB(): Promise<boolean> {
    try {
      if ('usb' in navigator) {
        // @ts-ignore - WebUSB API
        const device = await navigator.usb.requestDevice({
          filters: [{ vendorId: 0x04b8 }] // Epson vendor ID
        });
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('USB connection failed:', error);
      return false;
    }
  }

  // Connexion Série via Web Serial API
  private async connectSerial(): Promise<boolean> {
    try {
      if ('serial' in navigator) {
        // @ts-ignore - Web Serial API
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Serial connection failed:', error);
      return false;
    }
  }

  // Connexion Bluetooth via Web Bluetooth API
  private async connectBluetooth(): Promise<boolean> {
    try {
      if ('bluetooth' in navigator) {
        // @ts-ignore - Web Bluetooth API
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
        });
        const server = await device.gatt?.connect();
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      return false;
    }
  }

  // Connexion Network (TCP/IP)
  private async connectNetwork(): Promise<boolean> {
    try {
      // Simulation - en production utiliser WebSocket ou fetch
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Network connection failed:', error);
      return false;
    }
  }

  disconnect() {
    this.isConnected = false;
  }

  // Commandes ESC/POS
  private initialize() {
    this.buffer += ESC + '@'; // Initialiser l'imprimante
  }

  private setAlignment(alignment: 'left' | 'center' | 'right') {
    const alignCode = alignment === 'left' ? 0 : alignment === 'center' ? 1 : 2;
    this.buffer += ESC + 'a' + String.fromCharCode(alignCode);
  }

  private setBold(enabled: boolean) {
    this.buffer += ESC + 'E' + (enabled ? '\x01' : '\x00');
  }

  private setFontSize(doubleWidth: boolean, doubleHeight: boolean) {
    const size = (doubleWidth ? 16 : 0) | (doubleHeight ? 8 : 0);
    this.buffer += GS + '!' + String.fromCharCode(size);
  }

  private cutPaper() {
    if (this.config?.autoCut) {
      this.buffer += GS + 'V' + '\x00'; // Coupe complète
    }
  }

  private openCashDrawer() {
    if (this.config?.isOpenDrawer) {
      // Commande pour ouvrir le tiroir-caisse (pin 2)
      this.buffer += ESC + 'p' + '\x00' + '\x19' + '\x19';
    }
  }

  private lineFeed(lines: number = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer += LF;
    }
  }

  private printText(text: string) {
    this.buffer += text + LF;
  }

  private printLine(char: string = '-', length?: number) {
    const len = length || (this.config?.paperWidth === 80 ? 48 : 32);
    this.buffer += char.repeat(len) + LF;
  }

  // Générer un ticket de caisse
  generateReceipt(order: any, table: any): string {
    this.buffer = '';
    this.initialize();

    // En-tête
    this.setAlignment('center');
    this.setBold(true);
    this.setFontSize(true, true);
    this.printText('LE BISTROT DU COIN');
    this.setFontSize(false, false);
    this.setBold(false);
    this.lineFeed();
    
    this.printText('12 Rue de la Paix');
    this.printText('75002 Paris');
    this.printText('Tel: 01 23 45 67 89');
    this.printText('SIRET: 123 456 789 00012');
    this.lineFeed();

    this.setAlignment('left');
    this.printLine();
    this.printText(`Table: ${table?.name || 'N/A'}`);
    this.printText(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
    this.printText(`Heure: ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    this.printText(`Serveur: ${order.serverName}`);
    this.printLine();

    // Articles
    this.setBold(true);
    this.printText('ARTICLES');
    this.setBold(false);
    
    order.items.forEach((item: any) => {
      const name = item.menuItem.name;
      const qty = item.quantity;
      const price = (item.menuItem.price * qty).toFixed(2);
      
      this.printText(`${qty}x ${name}`);
      if (item.notes) {
        this.printText(`   → ${item.notes}`);
      }
      this.setAlignment('right');
      this.printText(`${price} €`);
      this.setAlignment('left');
    });

    this.printLine();

    // Totaux
    const subtotal = order.subtotal.toFixed(2);
    const discount = order.discount > 0 ? `-${order.discount}%` : '';
    const total = order.total.toFixed(2);

    this.setAlignment('right');
    this.printText(`Sous-total: ${subtotal} €`);
    if (order.discount > 0) {
      this.printText(`Remise ${discount}`);
    }
    this.setBold(true);
    this.setFontSize(true, false);
    this.printText(`TOTAL: ${total} €`);
    this.setFontSize(false, false);
    this.setBold(false);
    this.lineFeed();

    // Paiement
    this.setAlignment('left');
    this.printLine();
    order.payments.forEach((payment: any) => {
      const method = payment.method === 'cash' ? 'Espèces' : 'Carte';
      this.printText(`${method}: ${payment.amount.toFixed(2)} €`);
    });

    this.lineFeed();
    this.setAlignment('center');
    this.setBold(true);
    this.printText('MERCI DE VOTRE VISITE !');
    this.setBold(false);
    this.printText('À bientôt');
    this.lineFeed(3);

    this.openCashDrawer();
    this.cutPaper();

    return this.buffer;
  }

  // Générer un ticket cuisine
  generateKitchenTicket(order: any, table: any, items: any[]): string {
    this.buffer = '';
    this.initialize();

    this.setAlignment('center');
    this.setBold(true);
    this.setFontSize(true, true);
    this.printText('*** CUISINE ***');
    this.setFontSize(false, false);
    this.lineFeed();

    this.setAlignment('left');
    this.printLine('=');
    this.setBold(true);
    this.printText(`TABLE: ${table?.name || 'N/A'}`);
    this.printText(`SERVEUR: ${order.serverName}`);
    this.printText(`HEURE: ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    this.setBold(false);
    this.printLine('=');
    this.lineFeed();

    items.forEach((item: any) => {
      this.setBold(true);
      this.printText(`${item.quantity}x ${item.menuItem.name}`);
      this.setBold(false);
      
      if (item.notes) {
        this.setBold(true);
        this.printText(`   ⚠ ${item.notes}`);
        this.setBold(false);
      }
      
      if (Object.keys(item.modifiers).length > 0) {
        const mods = Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(', ');
        this.printText(`   → ${mods}`);
      }
      this.lineFeed();
    });

    this.printLine('=');
    this.lineFeed(2);
    this.cutPaper();

    return this.buffer;
  }

  // Envoyer à l'imprimante
  async send(data: string): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      // Simulation d'envoi
      console.log('Sending to printer:', data);
      
      // En production, envoyer via WebUSB/WebSerial/Network
      // await this.writeToPrinter(data);
      
      return true;
    } catch (error) {
      console.error('Print failed:', error);
      return false;
    }
  }

  // Imprimer un ticket de caisse
  async printReceipt(order: any, table: any): Promise<boolean> {
    const data = this.generateReceipt(order, table);
    return await this.send(data);
  }

  // Imprimer un ticket cuisine
  async printKitchenTicket(order: any, table: any, items: any[]): Promise<boolean> {
    const data = this.generateKitchenTicket(order, table, items);
    return await this.send(data);
  }

  // Imprimer un rapport Z
  async printZReport(session: any): Promise<boolean> {
    this.buffer = '';
    this.initialize();

    this.setAlignment('center');
    this.setBold(true);
    this.setFontSize(true, true);
    this.printText('RAPPORT Z');
    this.setFontSize(false, false);
    this.setBold(false);
    this.lineFeed();

    this.setAlignment('left');
    this.printText(`Date: ${new Date(session.date).toLocaleDateString('fr-FR')}`);
    this.printText(`Ouverture: ${new Date(session.openedAt).toLocaleTimeString('fr-FR')}`);
    this.printText(`Fermeture: ${new Date(session.closedAt).toLocaleTimeString('fr-FR')}`);
    this.printLine();

    this.setBold(true);
    this.printText('TOTAL GÉNÉRAL');
    this.setBold(false);
    this.setAlignment('right');
    this.printText(`${session.totalRevenue.toFixed(2)} €`);
    this.setAlignment('left');
    this.lineFeed();

    this.printText('Espèces:');
    this.setAlignment('right');
    this.printText(`${session.totalCash.toFixed(2)} €`);
    this.setAlignment('left');

    this.printText('Carte:');
    this.setAlignment('right');
    this.printText(`${session.totalCard.toFixed(2)} €`);
    this.setAlignment('left');
    this.lineFeed();

    this.setBold(true);
    this.printText('DÉTAIL PAR SERVEUR');
    this.setBold(false);

    Object.entries(session.serverTotals).forEach(([id, data]: [string, any]) => {
      this.printText(`${data.name}:`);
      this.setAlignment('right');
      this.printText(`${data.revenue.toFixed(2)} € (${data.orders} cmd)`);
      this.setAlignment('left');
    });

    this.lineFeed(3);
    this.cutPaper();

    return await this.send(this.buffer);
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

export const printer = new ESCPOSPrinter();
