
import { safeStorage } from '../utils/safeStorage';

export interface SkuRules {
  minCells: number;
  maxCells: number;
  allowedChemistry: string[];
  requiredScans: string[];
}

export interface Sku {
  id: string;
  skuCode: string;
  skuName: string;
  version: string;
  chemistry: 'LFP' | 'NMC' | 'LTO' | 'Na-Ion';
  formFactor: 'Cylindrical' | 'Prismatic' | 'Pouch';
  seriesCount: number;
  parallelCount: number;
  nominalVoltage: number;
  capacityAh: number;
  bmsType: string;
  firmwareFamily: string;
  moduleStructure: string;
  packStructure: string;
  rules: SkuRules;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  createdAt: string;
  updatedAt: string;
  parentSkuId?: string;
  requiredModules: number; // Patch F addition
}

class SkuService {
  private STORAGE_KEY = 'aayatana_skus_v1';

  private load(): Sku[] {
    const data = safeStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      return this.ensureSeedData();
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse SKU data from storage', e);
      return this.ensureSeedData();
    }
  }

  private ensureSeedData(): Sku[] {
    const seed: Sku[] = [
      {
        id: 'sku-1',
        skuCode: 'VV360-LFP-48V',
        skuName: 'Vanguard V360 Standard',
        version: '1.0.0',
        chemistry: 'LFP',
        formFactor: 'Prismatic',
        seriesCount: 16,
        parallelCount: 1,
        nominalVoltage: 48,
        capacityAh: 100,
        bmsType: 'Aayatana-BMS-G3',
        firmwareFamily: 'VAN-G3-FW',
        moduleStructure: '1x16',
        packStructure: '1P16S',
        requiredModules: 1,
        rules: {
          minCells: 16,
          maxCells: 16,
          allowedChemistry: ['LFP'],
          requiredScans: ['CELL_VOLTAGE', 'CELL_SERIAL']
        },
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sku-2',
        skuCode: 'EE720-NMC-72V',
        skuName: 'E-Elite 720 Performance',
        version: '1.2.0',
        chemistry: 'NMC',
        formFactor: 'Cylindrical',
        seriesCount: 20,
        parallelCount: 4,
        nominalVoltage: 72,
        capacityAh: 200,
        bmsType: 'E-Performance-BMS',
        firmwareFamily: 'ELITE-FW',
        moduleStructure: '4x5',
        packStructure: '4P20S',
        requiredModules: 2,
        rules: {
          minCells: 80,
          maxCells: 80,
          allowedChemistry: ['NMC'],
          requiredScans: ['CELL_SERIAL', 'BUSBAR_WELD_CHECK']
        },
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sku-3',
        skuCode: 'NA-STATIONARY-G1',
        skuName: 'Sodium-Ion Storage G1',
        version: '0.9.0',
        chemistry: 'Na-Ion',
        formFactor: 'Pouch',
        seriesCount: 12,
        parallelCount: 2,
        nominalVoltage: 36,
        capacityAh: 150,
        bmsType: 'Standard-BMS',
        firmwareFamily: 'NA-IO-FW',
        moduleStructure: '2x6',
        packStructure: '2P12S',
        requiredModules: 1,
        rules: {
          minCells: 24,
          maxCells: 24,
          allowedChemistry: ['Na-Ion'],
          requiredScans: ['CELL_VOLTAGE']
        },
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.save(seed);
    return seed;
  }

  private save(skus: Sku[]) {
    safeStorage.setItem(this.STORAGE_KEY, JSON.stringify(skus));
  }

  async listSkus(): Promise<Sku[]> {
    return this.load();
  }

  async getSku(id: string): Promise<Sku | undefined> {
    return this.load().find(s => s.id === id);
  }

  async getVersions(skuCode: string): Promise<Sku[]> {
    return this.load().filter(s => s.skuCode === skuCode).sort((a, b) => b.version.localeCompare(a.version));
  }

  async createSku(sku: Partial<Sku>): Promise<Sku> {
    const skus = this.load();
    const newSku: Sku = {
      id: `sku-${Date.now()}`,
      skuCode: sku.skuCode || 'NEW-SKU',
      skuName: sku.skuName || 'New SKU',
      version: sku.version || '1.0.0',
      chemistry: sku.chemistry || 'LFP',
      formFactor: sku.formFactor || 'Prismatic',
      seriesCount: sku.seriesCount || 1,
      parallelCount: sku.parallelCount || 1,
      nominalVoltage: sku.nominalVoltage || 0,
      capacityAh: sku.capacityAh || 0,
      bmsType: sku.bmsType || 'Standard',
      firmwareFamily: sku.firmwareFamily || 'Default',
      moduleStructure: sku.moduleStructure || '1x1',
      packStructure: sku.packStructure || '1x1',
      requiredModules: sku.requiredModules || 1,
      rules: sku.rules || { minCells: 0, maxCells: 0, allowedChemistry: [], requiredScans: [] },
      status: sku.status || 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...sku
    };
    skus.push(newSku);
    this.save(skus);
    return newSku;
  }

  async cloneSku(id: string): Promise<Sku> {
    const skus = this.load();
    const original = skus.find(s => s.id === id);
    if (!original) throw new Error("Original SKU not found");

    const versionParts = original.version.split('.').map(Number);
    versionParts[2]++; // Increment patch version
    const newVersion = versionParts.join('.');

    const cloned: Sku = {
      ...original,
      id: `sku-${Date.now()}`,
      version: newVersion,
      status: 'DRAFT',
      parentSkuId: original.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    skus.push(cloned);
    this.save(skus);
    return cloned;
  }

  async updateSku(id: string, patch: Partial<Sku>): Promise<Sku> {
    const skus = this.load();
    const idx = skus.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("SKU not found");

    skus[idx] = { ...skus[idx], ...patch, updatedAt: new Date().toISOString() };
    this.save(skus);
    return skus[idx];
  }
}

export const skuService = new SkuService();
