
import { batchService, batteryService, inventoryService, dispatchService } from './api';
import { BatteryStatus, BatchStatus, InventoryStatus, DispatchStatus } from '../domain/types';

export interface DashboardMetrics {
  kpis: {
    totalBatteries: number;
    activeBatches: number;
    eolPassRate: number;
    openExceptions: number;
    shippedCount: number;
  };
  production: {
    outputTrend: Array<{ name: string; built: number; target: number }>;
    wipCount: number;
    finishedCount: number;
    topActiveBatches: Array<{ id: string; number: string; progress: number }>;
  };
  quality: {
    passFailTrend: Array<{ name: string; passed: number; failed: number }>;
    failureReasons: Array<{ name: string; count: number }>;
  };
  logistics: {
    inventoryAvailable: number;
    inventoryReserved: number;
    inventoryQuarantined: number;
    inTransit: number;
    dispatchReady: number;
  };
  risk: {
    quarantineCount: number;
    provisioningFailures: number;
    certCoveragePct: number;
  };
}

class DashboardMetricsService {
  
  // TODO: [INTEGRATION] Replace with backend aggregated endpoint GET /api/dashboard/metrics
  async getMetrics(): Promise<DashboardMetrics> {
    const [batches, batteries, orders] = await Promise.all([
      batchService.getBatches(),
      batteryService.getBatteries(),
      dispatchService.getOrders()
    ]);

    // --- KPI Computation ---
    const totalBatteries = batteries.length;
    const activeBatches = batches.filter(b => b.status === BatchStatus.IN_PRODUCTION).length;
    
    const eolTested = batteries.filter(b => b.eolResult !== undefined);
    const eolPassed = eolTested.filter(b => b.eolResult === 'PASS');
    const eolPassRate = eolTested.length > 0 ? Math.round((eolPassed.length / eolTested.length) * 100) : 0;

    const shippedCount = batteries.filter(b => b.status === BatteryStatus.DEPLOYED || b.status === BatteryStatus.IN_TRANSIT).length;

    // Exceptions: Rework + Scrap + Quarantine + Provision Fail + Hold Batches
    const reworkCount = batteries.filter(b => b.reworkFlag).length;
    const scrapCount = batteries.filter(b => b.scrapFlag).length;
    const quarantineCount = batteries.filter(b => b.inventoryStatus === InventoryStatus.QUARANTINED).length;
    // Fix line 60: use correct enum value 'BLOCKED' instead of 'FAIL'
    const provFailCount = batteries.filter(b => b.provisioningStatus === 'BLOCKED').length;
    const holdBatchesCount = batches.filter(b => b.status === BatchStatus.ON_HOLD).length;
    const openExceptions = reworkCount + scrapCount + quarantineCount + provFailCount + holdBatchesCount;

    // --- Production Metrics ---
    const wipCount = batteries.filter(b => b.status === BatteryStatus.ASSEMBLY || b.status === BatteryStatus.PROVISIONING || b.status === BatteryStatus.QA_TESTING).length;
    const finishedCount = batteries.filter(b => b.status === BatteryStatus.IN_INVENTORY).length;
    
    // Mock daily trend based on battery "manufacturedAt" timestamps if they exist, or randomize for demo
    const outputTrend = [
      { name: 'Mon', built: 120, target: 150 },
      { name: 'Tue', built: 135, target: 150 },
      { name: 'Wed', built: 140, target: 150 },
      { name: 'Thu', built: 110, target: 150 }, // Dip
      { name: 'Fri', built: 155, target: 150 },
      { name: 'Sat', built: 80, target: 100 },
      { name: 'Sun', built: 20, target: 50 },
    ];

    const topActiveBatches = batches
      .filter(b => b.status === BatchStatus.IN_PRODUCTION)
      .sort((a, b) => b.qtyBuilt - a.qtyBuilt)
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        number: b.batchNumber,
        progress: Math.round((b.qtyBuilt / b.targetQuantity) * 100)
      }));

    // --- Quality Metrics ---
    // Mock failure reasons based on what usually fails
    const failureReasons = [
        { name: 'Voltage Mismatch', count: 12 },
        { name: 'IR High', count: 8 },
        { name: 'Welding Defect', count: 5 },
        { name: 'Thermal Variance', count: 3 },
    ];

    const passFailTrend = [
      { name: 'Mon', passed: 115, failed: 5 },
      { name: 'Tue', passed: 130, failed: 5 },
      { name: 'Wed', passed: 138, failed: 2 },
      { name: 'Thu', passed: 105, failed: 5 },
      { name: 'Fri', passed: 150, failed: 5 },
    ];

    // --- Logistics Metrics ---
    const inventoryAvailable = batteries.filter(b => b.inventoryStatus === InventoryStatus.AVAILABLE).length;
    const inventoryReserved = batteries.filter(b => b.inventoryStatus === InventoryStatus.RESERVED).length;
    const inventoryQuarantined = quarantineCount;
    const inTransit = batteries.filter(b => b.status === BatteryStatus.IN_TRANSIT).length;
    const dispatchReady = orders.filter(o => o.status === DispatchStatus.READY).length;

    // --- Risk Metrics ---
    const certCount = batteries.filter(b => b.certificateRef).length;
    const certCoveragePct = eolPassed.length > 0 ? Math.round((certCount / eolPassed.length) * 100) : 0;

    return {
      kpis: {
        totalBatteries,
        activeBatches,
        eolPassRate,
        openExceptions,
        shippedCount
      },
      production: {
        outputTrend,
        wipCount,
        finishedCount,
        topActiveBatches
      },
      quality: {
        passFailTrend,
        failureReasons
      },
      logistics: {
        inventoryAvailable,
        inventoryReserved,
        inventoryQuarantined,
        inTransit,
        dispatchReady
      },
      risk: {
        quarantineCount,
        provisioningFailures: provFailCount,
        certCoveragePct
      }
    };
  }
}

export const dashboardMetricsService = new DashboardMetricsService();
