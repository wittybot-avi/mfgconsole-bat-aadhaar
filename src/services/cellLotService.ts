export interface CellLot {
  id: string;
  supplier: string;
  shipmentId: string;
  chemistry: string;
  cellModel: string;
  receivedQty: number;
  receivedAt: string;
  serialPolicy: 'SUPPLIER_PROVIDED' | 'MANUFACTURER_GENERATED';
  prefix?: string;
  serialRangeStart?: number;
  serialRangeEnd?: number;
  status: 'OPEN' | 'CLOSED';
  serials: string[];
}

export interface ScanEvent {
  id: string;
  serial: string;
  targetType: 'Module' | 'Pack';
  targetId: string;
  batterySerial?: string;
  timestamp: string;
  actor: string;
  stationId: string;
  outcome: 'PASS' | 'FAIL';
}

class CellLotService {
  private LOT_KEY = 'aayatana_cell_lots_v1';
  private SCAN_KEY = 'aayatana_scan_audit_v1';

  private loadLots(): CellLot[] {
    const data = localStorage.getItem(this.LOT_KEY);
    if (!data) {
      const seed: CellLot[] = [{
        id: 'lot-001',
        supplier: 'CATL',
        shipmentId: 'SH-2024-X1',
        chemistry: 'LFP',
        cellModel: 'LFP-100Ah-G2',
        receivedQty: 500,
        receivedAt: new Date().toISOString(),
        serialPolicy: 'MANUFACTURER_GENERATED',
        prefix: 'C',
        serialRangeStart: 1000,
        serialRangeEnd: 1500,
        status: 'OPEN',
        serials: Array.from({length: 100}).map((_, i) => `C100${i}`)
      }];
      this.saveLots(seed);
      return seed;
    }
    return JSON.parse(data);
  }

  private saveLots(lots: CellLot[]) {
    localStorage.setItem(this.LOT_KEY, JSON.stringify(lots));
  }

  private loadScans(): ScanEvent[] {
    const data = localStorage.getItem(this.SCAN_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveScans(scans: ScanEvent[]) {
    localStorage.setItem(this.SCAN_KEY, JSON.stringify(scans));
  }

  async listLots(): Promise<CellLot[]> {
    return this.loadLots();
  }

  async getLot(id: string): Promise<CellLot | undefined> {
    return this.loadLots().find(l => l.id === id);
  }

  async createLot(lot: Partial<CellLot>): Promise<CellLot> {
    const lots = this.loadLots();
    const newLot: CellLot = {
      id: `lot-${Date.now()}`,
      supplier: lot.supplier || 'Unknown',
      shipmentId: lot.shipmentId || 'TBD',
      chemistry: lot.chemistry || 'LFP',
      cellModel: lot.cellModel || 'TBD',
      receivedQty: lot.receivedQty || 0,
      receivedAt: new Date().toISOString(),
      serialPolicy: lot.serialPolicy || 'MANUFACTURER_GENERATED',
      status: 'OPEN',
      serials: [],
      ...lot
    };
    lots.push(newLot);
    this.saveLots(lots);
    return newLot;
  }

  async generateSerials(lotId: string, count: number): Promise<string[]> {
    const lots = this.loadLots();
    const lot = lots.find(l => l.id === lotId);
    if (!lot) throw new Error("Lot not found");
    
    const prefix = lot.prefix || 'S';
    const start = lot.serialRangeStart || 1;
    const newSerials = Array.from({length: count}).map((_, i) => `${prefix}${start + i}`);
    lot.serials = Array.from(new Set([...lot.serials, ...newSerials]));
    this.saveLots(lots);
    return newSerials;
  }

  async bindCell(scan: Partial<ScanEvent>): Promise<ScanEvent> {
    const scans = this.loadScans();
    const newScan: ScanEvent = {
      id: `scan-${Date.now()}`,
      serial: scan.serial || '',
      targetType: scan.targetType || 'Module',
      targetId: scan.targetId || '',
      batterySerial: scan.batterySerial,
      timestamp: new Date().toISOString(),
      actor: scan.actor || 'Operator',
      stationId: scan.stationId || 'ST-SCAN-01',
      outcome: 'PASS'
    };
    scans.push(newScan);
    this.saveScans(scans);
    return newScan;
  }

  async getLineage(batterySerial: string): Promise<ScanEvent[]> {
    return this.loadScans().filter(s => s.batterySerial === batterySerial);
  }

  async getAudit(): Promise<ScanEvent[]> {
    return this.loadScans().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const cellLotService = new CellLotService();