
import { safeStorage } from '../utils/safeStorage';
import { CellLot, CellSerialRecord, CellLotStatus, CellSerialStatus } from '../domain/types';

class CellTraceabilityService {
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

  private loadSerials(lotId: string): CellSerialRecord[] {
    const data = safeStorage.getItem(`${this.SERIAL_STORAGE_KEY}_${lotId}`);
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

  private saveSerials(lotId: string, serials: CellSerialRecord[]) {
    safeStorage.setItem(`${this.SERIAL_STORAGE_KEY}_${lotId}`, JSON.stringify(serials));
  }

  private ensureSeedData(): CellLot[] {
    const seed: CellLot[] = [
      {
        id: 'clot-2024-001',
        lotCode: 'CATL-LFP-100-MAY24',
        supplierName: 'CATL',
        supplierLotNo: 'LOT-XP-9982',
        chemistry: 'LFP',
        formFactor: 'Prismatic',
        capacityAh: 100,
        receivedDate: '2024-05-10',
        quantityReceived: 500,
        status: 'READY_TO_BIND',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedCount: 50,
        scannedCount: 50,
        boundCount: 0
      }
    ];
    this.saveLots(seed);

    // Seed some serials for clot-2024-001
    const serials: CellSerialRecord[] = Array.from({ length: 50 }).map((_, i) => ({
      serial: `CATL-${String(1001 + i).padStart(4, '0')}`,
      lotId: 'clot-2024-001',
      status: 'SCANNED',
      generatedAt: new Date().toISOString(),
      scannedAt: new Date().toISOString(),
      actor: 'System Seed'
    }));
    this.saveSerials('clot-2024-001', serials);

    return seed;
  }

  async listLots(): Promise<CellLot[]> {
    return this.loadLots().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getLot(id: string): Promise<CellLot | undefined> {
    return this.loadLots().find(l => l.id === id);
  }

  async createLot(data: Partial<CellLot>): Promise<CellLot> {
    const lots = this.loadLots();
    const newLot: CellLot = {
      id: `clot-${Date.now()}`,
      lotCode: data.lotCode || 'NEW-LOT',
      supplierName: data.supplierName || 'Unknown',
      supplierLotNo: data.supplierLotNo || '-',
      chemistry: data.chemistry || 'LFP',
      formFactor: data.formFactor || 'Prismatic',
      capacityAh: data.capacityAh || 0,
      receivedDate: data.receivedDate || new Date().toISOString().split('T')[0],
      quantityReceived: data.quantityReceived || 0,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedCount: 0,
      scannedCount: 0,
      boundCount: 0
    };
    lots.unshift(newLot);
    this.saveLots(lots);
    return newLot;
  }

  /**
   * GLOBAL SERIAL LOOKUP
   * Searches across all lots for a specific serial number.
   */
  async findSerialGlobal(serial: string): Promise<{ serial: CellSerialRecord, lot: CellLot } | null> {
    const lots = this.loadLots();
    for (const lot of lots) {
      const serials = this.loadSerials(lot.id);
      const found = serials.find(s => s.serial === serial);
      if (found) {
        return { serial: found, lot };
      }
    }
    return null;
  }

  async updateSerialStatus(lotId: string, serial: string, status: CellSerialStatus, actor: string): Promise<void> {
    const serials = this.loadSerials(lotId);
    const idx = serials.findIndex(s => s.serial === serial);
    if (idx === -1) return;

    serials[idx].status = status;
    serials[idx].actor = actor;
    serials[idx].scannedAt = status === 'SCANNED' ? new Date().toISOString() : serials[idx].scannedAt;
    
    this.saveSerials(lotId, serials);

    // Update Lot stats
    const lots = this.loadLots();
    const lotIdx = lots.findIndex(l => l.id === lotId);
    if (lotIdx !== -1) {
      const allSerials = this.loadSerials(lotId);
      lots[lotIdx].scannedCount = allSerials.filter(s => s.status === 'SCANNED' || s.status === 'BOUND').length;
      lots[lotIdx].boundCount = allSerials.filter(s => s.status === 'BOUND').length;
      lots[lotIdx].updatedAt = new Date().toISOString();
      this.saveLots(lots);
    }
  }

  async generateSerials(lotId: string, params: { prefix: string, format: string, count: number, start: number }, actor: string): Promise<CellSerialRecord[]> {
    const lots = this.loadLots();
    const lotIdx = lots.findIndex(l => l.id === lotId);
    if (lotIdx === -1) throw new Error("Lot not found");

    const serials: CellSerialRecord[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < params.count; i++) {
      const seq = String(params.start + i).padStart(4, '0');
      const serial = `${params.prefix}-${seq}`;
      
      serials.push({
        serial,
        lotId,
        status: 'GENERATED',
        generatedAt: now,
        actor
      });
    }

    this.saveSerials(lotId, serials);

    lots[lotIdx].status = 'SERIALIZED';
    lots[lotIdx].generatedCount = params.count;
    lots[lotIdx].updatedAt = now;
    this.saveLots(lots);

    return serials;
  }

  async listSerials(lotId: string): Promise<CellSerialRecord[]> {
    return this.loadSerials(lotId);
  }

  async markExported(lotId: string, actor: string): Promise<void> {
    const lots = this.loadLots();
    const lotIdx = lots.findIndex(l => l.id === lotId);
    if (lotIdx === -1) return;

    const now = new Date().toISOString();
    const serials = this.loadSerials(lotId);
    
    serials.forEach(s => {
      if (!s.exportedAt) {
        s.exportedAt = now;
        s.actor = actor;
      }
    });

    this.saveSerials(lotId, serials);

    lots[lotIdx].status = 'EXPORTED';
    lots[lotIdx].updatedAt = now;
    this.saveLots(lots);
  }

  async scanSerial(lotId: string, serial: string, actor: string): Promise<CellSerialRecord> {
    const serials = this.loadSerials(lotId);
    const sIdx = serials.findIndex(s => s.serial === serial);
    
    if (sIdx === -1) throw new Error(`Serial ${serial} not found in this lot.`);
    if (serials[sIdx].status === 'SCANNED') throw new Error(`Serial ${serial} already scanned.`);
    if (serials[sIdx].status === 'BOUND') throw new Error(`Serial ${serial} already bound to an asset.`);

    const now = new Date().toISOString();
    serials[sIdx].status = 'SCANNED';
    serials[sIdx].scannedAt = now;
    serials[sIdx].actor = actor;

    this.saveSerials(lotId, serials);

    const lots = this.loadLots();
    const lotIdx = lots.findIndex(l => l.id === lotId);
    if (lotIdx !== -1) {
      lots[lotIdx].scannedCount = serials.filter(s => s.status === 'SCANNED' || s.status === 'BOUND').length;
      if (lots[lotIdx].status !== 'READY_TO_BIND' && lots[lotIdx].scannedCount === lots[lotIdx].generatedCount) {
        lots[lotIdx].status = 'READY_TO_BIND';
      } else if (lots[lotIdx].status !== 'SCANNED' && lots[lotIdx].scannedCount > 0) {
        lots[lotIdx].status = 'SCANNED';
      }
      lots[lotIdx].updatedAt = now;
      this.saveLots(lots);
    }

    return serials[sIdx];
  }

  async bulkMarkScanned(lotId: string, actor: string): Promise<void> {
    const serials = this.loadSerials(lotId);
    const now = new Date().toISOString();
    
    serials.forEach(s => {
      if (s.status === 'GENERATED') {
        s.status = 'SCANNED';
        s.scannedAt = now;
        s.actor = actor;
      }
    });

    this.saveSerials(lotId, serials);

    const lots = this.loadLots();
    const lotIdx = lots.findIndex(l => l.id === lotId);
    if (lotIdx !== -1) {
      lots[lotIdx].scannedCount = serials.length;
      lots[lotIdx].status = 'READY_TO_BIND';
      lots[lotIdx].updatedAt = now;
      this.saveLots(lots);
    }
  }
}

export const cellTraceabilityService = new CellTraceabilityService();
