import { safeStorage } from '../utils/safeStorage';

export type CellLotStatus = 'DRAFT' | 'SERIALIZED' | 'PUBLISHED' | 'CONSUMED_PARTIAL' | 'CLOSED';
export type CellSerialStatus = 'AVAILABLE' | 'SCANNED' | 'QUARANTINED';

export interface CellLot {
  id: string;
  lotCode: string;
  supplierName: string;
  supplierLotNo: string;
  chemistry: string;
  formFactor: string;
  capacityAh: number;
  receivedDate: string;
  quantityReceived: number;
  serialPolicy: {
    prefix: string;
    scheme: 'SEQUENTIAL' | 'ALPHANUMERIC';
  };
  status: CellLotStatus;
  notes: string;
  updatedAt: string;
}

export interface CellSerial {
  serial: string;
  lotId: string;
  status: CellSerialStatus;
  boundTo?: {
    kind: "MODULE" | "PACK";
    refId: string;
    station: string;
  };
  scannedAt?: string;
  scannedBy?: string;
}

class CellService {
  private LOT_STORAGE_KEY = 'aayatana_cell_lots_v1';
  private SERIAL_STORAGE_KEY = 'aayatana_cell_serials_v1';

  private loadLots(): CellLot[] {
    const data = safeStorage.getItem(this.LOT_STORAGE_KEY);
    if (!data) return this.ensureSeedData();
    try {
      return JSON.parse(data);
    } catch (e) {
      return this.ensureSeedData();
    }
  }

  private loadSerials(): CellSerial[] {
    const data = safeStorage.getItem(this.SERIAL_STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  private saveLots(lots: CellLot[]) {
    safeStorage.setItem(this.LOT_STORAGE_KEY, JSON.stringify(lots));
  }

  private saveSerials(serials: CellSerial[]) {
    safeStorage.setItem(this.SERIAL_STORAGE_KEY, JSON.stringify(serials));
  }

  private ensureSeedData(): CellLot[] {
    const seed: CellLot[] = [{
      id: 'clot-1',
      lotCode: 'CATL-LFP-100-MAY24',
      supplierName: 'CATL',
      supplierLotNo: 'LFP-20240501-A',
      chemistry: 'LFP',
      formFactor: 'Prismatic',
      capacityAh: 100,
      receivedDate: '2024-05-01',
      quantityReceived: 1000,
      serialPolicy: { prefix: 'C100', scheme: 'SEQUENTIAL' },
      status: 'PUBLISHED',
      notes: 'Initial production batch for Vanguard V360.',
      updatedAt: new Date().toISOString()
    }];
    this.saveLots(seed);
    
    // Seed some serials for clot-1
    const serials: CellSerial[] = Array.from({ length: 50 }).map((_, i) => ({
        serial: `C100${1000 + i}`,
        lotId: 'clot-1',
        status: i < 5 ? 'SCANNED' : 'AVAILABLE',
        scannedAt: i < 5 ? new Date().toISOString() : undefined,
        scannedBy: i < 5 ? 'System Seed' : undefined
    }));
    this.saveSerials(serials);
    
    return seed;
  }

  async listLots(): Promise<CellLot[]> {
    return this.loadLots();
  }

  async getLot(id: string): Promise<CellLot | undefined> {
    return this.loadLots().find(l => l.id === id);
  }

  async createLot(data: Partial<CellLot>): Promise<CellLot> {
    const lots = this.loadLots();
    const newLot: CellLot = {
      id: `clot-${Date.now()}`,
      lotCode: data.lotCode || 'NEW-LOT',
      supplierName: data.supplierName || '',
      supplierLotNo: data.supplierLotNo || '',
      chemistry: data.chemistry || 'LFP',
      formFactor: data.formFactor || 'Prismatic',
      capacityAh: data.capacityAh || 0,
      receivedDate: data.receivedDate || new Date().toISOString().split('T')[0],
      quantityReceived: data.quantityReceived || 0,
      serialPolicy: data.serialPolicy || { prefix: 'S', scheme: 'SEQUENTIAL' },
      status: 'DRAFT',
      notes: data.notes || '',
      updatedAt: new Date().toISOString()
    };
    lots.unshift(newLot);
    this.saveLots(lots);
    return newLot;
  }

  async updateLot(id: string, patch: Partial<CellLot>): Promise<CellLot> {
    const lots = this.loadLots();
    const idx = lots.findIndex(l => l.id === id);
    if (idx === -1) throw new Error("Lot not found");
    lots[idx] = { ...lots[idx], ...patch, updatedAt: new Date().toISOString() };
    this.saveLots(lots);
    return lots[idx];
  }

  async generateSerials(lotId: string, count: number, prefix: string): Promise<void> {
    const lots = this.loadLots();
    const lot = lots.find(l => l.id === lotId);
    if (!lot) throw new Error("Lot not found");

    const serials = this.loadSerials();
    const newSerials: CellSerial[] = Array.from({ length: count }).map((_, i) => ({
      serial: `${prefix}${1000 + i}`,
      lotId: lotId,
      status: 'AVAILABLE'
    }));

    this.saveSerials([...serials, ...newSerials]);
    await this.updateLot(lotId, { status: 'SERIALIZED' });
  }

  async publishLot(lotId: string): Promise<void> {
    await this.updateLot(lotId, { status: 'PUBLISHED' });
  }

  async listSerials(lotId: string): Promise<CellSerial[]> {
    return this.loadSerials().filter(s => s.lotId === lotId);
  }

  async scanSerial(lotId: string, serialCode: string, info: { station: string, actor: string, bindKind: "MODULE" | "PACK" }): Promise<CellSerial> {
    const serials = this.loadSerials();
    const idx = serials.findIndex(s => s.serial === serialCode && s.lotId === lotId);
    if (idx === -1) throw new Error("Serial not found in this lot.");
    if (serials[idx].status === 'SCANNED') throw new Error("Serial already scanned and bound.");

    serials[idx] = {
      ...serials[idx],
      status: 'SCANNED',
      scannedAt: new Date().toISOString(),
      scannedBy: info.actor,
      boundTo: {
        kind: info.bindKind,
        refId: `REF-${Math.random().toString(36).substring(7).toUpperCase()}`,
        station: info.station
      }
    };

    this.saveSerials(serials);
    return serials[idx];
  }
}

export const cellService = new CellService();