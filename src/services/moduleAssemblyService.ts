import { safeStorage } from '../utils/safeStorage';
import { ModuleInstance, ModuleStatus, CellBindingRecord, ExceptionRecord } from '../domain/types';
import { cellTraceabilityService } from './cellTraceabilityService';
import { skuService } from './skuService';

class ModuleAssemblyService {
  private MOD_STORAGE_KEY = 'aayatana_modules_v1';
  private BIND_STORAGE_KEY = 'aayatana_cell_bindings_v1';
  private EXC_STORAGE_KEY = 'aayatana_assembly_exceptions_v1';
  private EVENT_STORAGE_KEY = 'aayatana_lineage_events_v1';

  private loadModules(): ModuleInstance[] {
    const data = safeStorage.getItem(this.MOD_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveModules(modules: ModuleInstance[]) {
    safeStorage.setItem(this.MOD_STORAGE_KEY, JSON.stringify(modules));
  }

  private loadBindings(): CellBindingRecord[] {
    const data = safeStorage.getItem(this.BIND_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveBindings(bindings: CellBindingRecord[]) {
    safeStorage.setItem(this.BIND_STORAGE_KEY, JSON.stringify(bindings));
  }

  private loadEvents(): any[] {
    const data = safeStorage.getItem(this.EVENT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveEvents(events: any[]) {
    safeStorage.setItem(this.EVENT_STORAGE_KEY, JSON.stringify(events));
  }

  private logEvent(assetId: string, type: string, message: string, actor: string) {
    const events = this.loadEvents();
    events.push({
      id: `EVT-${Date.now()}`,
      assetId,
      type,
      message,
      actor,
      timestamp: new Date().toISOString()
    });
    this.saveEvents(events);
  }

  async getModule(id: string): Promise<ModuleInstance | undefined> {
    return this.loadModules().find(m => m.id === id);
  }

  async listModules(): Promise<ModuleInstance[]> {
    return this.loadModules().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateModule(id: string, patch: Partial<ModuleInstance>): Promise<ModuleInstance> {
    const modules = this.loadModules();
    const idx = modules.findIndex(m => m.id === id);
    if (idx === -1) throw new Error("Module not found");
    modules[idx] = { ...modules[idx], ...patch, updatedAt: new Date().toISOString() };
    this.saveModules(modules);
    return modules[idx];
  }

  /**
   * Bulk Create Modules for a Batch
   */
  async createBatchModules(batchId: string, skuId: string, skuCode: string, count: number, targetCells: number, actor: string): Promise<ModuleInstance[]> {
    const modules = this.loadModules();
    const newModules: ModuleInstance[] = [];
    const now = new Date().toISOString();

    for (let i = 1; i <= count; i++) {
        const id = `MOD-${batchId}-${String(i).padStart(3, '0')}`;
        const newMod: ModuleInstance = {
            id,
            batchId,
            skuId,
            skuCode,
            targetCells,
            boundCellSerials: [],
            status: ModuleStatus.IN_PROGRESS,
            createdBy: actor,
            createdAt: now,
            updatedAt: now
        };
        newModules.push(newMod);
    }

    this.saveModules([...newModules, ...modules]);
    newModules.forEach(m => this.logEvent(m.id, 'MODULE_CREATED', `Module initialized via Batch ${batchId}`, actor));
    return newModules;
  }

  async bindCellToModule(moduleId: string, serial: string, actor: string, isSuper: boolean = false): Promise<CellBindingRecord> {
    const module = await this.getModule(moduleId);
    if (!module) throw new Error("Module work order not found.");
    if (module.status === ModuleStatus.SEALED && !isSuper) throw new Error("Module is sealed. Cannot bind more cells.");
    if (module.boundCellSerials.length >= module.targetCells && !isSuper) throw new Error("Target cell count reached.");

    const lookup = await cellTraceabilityService.findSerialGlobal(serial);
    if (!lookup) throw new Error(`Serial ${serial} not found in any lot.`);
    const { serial: record, lot } = lookup;

    if (record.status === 'BOUND') throw new Error(`Serial ${serial} is already bound to another module/pack.`);
    const sku = await skuService.getSku(module.skuId);
    if (sku && lot.chemistry !== sku.chemistry && !isSuper) {
        throw new Error(`Chemistry mismatch! Lot is ${lot.chemistry}, SKU requires ${sku.chemistry}.`);
    }

    const newBinding: CellBindingRecord = {
      moduleId,
      serial,
      lotId: lot.id,
      lotCode: lot.lotCode,
      boundAt: new Date().toISOString(),
      actor,
      chemistry: lot.chemistry
    };

    const bindings = this.loadBindings();
    bindings.push(newBinding);
    this.saveBindings(bindings);

    await this.updateModule(moduleId, {
      boundCellSerials: [...module.boundCellSerials, serial],
      status: ModuleStatus.IN_PROGRESS,
      actor
    });

    await cellTraceabilityService.updateSerialStatus(lot.id, serial, 'BOUND', actor);
    this.logEvent(moduleId, 'CELL_BOUND', `Cell ${serial} bound to module ${moduleId}`, actor);
    this.logEvent(serial, 'BOUND_TO_MODULE', `Cell bound to module ${moduleId}`, actor);

    return newBinding;
  }

  async unbindCellFromModule(moduleId: string, serial: string, actor: string, isSuper: boolean = false): Promise<void> {
    const module = await this.getModule(moduleId);
    if (!module) return;
    if (module.status === ModuleStatus.SEALED && !isSuper) throw new Error("Module is sealed.");

    const bindings = this.loadBindings();
    const filtered = bindings.filter(b => !(b.moduleId === moduleId && b.serial === serial));
    this.saveBindings(filtered);

    const lookup = await cellTraceabilityService.findSerialGlobal(serial);
    if (lookup) {
        await cellTraceabilityService.updateSerialStatus(lookup.lot.id, serial, 'SCANNED', actor);
    }

    await this.updateModule(moduleId, {
      boundCellSerials: module.boundCellSerials.filter(s => s !== serial),
      actor
    });

    this.logEvent(moduleId, 'CELL_UNBOUND', `Cell ${serial} removed from module ${moduleId}`, actor);
    this.logEvent(serial, 'UNBOUND', `Cell removed from module ${moduleId}`, actor);
  }

  async sealModule(moduleId: string, actor: string): Promise<ModuleInstance> {
    const module = await this.getModule(moduleId);
    if (!module) throw new Error("Module not found.");
    if (module.boundCellSerials.length !== module.targetCells) {
        throw new Error(`Cannot seal: Bound count (${module.boundCellSerials.length}) does not match target (${module.targetCells}).`);
    }

    const updated = await this.updateModule(moduleId, { status: ModuleStatus.SEALED, actor });
    this.logEvent(moduleId, 'MODULE_SEALED', `Module assembly completed and sealed.`, actor);
    return updated;
  }

  async listBindingsByModule(moduleId: string): Promise<CellBindingRecord[]> {
    return this.loadBindings().filter(b => b.moduleId === moduleId);
  }

  async listBindingsBySerial(serial: string): Promise<CellBindingRecord[]> {
    return this.loadBindings().filter(b => b.serial === serial);
  }

  async getLineageEvents(assetId: string): Promise<any[]> {
    return this.loadEvents().filter(e => e.assetId === assetId);
  }

  async raiseException(entityId: string, entityType: 'module' | 'pack', message: string, severity: any, actor: string): Promise<ExceptionRecord> {
    const data = safeStorage.getItem(this.EXC_STORAGE_KEY);
    const exceptions = data ? JSON.parse(data) : [];
    const newEx: ExceptionRecord = {
      id: `EXC-${Date.now()}`,
      entityType,
      entityId,
      severity,
      message,
      createdAt: new Date().toISOString(),
      actor
    };
    exceptions.push(newEx);
    safeStorage.setItem(this.EXC_STORAGE_KEY, JSON.stringify(exceptions));
    this.logEvent(entityId, 'EXCEPTION_RAISED', message, actor);
    return newEx;
  }
}

export const moduleAssemblyService = new ModuleAssemblyService();