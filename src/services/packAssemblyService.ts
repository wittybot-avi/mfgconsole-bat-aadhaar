
import { safeStorage } from '../utils/safeStorage';
import { PackInstance, PackStatus, ModuleInstance, ModuleStatus, DeviceBinding } from '../domain/types';
import { moduleAssemblyService } from './moduleAssemblyService';
import { skuService } from './skuService';

class PackAssemblyService {
  private PACK_STORAGE_KEY = 'aayatana_packs_v1';
  private DEVICE_BIND_KEY = 'aayatana_device_bindings_v1';
  private EVENT_STORAGE_KEY = 'aayatana_lineage_events_v1';

  private loadPacks(): PackInstance[] {
    const data = safeStorage.getItem(this.PACK_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private savePacks(packs: PackInstance[]) {
    safeStorage.setItem(this.PACK_STORAGE_KEY, JSON.stringify(packs));
  }

  private loadDeviceBindings(): DeviceBinding[] {
    const data = safeStorage.getItem(this.DEVICE_BIND_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveDeviceBindings(bindings: DeviceBinding[]) {
    safeStorage.setItem(this.DEVICE_BIND_KEY, JSON.stringify(bindings));
  }

  private logEvent(assetId: string, type: string, message: string, actor: string) {
    const data = safeStorage.getItem(this.EVENT_STORAGE_KEY);
    const events = data ? JSON.parse(data) : [];
    events.push({
      id: `EVT-${Date.now()}`,
      assetId,
      type,
      message,
      actor,
      timestamp: new Date().toISOString()
    });
    safeStorage.setItem(this.EVENT_STORAGE_KEY, JSON.stringify(events));
  }

  async getPack(id: string): Promise<PackInstance | undefined> {
    return this.loadPacks().find(p => p.id === id);
  }

  async listPacks(): Promise<PackInstance[]> {
    return this.loadPacks().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updatePack(id: string, patch: Partial<PackInstance>): Promise<PackInstance> {
    const packs = this.loadPacks();
    const idx = packs.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Pack not found");
    
    packs[idx] = { 
      ...packs[idx], 
      ...patch, 
      updatedAt: new Date().toISOString() 
    };
    this.savePacks(packs);
    return packs[idx];
  }

  // Added missing method to fix pack build linkage error
  async listEligibleModulesForPack(skuId: string): Promise<ModuleInstance[]> {
    const modules = await moduleAssemblyService.listModules();
    return modules.filter(m => m.skuId === skuId && m.status === ModuleStatus.SEALED);
  }

  async createPackBuild(skuCode: string, actor: string): Promise<PackInstance> {
    const skus = await skuService.listSkus();
    const sku = skus.find(s => s.skuCode === skuCode);
    if (!sku) throw new Error("SKU not found.");

    const packs = this.loadPacks();
    const newPack: PackInstance = {
      id: `PB-${Date.now().toString().slice(-6)}`,
      skuId: sku.id,
      skuCode: sku.skuCode,
      requiredModules: sku.requiredModules || 1,
      moduleIds: [],
      status: PackStatus.DRAFT,
      packSerial: '',
      bmsSerial: '',
      firmwareVersion: '',
      qcStatus: 'PENDING',
      createdBy: actor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    packs.unshift(newPack);
    this.savePacks(packs);
    this.logEvent(newPack.id, 'PACK_CREATED', `Pack build initialized for SKU ${skuCode}`, actor);
    return newPack;
  }

  async linkModuleToPack(packId: string, moduleId: string, actor: string, isSuper: boolean = false): Promise<void> {
    const pack = await this.getPack(packId);
    if (!pack) throw new Error("Pack build not found.");
    if (pack.status === PackStatus.READY_FOR_EOL && !isSuper) throw new Error("Pack build is locked.");
    if (pack.moduleIds.length >= (pack.requiredModules || 1) && !isSuper) throw new Error("Required module count reached.");

    const module = await moduleAssemblyService.getModule(moduleId);
    if (!module) throw new Error("Module not found.");
    
    // Validations
    if (module.status !== ModuleStatus.SEALED && !isSuper) throw new Error("Module must be SEALED to link.");
    if (module.skuId !== pack.skuId && !isSuper) throw new Error("SKU mismatch between Pack and Module.");

    // Link
    const updatedModuleIds = [...pack.moduleIds, moduleId];
    await this.updatePack(packId, { 
        moduleIds: updatedModuleIds, 
        status: PackStatus.IN_PROGRESS 
    });

    // Update Module Status to CONSUMED
    await moduleAssemblyService.updateModule(moduleId, { status: ModuleStatus.CONSUMED, actor: `Linked to ${packId}` });

    this.logEvent(packId, 'MODULE_LINKED', `Module ${moduleId} linked to pack build.`, actor);
    this.logEvent(moduleId, 'LINKED_TO_PACK', `Module linked to pack ${packId}.`, actor);
  }

  async unlinkModuleFromPack(packId: string, moduleId: string, actor: string, isSuper: boolean = false): Promise<void> {
    const pack = await this.getPack(packId);
    if (!pack) return;
    if (pack.status === PackStatus.READY_FOR_EOL && !isSuper) throw new Error("Pack is locked.");

    const updatedModuleIds = pack.moduleIds.filter(id => id !== moduleId);
    await this.updatePack(packId, { moduleIds: updatedModuleIds });

    // Reset Module Status to SEALED
    await moduleAssemblyService.updateModule(moduleId, { status: ModuleStatus.SEALED, actor: `Unlinked from ${packId}` });

    this.logEvent(packId, 'MODULE_UNLINKED', `Module ${moduleId} removed from pack build.`, actor);
    this.logEvent(moduleId, 'UNLINKED_FROM_PACK', `Module unlinked from pack ${packId}.`, actor);
  }

  async generatePackSerial(packId: string): Promise<string> {
    const pack = await this.getPack(packId);
    if (!pack) throw new Error("Pack not found.");
    
    const serial = `SN-${pack.skuCode}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000)}`;
    await this.updatePack(packId, { packSerial: serial });
    this.logEvent(packId, 'SERIAL_GENERATED', `Pack serial assigned: ${serial}`, 'System');
    return serial;
  }

  async bindDeviceToPack(packId: string, deviceId: string, actor: string): Promise<void> {
    const bindings = this.loadDeviceBindings();
    if (bindings.some(b => b.deviceId === deviceId && b.entityId !== packId)) {
        throw new Error(`Device ${deviceId} is already bound to another entity.`);
    }

    const newBind: DeviceBinding = {
        entityType: 'PACK',
        entityId: packId,
        deviceType: 'BMS',
        deviceId,
        boundAt: new Date().toISOString(),
        actor
    };
    
    bindings.push(newBind);
    this.saveDeviceBindings(bindings);

    await this.updatePack(packId, { bmsId: deviceId });
    this.logEvent(packId, 'BMS_BOUND', `BMS device ${deviceId} bound to pack.`, actor);
  }

  async markPackReadyForEOL(packId: string, actor: string): Promise<void> {
    const pack = await this.getPack(packId);
    if (!pack) throw new Error("Pack not found.");
    if (pack.moduleIds.length !== (pack.requiredModules || 1)) throw new Error("Module count mismatch.");
    if (!pack.packSerial) throw new Error("Pack Serial missing.");
    if (pack.qcStatus !== 'PASSED') throw new Error("Pack must pass assembly QC before EOL handover.");

    await this.updatePack(packId, { status: PackStatus.READY_FOR_EOL });
    this.logEvent(packId, 'RELEASED_TO_EOL', `Pack build finalized and released to EOL testing queue.`, actor);
  }
}

export const packAssemblyService = new PackAssemblyService();
