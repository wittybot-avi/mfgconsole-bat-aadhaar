
import { Batch, BatchStatus, Battery, BatteryStatus, InventoryStatus, KPIData, MovementOrder, RiskLevel, TelemetryPoint, SupplierLot, BatchNote, AssemblyEvent, ProvisioningLogEntry, EolMeasurements, QaDisposition, EolLogEntry, InventoryMovementEntry, DispatchOrder, DispatchStatus, CustodyStatus, CustodyEvent } from '../domain/types';

/**
 * SERVICE INTERFACES
 * ---------------------------------------------------------------------
 */

export interface IBatchService {
  getBatches(filters?: any): Promise<Batch[]>;
  getBatchById(id: string): Promise<Batch | undefined>;
  createBatch(batch: Partial<Batch>): Promise<Batch>;
  updateBatch(id: string, updates: Partial<Batch>): Promise<Batch>;
  
  // Workflow Actions
  requestHold(id: string, reason: string, user: string): Promise<Batch>;
  approveHold(id: string, reason: string, user: string): Promise<Batch>;
  requestRelease(id: string, reason: string, user: string): Promise<Batch>;
  approveRelease(id: string, reason: string, user: string): Promise<Batch>;
  
  requestCloseByProd(id: string, user: string): Promise<Batch>;
  approveCloseByQA(id: string, user: string): Promise<Batch>;
  forceClose(id: string, user: string): Promise<Batch>;
}

export interface IBatteryService {
  getBatteries(filter?: any): Promise<Battery[]>;
  getBatteryById(id: string): Promise<Battery | undefined>;
  getBatteryBySN(sn: string): Promise<Battery | undefined>;
  getBatteryTelemetry(id: string): Promise<TelemetryPoint[]>;
  
  // Lifecycle Actions
  registerBatteries(batchId: string, quantity: number, user: string): Promise<Battery[]>;
  addAssemblyEvent(id: string, event: Partial<AssemblyEvent>): Promise<Battery>;
  provisionBattery(id: string, data: { bmsUid: string, firmware: string, profile: string }): Promise<Battery>;
  uploadEOLResult(id: string, data: { soh: number, capacity: number, resistance: number, result: 'PASS'|'FAIL' }): Promise<Battery>;
  approveBattery(id: string, user: string): Promise<Battery>;
  dispatchBattery(id: string, location: string): Promise<Battery>;
  flagRework(id: string, notes: string, user: string): Promise<Battery>;
  updateCustody(id: string, status: CustodyStatus, event: Partial<CustodyEvent>): Promise<Battery>;
}

export interface IProvisioningService {
  bindBms(batteryId: string, bmsUid: string, operator: string): Promise<Battery>;
  flashFirmware(batteryId: string, firmwareVersion: string, operator: string): Promise<Battery>;
  triggerCalibration(batteryId: string, profile: string, operator: string): Promise<Battery>;
  injectSecurity(batteryId: string, operator: string): Promise<Battery>;
  runVerification(batteryId: string): Promise<{ handshake: boolean; telemetry: boolean; }>;
  finalizeProvisioning(batteryId: string, result: 'PASS'|'FAIL', operator: string, notes?: string): Promise<Battery>;
}

export interface IEolService {
  runEolTest(batteryId: string, operator: string): Promise<Battery>;
  setQaDisposition(batteryId: string, disposition: QaDisposition, reasonCode: string, notes: string, operator: string): Promise<Battery>;
  generateCertificate(batteryId: string, operator: string): Promise<Battery>;
  finalizeQA(batteryId: string, operator: string): Promise<Battery>;
}

export interface IInventoryService {
  getInventory(filters?: any): Promise<Battery[]>;
  putAwayBattery(batteryId: string, location: string, operator: string): Promise<Battery>;
  moveBattery(batteryId: string, newLocation: string, operator: string): Promise<Battery>;
  reserveBattery(batteryId: string, operator: string): Promise<Battery>;
  quarantineBattery(batteryId: string, reason: string, notes: string, operator: string): Promise<Battery>;
  releaseQuarantine(batteryId: string, operator: string): Promise<Battery>;
}

export interface IDispatchService {
  getOrders(filters?: any): Promise<DispatchOrder[]>;
  getOrderById(id: string): Promise<DispatchOrder | undefined>;
  createOrder(data: Partial<DispatchOrder>, operator: string): Promise<DispatchOrder>;
  updateOrder(id: string, data: Partial<DispatchOrder>, operator: string): Promise<DispatchOrder>;
  addBatteries(orderId: string, batteryIds: string[], operator: string): Promise<DispatchOrder>;
  removeBattery(orderId: string, batteryId: string, operator: string): Promise<DispatchOrder>;
  generateDocument(orderId: string, type: 'packing' | 'manifest' | 'invoice', operator: string): Promise<DispatchOrder>;
  markReady(orderId: string, operator: string): Promise<DispatchOrder>;
  markDispatched(orderId: string, operator: string): Promise<DispatchOrder>;
  cancelOrder(orderId: string, operator: string): Promise<DispatchOrder>;
}

export interface IDashboardService {
  getKPIs(): Promise<KPIData>;
  getRecentAlerts(): Promise<any[]>;
}

/**
 * MOCK DATA GENERATORS
 * ---------------------------------------------------------------------
 */
const generateBatches = (count: number): Batch[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `batch-${i + 1}`,
    batchNumber: `B-${2024000 + i}`,
    plantId: 'PLANT-01',
    lineId: i % 2 === 0 ? 'L1' : 'L2',
    shiftId: 'SHIFT-A',
    supervisorId: 'USER-101',
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    
    sku: i % 2 === 0 ? 'VV360-LFP-48V' : 'EE360-NMC-72V',
    packModelId: i % 2 === 0 ? 'VV360' : 'EE360',
    packVariant: 'Std',
    chemistry: i % 2 === 0 ? 'LFP' : 'NMC',
    seriesCount: 16,
    parallelCount: 2,
    nominalVoltageV: 48,
    capacityAh: 100,
    energyWh: 4800,
    targetQuantity: 100 + (i * 10),
    customerProgram: 'OEM-X',
    
    bomVersion: 'v1.2',
    cellSpec: 'CATL-100Ah',
    bmsSpec: 'Aayatana-BMS-v3',
    mechanicalsSpec: 'Alu-Case-Gen2',
    
    supplierLots: [
      { id: `lot-${i}-1`, lotType: 'Cell', supplierName: 'CATL', supplierLotId: `C-${i}99`, receivedDate: '2024-01-01', qtyConsumed: 1000 },
      { id: `lot-${i}-2`, lotType: 'BMS', supplierName: 'Texas Inst', supplierLotId: `TI-${i}22`, receivedDate: '2024-01-02', qtyConsumed: 100 }
    ],
    
    processRouteId: 'ROUTE-STD-01',
    stationRecipeVersion: 'REC-v4.0',
    startPlannedAt: new Date(Date.now() - i * 86400000).toISOString(),
    
    status: i === 0 ? BatchStatus.DRAFT : i < 5 ? BatchStatus.IN_PRODUCTION : BatchStatus.RELEASED_TO_INVENTORY,
    
    qtyStarted: 50 + i,
    qtyBuilt: 45 + i,
    qtyPassedEOL: 40 + i,
    qtyFailedEOL: 2,
    qtyReworked: 3,
    yieldPct: 90,
    eolPassRatePct: 95.5,
    riskLevel: i === 3 ? RiskLevel.HIGH : i === 7 ? RiskLevel.MEDIUM : RiskLevel.LOW,
    
    holdRequestPending: false,
    closeRequestByProd: false,
    closeApprovedByQA: false,
    
    notes: []
  }));
};

const MOCK_BATCHES = generateBatches(20);

const generateBatteries = (count: number): Battery[] => {
    return Array.from({ length: count }).map((_, i) => {
        const batchId = `batch-${Math.floor(i / 10) + 1}`;
        const status = [BatteryStatus.ASSEMBLY, BatteryStatus.PROVISIONING, BatteryStatus.QA_TESTING, BatteryStatus.IN_INVENTORY, BatteryStatus.DEPLOYED][Math.floor(Math.random() * 5)];
        
        const isInventory = status === BatteryStatus.IN_INVENTORY || status === BatteryStatus.DEPLOYED;
        
        return {
            id: `batt-${i}`,
            serialNumber: `SN-${(100000 + i).toString(16).toUpperCase()}`,
            // Fix line 149: Add mandatory packId and skuId to mock data
            packId: `PACK-${(2024000 + i)}`,
            skuId: Math.floor(i / 10) % 2 === 0 ? 'VV360-LFP-48V' : 'EE360-NMC-72V',
            batchId: batchId,
            qrCode: `QR-${100000+i}`,
            plantId: 'PLANT-01',
            lineId: 'L1',
            stationId: 'ST-04',
            status: status as BatteryStatus,
            location: isInventory ? 'WH1-Z1-R03-B05' : 'Assembly Line 1',
            lastSeen: new Date().toISOString(),
            manufacturedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
            
            assemblyEvents: [
                { id: `evt-${i}-1`, stationId: 'ST-01', operatorId: 'OP-55', eventType: 'Assembly Start', timestamp: new Date(Date.now() - 86400000).toISOString() }
            ],
            reworkFlag: Math.random() > 0.9,
            scrapFlag: false,
            
            // Fix provisioningStatus enum values
            provisioningStatus: status === BatteryStatus.ASSEMBLY ? 'NOT_STARTED' : 'DONE',
            cryptoProvisioned: status !== BatteryStatus.ASSEMBLY,
            firmwareVersion: status === BatteryStatus.ASSEMBLY ? undefined : 'v2.1.4',
            bmsUid: status === BatteryStatus.ASSEMBLY ? undefined : `BMS-${(5000+i)}`,
            calibrationProfile: status === BatteryStatus.ASSEMBLY ? undefined : 'CAL_LFP_16S_v1',
            calibrationStatus: status === BatteryStatus.ASSEMBLY ? undefined : 'PASS',
            provisioningLogs: [],
            
            // EOL Mock Data
            eolStatus: isInventory ? 'PASS' : 'NOT_TESTED',
            eolMeasurements: isInventory ? {
              voltage: 48.2,
              capacityAh: 102.5,
              internalResistance: 12,
              temperatureMax: 32,
              cellBalancingDelta: 0.005,
              timestamp: new Date().toISOString()
            } : undefined,
            qaDisposition: isInventory ? QaDisposition.PASS : undefined,
            
            // Inventory Mock Data
            releaseToInventory: isInventory,
            inventoryStatus: isInventory 
              ? (Math.random() > 0.8 ? InventoryStatus.RESERVED : InventoryStatus.AVAILABLE) 
              : undefined,
            inventoryLocation: isInventory ? 'WH1-Z1-R03-B05' : undefined,
            inventoryEnteredAt: isInventory ? new Date(Date.now() - 100000000).toISOString() : undefined,
            inventoryMovementLog: isInventory ? [
              { id: 'mv-1', timestamp: new Date(Date.now() - 100000000).toISOString(), type: 'PUT_AWAY', toLocation: 'WH1-Z1-R03-B05', operator: 'System' }
            ] : [],
            custodyStatus: isInventory ? CustodyStatus.AT_FACTORY : undefined,
            
            soh: 95 + Math.random() * 5,
            soc: 30 + Math.random() * 60,
            voltage: 48 + Math.random(),
            /* capacityAh is required in the Battery domain type; added here to fix TS error in mock generation. */
            capacityAh: isInventory ? 102.5 : 100,
            eolResult: isInventory ? 'PASS' : undefined,
            certificateRef: isInventory ? `CERT-${i}` : undefined,
            
            notes: []
        };
    });
};

// Global mutable store for mocks
let MOCK_BATTERIES = generateBatteries(150);

const MOCK_DISPATCH_ORDERS: DispatchOrder[] = [
  {
    id: 'do-1',
    orderNumber: 'DO-2024-001',
    status: DispatchStatus.DISPATCHED,
    custodyStatus: CustodyStatus.IN_TRANSIT,
    customerName: 'Mega Motors Inc.',
    destinationAddress: '123 EV Blvd, Detroit, MI',
    expectedShipDate: '2024-06-01',
    batteryIds: ['batt-10', 'batt-11'],
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dispatchedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    packingListRef: 'PL-001',
    carrierName: 'FastTracks Logistics'
  },
  {
    id: 'do-2',
    orderNumber: 'DO-2024-002',
    status: DispatchStatus.DISPATCHED,
    custodyStatus: CustodyStatus.ACCEPTED,
    customerName: 'PowerWall Home',
    destinationAddress: '456 Green Way, Austin, TX',
    expectedShipDate: '2024-05-20',
    batteryIds: ['batt-12'],
    createdBy: 'System',
    createdAt: new Date(Date.now() - 500000000).toISOString(),
    updatedAt: new Date().toISOString(),
    dispatchedAt: new Date(Date.now() - 400000000).toISOString(),
    deliveredAt: new Date(Date.now() - 300000000).toISOString(),
    acceptedAt: new Date(Date.now() - 250000000).toISOString(),
    packingListRef: 'PL-002',
    carrierName: 'Global Cargo'
  }
];

// Ensure mocked batteries for DO-1 and DO-2 have correct custody status
MOCK_BATTERIES.forEach(b => {
    if (b.id === 'batt-10' || b.id === 'batt-11') {
        b.status = BatteryStatus.IN_TRANSIT;
        b.custodyStatus = CustodyStatus.IN_TRANSIT;
        b.dispatchId = 'do-1';
    }
    if (b.id === 'batt-12') {
        b.status = BatteryStatus.DEPLOYED;
        b.custodyStatus = CustodyStatus.ACCEPTED;
        b.dispatchId = 'do-2';
    }
});

/**
 * MOCK IMPLEMENTATIONS
 * ---------------------------------------------------------------------
 */

class MockBatchService implements IBatchService {
  async getBatches(filters?: any): Promise<Batch[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    let res = [...MOCK_BATCHES];
    if (filters?.status) {
      res = res.filter(b => b.status === filters.status);
    }
    return res;
  }

  async getBatchById(id: string): Promise<Batch | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_BATCHES.find(b => b.id === id);
  }

  async createBatch(data: Partial<Batch>): Promise<Batch> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newBatch: Batch = {
      ...MOCK_BATCHES[0], // Copy defaults from first
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: BatchStatus.DRAFT,
      supplierLots: [],
      notes: [],
      holdRequestPending: false,
      closeRequestByProd: false,
      closeApprovedByQA: false,
      ...data
    } as Batch;
    MOCK_BATCHES.unshift(newBatch);
    return newBatch;
  }

  async updateBatch(id: string, updates: Partial<Batch>): Promise<Batch> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_BATCHES.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Batch not found");
    
    MOCK_BATCHES[index] = { ...MOCK_BATCHES[index], ...updates };
    return MOCK_BATCHES[index];
  }

  // Workflow Actions
  async requestHold(id: string, reason: string, user: string): Promise<Batch> {
    return this.updateBatch(id, { 
      holdRequestPending: true,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Unknown',
        text: `Hold Requested: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Hold'
      }]
    });
  }

  async approveHold(id: string, reason: string, user: string): Promise<Batch> {
    return this.updateBatch(id, {
      status: BatchStatus.ON_HOLD,
      holdRequestPending: false,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Approver',
        text: `Hold Approved: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Hold'
      }]
    });
  }

  async requestRelease(id: string, reason: string, user: string): Promise<Batch> {
    return this.updateBatch(id, {
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Requester',
        text: `Release Requested: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Release'
      }]
    });
  }

  async approveRelease(id: string, reason: string, user: string): Promise<Batch> {
    // Return to IN_PRODUCTION or previous state logic (simplified here)
    return this.updateBatch(id, {
      status: BatchStatus.IN_PRODUCTION,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Approver',
        text: `Release Approved: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Release'
      }]
    });
  }

  async requestCloseByProd(id: string, user: string): Promise<Batch> {
    const batch = await this.getBatchById(id);
    let newStatus = batch?.status;
    if (batch?.closeApprovedByQA) newStatus = BatchStatus.CLOSED;

    return this.updateBatch(id, {
      closeRequestByProd: true,
      status: newStatus,
      notes: [...(batch?.notes || []), {
        id: Math.random().toString(),
        author: user,
        role: 'Production',
        text: 'Close Requested',
        timestamp: new Date().toISOString(),
        type: 'General'
      }]
    });
  }

  async approveCloseByQA(id: string, user: string): Promise<Batch> {
    const batch = await this.getBatchById(id);
    let newStatus = batch?.status;
    if (batch?.closeRequestByProd) newStatus = BatchStatus.CLOSED;

    return this.updateBatch(id, {
      closeApprovedByQA: true,
      status: newStatus,
      notes: [...(batch?.notes || []), {
        id: Math.random().toString(),
        author: user,
        role: 'QA',
        text: 'Close Approved',
        timestamp: new Date().toISOString(),
        type: 'General'
      }]
    });
  }

  async forceClose(id: string, user: string): Promise<Batch> {
    return this.updateBatch(id, {
      status: BatchStatus.CLOSED,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'SuperAdmin',
        text: 'Forced Close',
        timestamp: new Date().toISOString(),
        type: 'General'
      }]
    });
  }
}

class MockBatteryService implements IBatteryService {
  async getBatteries(filters?: any): Promise<Battery[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    let res = [...MOCK_BATTERIES];
    
    if (filters?.search) {
        const term = filters.search.toLowerCase();
        res = res.filter(b => b.serialNumber.toLowerCase().includes(term) || b.batchId.toLowerCase().includes(term));
    }
    if (filters?.status && filters.status !== 'All') {
        res = res.filter(b => b.status === filters.status);
    }
    if (filters?.eolResult && filters.eolResult !== 'All') {
        res = res.filter(b => b.eolResult === filters.eolResult);
    }
    
    return res;
  }

  async getBatteryById(id: string): Promise<Battery | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_BATTERIES.find(b => b.id === id);
  }

  async getBatteryBySN(sn: string): Promise<Battery | undefined> {
    await new Promise(resolve => setTimeout(resolve, 600));
    // Case insensitive match
    return MOCK_BATTERIES.find(b => b.serialNumber.toLowerCase() === sn.toLowerCase());
  }

  async getBatteryTelemetry(id: string): Promise<TelemetryPoint[]> {
    // Generate 60 points of history
    const now = Date.now();
    return Array.from({ length: 60 }).map((_, i) => ({
      timestamp: now - ((59 - i) * 1000),
      voltage: 48 + Math.random() * 2,
      current: 10 + Math.random() * 5,
      temperature: 25 + Math.random() * 5,
      soc: 80 - (i * 0.01), // Slowly draining
      cellMaxVol: 3.6,
      cellMinVol: 3.4
    }));
  }
  
  async registerBatteries(batchId: string, quantity: number, user: string): Promise<Battery[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newBatteries: Battery[] = [];
    const startIndex = MOCK_BATTERIES.length;
    
    for (let i = 0; i < quantity; i++) {
        const idx = startIndex + i;
        const newBatt: Battery = {
            id: `batt-${idx}`,
            serialNumber: `SN-${(100000 + idx).toString(16).toUpperCase()}`,
            // Fix: Add packId and skuId to mock registration
            packId: `PACK-REG-${idx}`,
            skuId: 'VV360-LFP-48V',
            batchId,
            qrCode: `QR-${100000+idx}`,
            plantId: 'PLANT-01',
            status: BatteryStatus.ASSEMBLY,
            location: 'Assembly Line 1',
            lastSeen: new Date().toISOString(),
            assemblyEvents: [],
            reworkFlag: false,
            scrapFlag: false,
            // Fix line 495: use correct enum value
            provisioningStatus: 'NOT_STARTED',
            cryptoProvisioned: false,
            soh: 100,
            soc: 0,
            voltage: 0,
            /* capacityAh is required in the Battery domain type; added here to fix TS error in mock generation. */
            capacityAh: 100,
            notes: [{ id: Math.random().toString(), author: user, role: 'Creator', text: 'Registered', timestamp: new Date().toISOString() }]
        };
        newBatteries.push(newBatt);
    }
    
    MOCK_BATTERIES = [...newBatteries, ...MOCK_BATTERIES];
    return newBatteries;
  }

  async addAssemblyEvent(id: string, event: Partial<AssemblyEvent>): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.assemblyEvents.push({
          id: Math.random().toString(),
          stationId: 'ST-XX',
          operatorId: 'OP-XX',
          eventType: 'Cell Stacking',
          timestamp: new Date().toISOString(),
          ...event
      } as AssemblyEvent);
      
      return batt;
  }

  async provisionBattery(id: string, data: { bmsUid: string, firmware: string, profile: string }): Promise<Battery> {
      // Deprecated wrapper for simple flow, ProvisioningService handles detailed flow now
      await new Promise(resolve => setTimeout(resolve, 800));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.status = BatteryStatus.PROVISIONING;
      batt.bmsUid = data.bmsUid;
      batt.firmwareVersion = data.firmware;
      batt.calibrationProfile = data.profile;
      // Fix line 538: use correct enum value
      batt.provisioningStatus = 'DONE';
      batt.cryptoProvisioned = true;
      
      return batt;
  }

  async uploadEOLResult(id: string, data: { soh: number, capacity: number, resistance: number, result: 'PASS'|'FAIL' }): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 800));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");

      batt.status = BatteryStatus.QA_TESTING;
      batt.soh = data.soh;
      batt.capacityAh = data.capacity;
      batt.internalResistance = data.resistance;
      batt.eolResult = data.result;
      
      return batt;
  }

  async approveBattery(id: string, user: string): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      if (batt.eolResult !== 'PASS') throw new Error("Cannot approve battery that hasn't passed EOL");
      
      batt.status = BatteryStatus.IN_INVENTORY;
      batt.qaApproverId = user;
      batt.certificateRef = `CERT-${Math.random().toString(36).substring(7).toUpperCase()}`;
      batt.releaseToInventory = true;
      batt.inventoryStatus = InventoryStatus.PENDING_PUTAWAY;
      batt.custodyStatus = CustodyStatus.AT_FACTORY;
      
      return batt;
  }

  async dispatchBattery(id: string, location: string): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.status = BatteryStatus.IN_TRANSIT;
      batt.dispatchStatus = 'Shipped';
      batt.location = location;
      
      return batt;
  }
  
  async flagRework(id: string, notes: string, user: string): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.reworkFlag = true;
      batt.notes.push({ id: Math.random().toString(), author: user, role: 'Operator', text: `REWORK FLAGGED: ${notes}`, timestamp: new Date().toISOString() });
      
      return batt;
  }

  async updateCustody(id: string, status: CustodyStatus, event: Partial<CustodyEvent>): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 300));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");

      batt.custodyStatus = status;
      if (event.location) batt.location = event.location;
      
      // Sync Lifecycle Status
      if (status === CustodyStatus.ACCEPTED) batt.status = BatteryStatus.DEPLOYED;
      if (status === CustodyStatus.REJECTED) batt.status = BatteryStatus.RMA;

      if (!batt.custodyLog) batt.custodyLog = [];
      batt.custodyLog.push({
          id: `cust-evt-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
          timestamp: new Date().toISOString(),
          status,
          location: event.location || 'Unknown',
          handler: event.handler || 'System',
          notes: event.notes,
          dispatchId: event.dispatchId,
          reasonCode: event.reasonCode
      });

      return batt;
  }
}

class MockProvisioningService implements IProvisioningService {
  private logStep(batt: Battery, step: string, outcome: 'PASS'|'FAIL'|'INFO', operator: string) {
    if (!batt.provisioningLogs) batt.provisioningLogs = [];
    batt.provisioningLogs.push({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      stationId: 'P-01',
      step,
      outcome,
      operator
    });
  }

  async bindBms(batteryId: string, bmsUid: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");
    
    batt.bmsUid = bmsUid;
    batt.status = BatteryStatus.PROVISIONING;
    this.logStep(batt, 'Bind BMS', 'PASS', operator);
    return batt;
  }

  async flashFirmware(batteryId: string, firmwareVersion: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate flashing time
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");
    
    batt.firmwareVersion = firmwareVersion;
    this.logStep(batt, 'Flash Firmware', 'PASS', operator);
    return batt;
  }

  async triggerCalibration(batteryId: string, profile: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate calib time
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");
    
    batt.calibrationProfile = profile;
    batt.calibrationStatus = 'PASS';
    this.logStep(batt, 'Calibration', 'PASS', operator);
    return batt;
  }

  async injectSecurity(batteryId: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");
    
    batt.cryptoProvisioned = true;
    this.logStep(batt, 'Security Injection', 'PASS', operator);
    return batt;
  }

  async runVerification(batteryId: string): Promise<{ handshake: boolean; telemetry: boolean; }> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { handshake: true, telemetry: true };
  }

  async finalizeProvisioning(batteryId: string, result: 'PASS' | 'FAIL', operator: string, notes?: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");
    
    // Fix line 691: map result to correct enum values
    batt.provisioningStatus = result === 'PASS' ? 'DONE' : 'BLOCKED';
    this.logStep(batt, 'Finalization', result, operator);
    
    if (result === 'PASS') {
      // Typically moves to next stage, e.g. QA Testing
      // But we leave status as PROVISIONING or move to QA_TESTING depending on workflow.
      // Let's assume it stays in PROVISIONING until physically moved or EOL starts.
    } else {
      batt.reworkFlag = true;
      if (notes) {
        batt.notes.push({ 
          id: Math.random().toString(), 
          author: operator, 
          role: 'Provisioning', 
          text: `PROVISIONING FAILED: ${notes}`, 
          timestamp: new Date().toISOString() 
        });
      }
    }
    
    return batt;
  }
}

class MockEolService implements IEolService {
  private logStep(batt: Battery, action: string, outcome: string, operator: string) {
    if (!batt.eolLog) batt.eolLog = [];
    batt.eolLog.push({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      stationId: 'EOL-01',
      action,
      outcome,
      operator
    });
  }

  async runEolTest(batteryId: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");

    batt.status = BatteryStatus.QA_TESTING;
    batt.eolStatus = 'IN_TEST';
    
    // Simulate Results
    const passed = Math.random() > 0.2; // 80% pass rate
    const voltage = 48 + Math.random() * 0.5;
    const capacity = 100 + Math.random() * 5;
    
    batt.eolMeasurements = {
      voltage: voltage,
      capacityAh: capacity,
      internalResistance: 10 + Math.random() * 5,
      temperatureMax: 25 + Math.random() * 10,
      cellBalancingDelta: 0.001 + Math.random() * 0.01,
      timestamp: new Date().toISOString()
    };
    
    // Sync legacy fields
    batt.voltage = voltage;
    batt.capacityAh = capacity;
    batt.thermalResult = batt.eolMeasurements.temperatureMax < 40 ? 'PASS' : 'FAIL';
    
    this.logStep(batt, 'Test Run', 'Completed', operator);
    return batt;
  }

  async setQaDisposition(batteryId: string, disposition: QaDisposition, reasonCode: string, notes: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");

    batt.qaDisposition = disposition;
    batt.eolResult = disposition === QaDisposition.PASS ? 'PASS' : 'FAIL';
    batt.qaApproverId = operator;
    batt.qaApprovedAt = new Date().toISOString();

    if (disposition === QaDisposition.REWORK || disposition === QaDisposition.FAIL) {
      batt.reworkFlag = true;
    }
    if (disposition === QaDisposition.SCRAP) {
      batt.scrapFlag = true;
      batt.status = BatteryStatus.SCRAPPED;
    }

    this.logStep(batt, 'Disposition', `${disposition} - ${reasonCode}`, operator);
    if (notes) {
      batt.notes.push({
        id: Math.random().toString(),
        author: operator,
        role: 'QA',
        text: `QA Disposition: ${disposition} (${reasonCode}) - ${notes}`,
        timestamp: new Date().toISOString()
      });
    }

    return batt;
  }

  async generateCertificate(batteryId: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");
    if (batt.qaDisposition !== QaDisposition.PASS) throw new Error("Cannot certify failed battery");

    batt.certificateRef = `CERT-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`;
    this.logStep(batt, 'Certificate', batt.certificateRef, operator);
    return batt;
  }

  async finalizeQA(batteryId: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");

    if (batt.qaDisposition === QaDisposition.PASS) {
      batt.status = BatteryStatus.IN_INVENTORY;
      batt.eolStatus = 'PASS';
      batt.releaseToInventory = true;
      batt.inventoryStatus = InventoryStatus.PENDING_PUTAWAY;
      batt.custodyStatus = CustodyStatus.AT_FACTORY;
    } else {
      batt.eolStatus = 'FAIL';
      // Status might stay in QA_TESTING or move to RMA/SCRAPPED depending on workflow
      if (batt.qaDisposition === QaDisposition.REWORK) batt.status = BatteryStatus.ASSEMBLY; // Send back
    }
    
    return batt;
  }
}

class MockInventoryService implements IInventoryService {
  private logMovement(batt: Battery, type: InventoryMovementEntry['type'], toLocation: string | undefined, operator: string, details?: string) {
    if (!batt.inventoryMovementLog) batt.inventoryMovementLog = [];
    batt.inventoryMovementLog.push({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type,
      fromLocation: batt.inventoryLocation || 'Origin',
      toLocation,
      operator,
      details
    });
  }

  async getInventory(filters?: any): Promise<Battery[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    // Exclude batteries that have left inventory (Dispatched / In Transit)
    let res = MOCK_BATTERIES.filter(b => 
      b.releaseToInventory === true && 
      b.eolResult === 'PASS' && 
      b.inventoryStatus !== InventoryStatus.DISPATCHED && 
      b.status !== BatteryStatus.IN_TRANSIT
    );
    
    if (filters?.status && filters.status !== 'All') {
      res = res.filter(b => b.inventoryStatus === filters.status);
    }
    return res;
  }

  async putAwayBattery(batteryId: string, location: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");

    batt.inventoryStatus = InventoryStatus.AVAILABLE;
    batt.inventoryLocation = location;
    batt.location = location; // Sync main location
    batt.inventoryEnteredAt = new Date().toISOString();
    
    this.logMovement(batt, 'PUT_AWAY', location, operator, 'Initial Put-away');
    return batt;
  }

  async moveBattery(batteryId: string, newLocation: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");

    batt.inventoryLocation = newLocation;
    batt.location = newLocation;
    
    this.logMovement(batt, 'MOVE', newLocation, operator);
    return batt;
  }

  async reserveBattery(batteryId: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");
    // If not already reserved, allow reservation from AVAILABLE
    if (batt.inventoryStatus !== InventoryStatus.AVAILABLE && batt.inventoryStatus !== InventoryStatus.RESERVED) {
       throw new Error("Battery not available for reservation");
    }

    batt.inventoryStatus = InventoryStatus.RESERVED;
    batt.reservedAt = new Date().toISOString();
    batt.reservedBy = operator;

    this.logMovement(batt, 'RESERVE', undefined, operator, 'Reserved for dispatch');
    return batt;
  }

  async quarantineBattery(batteryId: string, reason: string, notes: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");

    batt.inventoryStatus = InventoryStatus.QUARANTINED;
    
    this.logMovement(batt, 'QUARANTINE', undefined, operator, `${reason}: ${notes}`);
    
    // Add note to main notes as well
    batt.notes.push({
      id: Math.random().toString(),
      author: operator,
      role: 'QA/Inventory',
      text: `Quarantined: ${reason} - ${notes}`,
      timestamp: new Date().toISOString()
    });
    return batt;
  }

  async releaseQuarantine(batteryId: string, operator: string): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const batt = MOCK_BATTERIES.find(b => b.id === batteryId);
    if (!batt) throw new Error("Not found");

    batt.inventoryStatus = InventoryStatus.AVAILABLE;
    this.logMovement(batt, 'RELEASE', undefined, operator, 'Released from Quarantine');
    return batt;
  }
}

class MockDispatchService implements IDispatchService {
  async getOrders(filters?: any): Promise<DispatchOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    let res = [...MOCK_DISPATCH_ORDERS];
    if (filters?.status) {
      res = res.filter(o => o.status === filters.status);
    }
    return res;
  }

  async getOrderById(id: string): Promise<DispatchOrder | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_DISPATCH_ORDERS.find(o => o.id === id);
  }

  async createOrder(data: Partial<DispatchOrder>, operator: string): Promise<DispatchOrder> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newOrder: DispatchOrder = {
      id: `do-${Date.now()}`,
      orderNumber: `DO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: DispatchStatus.DRAFT,
      custodyStatus: CustodyStatus.AT_FACTORY,
      customerName: data.customerName || '',
      destinationAddress: data.destinationAddress || '',
      expectedShipDate: data.expectedShipDate || '',
      batteryIds: [],
      createdBy: operator,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    MOCK_DISPATCH_ORDERS.unshift(newOrder);
    return newOrder;
  }

  async updateOrder(id: string, data: Partial<DispatchOrder>, operator: string): Promise<DispatchOrder> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_DISPATCH_ORDERS.findIndex(o => o.id === id);
    if (index === -1) throw new Error("Order not found");
    
    MOCK_DISPATCH_ORDERS[index] = { 
      ...MOCK_DISPATCH_ORDERS[index], 
      ...data, 
      updatedAt: new Date().toISOString() 
    };
    return MOCK_DISPATCH_ORDERS[index];
  }

  async addBatteries(orderId: string, batteryIds: string[], operator: string): Promise<DispatchOrder> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const order = MOCK_DISPATCH_ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    
    // De-dupe
    const newIds = batteryIds.filter(id => !order.batteryIds.includes(id));
    order.batteryIds = [...order.batteryIds, ...newIds];
    order.updatedAt = new Date().toISOString();
    
    // Also reserve these batteries in Inventory
    for (const bId of newIds) {
      await inventoryService.reserveBattery(bId, operator);
    }
    
    return order;
  }

  async removeBattery(orderId: string, batteryId: string, operator: string): Promise<DispatchOrder> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const order = MOCK_DISPATCH_ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    
    order.batteryIds = order.batteryIds.filter(id => id !== batteryId);
    order.updatedAt = new Date().toISOString();
    
    // Release reservation? Or keep it? Usually keep it or handle separately.
    // For now, let's keep it RESERVED but just remove from order list.
    
    return order;
  }

  async generateDocument(orderId: string, type: 'packing' | 'manifest' | 'invoice', operator: string): Promise<DispatchOrder> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const order = MOCK_DISPATCH_ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    
    const docRef = `DOC-${type.toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
    
    if (type === 'packing') order.packingListRef = docRef;
    if (type === 'manifest') order.manifestRef = docRef;
    if (type === 'invoice') order.invoiceRef = docRef;
    
    order.updatedAt = new Date().toISOString();
    return order;
  }

  async markReady(orderId: string, operator: string): Promise<DispatchOrder> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Not found");
    if (order.batteryIds.length === 0) throw new Error("No batteries added");
    
    return this.updateOrder(orderId, { status: DispatchStatus.READY }, operator);
  }

  async markDispatched(orderId: string, operator: string): Promise<DispatchOrder> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Not found");
    if (!order.packingListRef) throw new Error("Packing list required before dispatch");
    
    const updatedOrder = await this.updateOrder(orderId, { 
      status: DispatchStatus.DISPATCHED,
      custodyStatus: CustodyStatus.IN_TRANSIT,
      dispatchedAt: new Date().toISOString()
    }, operator);
    
    // Update all batteries
    for (const bId of order.batteryIds) {
      const batt = MOCK_BATTERIES.find(b => b.id === bId);
      if (batt) {
        batt.status = BatteryStatus.IN_TRANSIT;
        batt.inventoryStatus = InventoryStatus.DISPATCHED;
        batt.custodyStatus = CustodyStatus.IN_TRANSIT;
        batt.location = `In Transit to ${order.customerName}`;
        batt.dispatchId = orderId;
        
        if (!batt.custodyLog) batt.custodyLog = [];
        batt.custodyLog.push({
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          status: CustodyStatus.IN_TRANSIT,
          location: 'Carrier Handover',
          handler: operator,
          dispatchId: orderId
        });
      }
    }
    
    return updatedOrder;
  }

  async cancelOrder(orderId: string, operator: string): Promise<DispatchOrder> {
    return this.updateOrder(orderId, { status: DispatchStatus.CANCELLED }, operator);
  }
}

class MockDashboardService implements IDashboardService {
  async getKPIs(): Promise<KPIData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      totalBatteries: MOCK_BATTERIES.length,
      activeBatches: MOCK_BATCHES.filter(b => b.status === BatchStatus.IN_PRODUCTION).length,
      eolPassRate: 98.4,
      exceptions: 3,
      inTransit: 42
    };
  }

  async getRecentAlerts(): Promise<any[]> {
    return [
      { id: '1', severity: 'critical', message: 'Temp spike detected in Batch B-2024003', timestamp: '2 mins ago' },
      { id: '2', severity: 'warning', message: 'Low inventory for Cell-18650-Samsung', timestamp: '1 hour ago' },
    ];
  }
}

// Export Singleton Instances
export const batchService = new MockBatchService();
export const batteryService = new MockBatteryService();
export const provisioningService = new MockProvisioningService();
export const eolService = new MockEolService();
export const inventoryService = new MockInventoryService();
export const dispatchService = new MockDispatchService();
export const dashboardService = new MockDashboardService();
