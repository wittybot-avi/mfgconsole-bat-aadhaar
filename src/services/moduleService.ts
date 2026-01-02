
import { safeStorage } from '../utils/safeStorage';
import { ModuleInstance, ModuleStatus } from '../domain/types';

class ModuleService {
  private STORAGE_KEY = 'aayatana_modules_v1';

  private load(): ModuleInstance[] {
    const data = safeStorage.getItem(this.STORAGE_KEY);
    if (!data) return this.ensureSeedData();
    try {
      return JSON.parse(data);
    } catch (e) {
      return this.ensureSeedData();
    }
  }

  private save(modules: ModuleInstance[]) {
    safeStorage.setItem(this.STORAGE_KEY, JSON.stringify(modules));
  }

  private ensureSeedData(): ModuleInstance[] {
    const seed: ModuleInstance[] = [
      {
        id: 'MOD-2024-0001',
        skuId: 'sku-1',
        skuCode: 'VV360-LFP-48V',
        targetCells: 16,
        boundCellSerials: ['C1001', 'C1002', 'C1003', 'C1004'],
        status: ModuleStatus.IN_PROGRESS,
        createdBy: 'Bob Operator',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'MOD-2024-0002',
        skuId: 'sku-1',
        skuCode: 'VV360-LFP-48V',
        targetCells: 16,
        boundCellSerials: Array.from({length: 16}).map((_, i) => `C100${10 + i}`),
        status: ModuleStatus.SEALED,
        createdBy: 'Bob Operator',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    this.save(seed);
    return seed;
  }

  async listModules(): Promise<ModuleInstance[]> {
    return this.load().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getModule(id: string): Promise<ModuleInstance | undefined> {
    return this.load().find(m => m.id === id);
  }

  async createModule(data: Partial<ModuleInstance>): Promise<ModuleInstance> {
    const modules = this.load();
    const newModule: ModuleInstance = {
      id: `MOD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      skuId: data.skuId || '',
      skuCode: data.skuCode || '',
      targetCells: data.targetCells || 0,
      boundCellSerials: [],
      status: ModuleStatus.DRAFT,
      createdBy: data.createdBy || 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    modules.unshift(newModule);
    this.save(modules);
    return newModule;
  }

  async updateModule(id: string, patch: Partial<ModuleInstance>): Promise<ModuleInstance> {
    const modules = this.load();
    const idx = modules.findIndex(m => m.id === id);
    if (idx === -1) throw new Error("Module not found");
    
    modules[idx] = { 
      ...modules[idx], 
      ...patch, 
      updatedAt: new Date().toISOString() 
    };
    this.save(modules);
    return modules[idx];
  }

  async sealModule(id: string): Promise<ModuleInstance> {
    const mod = await this.getModule(id);
    if (!mod) throw new Error("Not found");
    if (mod.boundCellSerials.length !== mod.targetCells) {
      throw new Error(`Cannot seal: Bound ${mod.boundCellSerials.length} cells, target is ${mod.targetCells}`);
    }
    return this.updateModule(id, { status: ModuleStatus.SEALED });
  }

  async deleteModule(id: string): Promise<void> {
    const modules = this.load();
    const filtered = modules.filter(m => m.id !== id);
    this.save(filtered);
  }
}

export const moduleService = new ModuleService();
