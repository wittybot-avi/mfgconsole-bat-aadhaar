
import { safeStorage } from '../utils/safeStorage';
import { PackInstance, PackStatus, BatteryStatus } from '../domain/types';
import { moduleService } from './moduleService';

class PackService {
  private STORAGE_KEY = 'aayatana_packs_v1';

  private load(): PackInstance[] {
    const data = safeStorage.getItem(this.STORAGE_KEY);
    if (!data) return this.ensureSeedData();
    try {
      return JSON.parse(data);
    } catch (e) {
      return this.ensureSeedData();
    }
  }

  private save(packs: PackInstance[]) {
    safeStorage.setItem(this.STORAGE_KEY, JSON.stringify(packs));
  }

  private ensureSeedData(): PackInstance[] {
    const seed: PackInstance[] = [
      {
        id: 'PACK-2024-0001',
        skuId: 'sku-1',
        skuCode: 'VV360-LFP-48V',
        moduleIds: ['MOD-2024-0002'],
        status: PackStatus.DRAFT,
        packSerial: '',
        bmsSerial: '',
        firmwareVersion: 'v2.0.1',
        qcStatus: 'PENDING',
        createdBy: 'Alice Supervisor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.save(seed);
    return seed;
  }

  async listPacks(): Promise<PackInstance[]> {
    return this.load().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getPack(id: string): Promise<PackInstance | undefined> {
    return this.load().find(p => p.id === id);
  }

  async createPack(data: Partial<PackInstance>): Promise<PackInstance> {
    const packs = this.load();
    const newPack: PackInstance = {
      id: `PACK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      skuId: data.skuId || '',
      skuCode: data.skuCode || '',
      moduleIds: [],
      status: PackStatus.DRAFT,
      packSerial: '',
      bmsSerial: '',
      firmwareVersion: '',
      qcStatus: 'PENDING',
      createdBy: data.createdBy || 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    packs.unshift(newPack);
    this.save(packs);
    return newPack;
  }

  async updatePack(id: string, patch: Partial<PackInstance>): Promise<PackInstance> {
    const packs = this.load();
    const idx = packs.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Pack not found");
    
    packs[idx] = { 
      ...packs[idx], 
      ...patch, 
      updatedAt: new Date().toISOString() 
    };
    this.save(packs);
    return packs[idx];
  }

  async finalizePack(id: string): Promise<PackInstance> {
    const pack = await this.getPack(id);
    if (!pack) throw new Error("Not found");
    
    // Validation placeholders
    if (pack.moduleIds.length === 0) throw new Error("No modules linked.");
    if (!pack.packSerial) throw new Error("Pack serial not generated.");
    if (!pack.bmsSerial) throw new Error("BMS serial required.");

    const updated = await this.updatePack(id, { status: PackStatus.FINALIZED });

    // Patch C - Side effect simulation
    // In a real app, this would call batteryService and inventoryService
    console.log(`[PATCH C SIDE EFFECT] Registering battery ${pack.packSerial} and updating inventory...`);
    
    return updated;
  }
}

export const packService = new PackService();
