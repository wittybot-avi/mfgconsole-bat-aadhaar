import { batteryService } from './api';
import { Battery, BatteryStatus, TelemetryPoint } from '../domain/types';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'PROVISIONING' | 'EOL_TEST' | 'DISPATCH' | 'ERROR' | 'ALERT';
  message: string;
}

export interface TelemetryHistory {
  samples: TelemetryPoint[];
  events: TelemetryEvent[];
}

class TelemetryService {
  
  // In-memory cache for live streams to ensure continuity during navigation
  private liveStreams: Map<string, TelemetryPoint[]> = new Map();

  /**
   * Returns a filtered list of batteries suitable for the user's role.
   * C2: Production only
   * C7: Warranty/Issues only
   * C1: Curated recent list
   * Others: All (paginated/limited)
   */
  async getAccessibleBatteries(clusterId: string, search?: string): Promise<Battery[]> {
    const all = await batteryService.getBatteries({ search });
    
    if (clusterId === 'CS' || clusterId === 'C3' || clusterId === 'C5' || clusterId === 'C4') {
      return all;
    }

    if (clusterId === 'C2') {
      // Production: Assembly, Provisioning, QA
      return all.filter(b => [BatteryStatus.ASSEMBLY, BatteryStatus.PROVISIONING, BatteryStatus.QA_TESTING].includes(b.status));
    }

    if (clusterId === 'C7') {
      // Warranty: RMA, Scrapped, or any with Rework flag
      return all.filter(b => b.status === BatteryStatus.RMA || b.status === BatteryStatus.SCRAPPED || b.reworkFlag);
    }

    if (clusterId === 'C1' || clusterId === 'C8') {
      // Leadership/Compliance: Show recent 15
      return all.slice(0, 15);
    }

    return [];
  }

  /**
   * Simulates a live telemetry point based on previous state
   */
  generateNextPoint(prev: TelemetryPoint): TelemetryPoint {
    return {
      timestamp: Date.now(),
      voltage: Math.max(40, Math.min(58, prev.voltage + (Math.random() - 0.5) * 0.2)),
      current: Math.max(0, Math.min(100, prev.current + (Math.random() - 0.5) * 5)),
      temperature: Math.max(20, Math.min(60, prev.temperature + (Math.random() - 0.5) * 0.5)),
      soc: Math.max(0, Math.min(100, prev.soc - (prev.current > 0 ? 0.01 : 0))),
      cellMaxVol: 3.6 + (Math.random() * 0.05),
      cellMinVol: 3.4 - (Math.random() * 0.05)
    };
  }

  /**
   * Gets or initializes a live stream buffer for a battery
   */
  async getLiveBuffer(batteryId: string): Promise<TelemetryPoint[]> {
    // Check cache first
    if (this.liveStreams.has(batteryId)) {
      return this.liveStreams.get(batteryId)!;
    }

    // Initialize with some history if not present
    const history = await batteryService.getBatteryTelemetry(batteryId);
    this.liveStreams.set(batteryId, history);
    return history;
  }

  /**
   * Mock History Data Generator
   * @param range '15m' | '1h' | '24h'
   */
  async getHistory(batteryId: string, range: string): Promise<TelemetryHistory> {
    // TODO: [INTEGRATION] Replace with GET /api/telemetry/history?batteryId=...&range=...
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate latency

    const now = Date.now();
    let pointsCount = 50;
    let intervalMs = 1000;

    if (range === '1h') { pointsCount = 100; intervalMs = 36000; } // compressed
    if (range === '24h') { pointsCount = 200; intervalMs = 864000; }

    const samples: TelemetryPoint[] = [];
    let prev: TelemetryPoint = { 
        timestamp: now - (pointsCount * intervalMs), 
        voltage: 48, current: 20, temperature: 25, soc: 80, cellMaxVol: 3.6, cellMinVol: 3.4 
    };

    for (let i = 0; i < pointsCount; i++) {
        const point = this.generateNextPoint(prev);
        point.timestamp = prev.timestamp + intervalMs;
        samples.push(point);
        prev = point;
    }

    // Mock Events
    const events: TelemetryEvent[] = [];
    if (range === '24h') {
        events.push({ id: 'e1', timestamp: new Date(now - 40000000).toISOString(), type: 'PROVISIONING', message: 'BMS Handshake OK' });
        events.push({ id: 'e2', timestamp: new Date(now - 30000000).toISOString(), type: 'EOL_TEST', message: 'Discharge Cycle Start' });
    }

    return { samples, events };
  }
}

export const telemetryService = new TelemetryService();