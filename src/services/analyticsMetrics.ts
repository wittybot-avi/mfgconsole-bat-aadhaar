import { batchService, batteryService, dispatchService, inventoryService } from './api';
import { BatteryStatus, BatchStatus, QaDisposition, InventoryStatus, DispatchStatus } from '../domain/types';

export interface AnalyticsOverview {
  yieldTrend: Array<{ name: string; value: number }>;
  exceptionsTrend: Array<{ name: string; value: number }>;
  outputTrend: Array<{ name: string; value: number }>;
  inventorySnapshot: { available: number; reserved: number; quarantined: number };
  dispatchSummary: { inTransit: number; ready: number };
}

export interface BatchAnalytics {
  id: string;
  batchNumber: string;
  total: number;
  passRate: number;
  failCount: number;
  topReason: string;
  avgIR?: number;
  avgTemp?: number;
}

export interface StationAnalytics {
  stationId: string;
  type: 'Provisioning' | 'EOL' | 'Assembly';
  processed: number;
  passRate: number;
  avgCycleTimeSec: number;
}

export interface QualityPareto {
  reason: string;
  count: number;
}

export interface LocationMovementAnalytics {
  avgFactoryDwellHours: number;
  avgInventoryDwellHours: number;
  avgTransitHours: number;
  delayedBeyondSLA: number; // percentage
  geofenceViolations: Array<{ route: string; violations: number; severity: 'Low'|'Medium'|'High' }>;
  dwellTimeByStage: Array<{ stage: string; hours: number }>;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  type: 'Compliance' | 'Exceptions' | 'SLA';
}

class AnalyticsMetricsService {

  // TODO: [INTEGRATION] Replace with GET /api/analytics/overview
  async getOverview(range: string): Promise<AnalyticsOverview> {
    const [batches, batteries, orders] = await Promise.all([
      batchService.getBatches(),
      batteryService.getBatteries(),
      dispatchService.getOrders()
    ]);

    // Mock trend generation based on range
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    
    // Yield Trend (Mock)
    const yieldTrend = Array.from({ length: days }).map((_, i) => ({
      name: `Day ${i + 1}`,
      value: 90 + Math.random() * 8
    }));

    // Exceptions Trend (Mock)
    const exceptionsTrend = Array.from({ length: days }).map((_, i) => ({
      name: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 5)
    }));

    // Output Trend (Mock)
    const outputTrend = Array.from({ length: days }).map((_, i) => ({
      name: `Day ${i + 1}`,
      value: 20 + Math.floor(Math.random() * 30)
    }));

    // Inventory Snapshot (Real Mock Data)
    const available = batteries.filter(b => b.inventoryStatus === InventoryStatus.AVAILABLE).length;
    const reserved = batteries.filter(b => b.inventoryStatus === InventoryStatus.RESERVED).length;
    const quarantined = batteries.filter(b => b.inventoryStatus === InventoryStatus.QUARANTINED).length;

    // Dispatch Summary (Real Mock Data)
    const inTransit = batteries.filter(b => b.status === BatteryStatus.IN_TRANSIT).length;
    const ready = orders.filter(o => o.status === DispatchStatus.READY).length;

    return {
      yieldTrend,
      exceptionsTrend,
      outputTrend,
      inventorySnapshot: { available, reserved, quarantined },
      dispatchSummary: { inTransit, ready }
    };
  }

  // TODO: [INTEGRATION] Replace with GET /api/analytics/batches
  async getBatchAnalytics(range: string): Promise<BatchAnalytics[]> {
    const batches = await batchService.getBatches();
    
    return batches.map(b => {
      // Mock derived stats if not strictly in Batch object
      const failCount = b.qtyFailedEOL || 0;
      const total = b.qtyBuilt || 1;
      
      return {
        id: b.id,
        batchNumber: b.batchNumber,
        total: total,
        passRate: b.eolPassRatePct,
        failCount: failCount,
        topReason: failCount > 0 ? 'Voltage Mismatch' : '-',
        avgIR: 12.5 + (Math.random() * 2),
        avgTemp: 24 + (Math.random() * 3)
      };
    });
  }

  // TODO: [INTEGRATION] Replace with GET /api/analytics/stations
  async getStationAnalytics(range: string): Promise<StationAnalytics[]> {
    // Mock station data
    return [
      { stationId: 'EOL-01', type: 'EOL', processed: 150, passRate: 98.5, avgCycleTimeSec: 120 },
      { stationId: 'EOL-02', type: 'EOL', processed: 142, passRate: 97.2, avgCycleTimeSec: 125 },
      { stationId: 'P-01', type: 'Provisioning', processed: 200, passRate: 99.5, avgCycleTimeSec: 45 },
      { stationId: 'P-02', type: 'Provisioning', processed: 180, passRate: 99.0, avgCycleTimeSec: 48 },
    ];
  }

  // TODO: [INTEGRATION] Replace with GET /api/analytics/quality
  async getQualityPareto(range: string): Promise<QualityPareto[]> {
    // Mock pareto data
    return [
      { reason: 'Voltage Mismatch', count: 45 },
      { reason: 'IR High', count: 30 },
      { reason: 'Capacity Low', count: 15 },
      { reason: 'Thermal Runaway', count: 5 },
      { reason: 'Visual Defect', count: 2 },
    ];
  }

  // TODO: [INTEGRATION] Replace with GET /api/analytics/location
  async getLocationMovementAnalytics(range: string): Promise<LocationMovementAnalytics> {
    const batteries = await batteryService.getBatteries();
    
    // Simulate dwell times
    const avgFactoryDwellHours = 48 + Math.random() * 5; // 2 days
    const avgInventoryDwellHours = 120 + Math.random() * 10; // 5 days
    const avgTransitHours = 72 + Math.random() * 10; // 3 days

    // Mock Geofence Violations
    const geofenceViolations = [
      { route: 'Factory -> WH1', violations: 2, severity: 'Low' as const },
      { route: 'WH1 -> Port', violations: 1, severity: 'High' as const },
      { route: 'Port -> Customer A', violations: 5, severity: 'Medium' as const },
    ];

    const dwellTimeByStage = [
      { stage: 'Factory', hours: avgFactoryDwellHours },
      { stage: 'Warehouse', hours: avgInventoryDwellHours },
      { stage: 'In Transit', hours: avgTransitHours },
      { stage: 'Customer', hours: 0 },
    ];

    return {
      avgFactoryDwellHours,
      avgInventoryDwellHours,
      avgTransitHours,
      delayedBeyondSLA: 12.5, // 12.5% late
      geofenceViolations,
      dwellTimeByStage
    };
  }

  getAvailableReports(): AnalyticsReport[] {
    return [
      { id: 'rpt-1', title: 'Digital Certificate Coverage', description: 'Breakdown of certified units vs total production.', type: 'Compliance' },
      { id: 'rpt-2', title: 'Exceptions & Failures', description: 'Detailed log of all EOL failures and quarantine events.', type: 'Exceptions' },
      { id: 'rpt-3', title: 'Logistics SLA Performance', description: 'Transit times and delay analysis per carrier.', type: 'SLA' },
    ];
  }

  async exportReport(reportId: string) {
    // Stub export function
    // In real app, this would trigger a backend job or download a CSV
    console.log(`Exporting report ${reportId}`);
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export const analyticsMetricsService = new AnalyticsMetricsService();