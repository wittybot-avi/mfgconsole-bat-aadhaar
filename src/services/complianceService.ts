
import { batteryService, batchService, dispatchService, inventoryService } from './api';
import { Battery, Batch, DispatchOrder, InventoryStatus, BatteryStatus, QaDisposition } from '../domain/types';
import { findingsStore } from './findingsStore';

export interface ComplianceScore {
  total: number; // 0-100
  breakdown: {
    identity: number; // 20
    process: number; // 20
    qa: number; // 25
    traceability: number; // 15
    custody: number; // 20
  };
  topGaps: string[];
}

export interface ComplianceCheck {
  id: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  affectedCount: number;
  affectedIds: string[];
  description: string;
}

export interface EvidencePack {
  generatedAt: string;
  subject: { type: string, id: string };
  identity: any;
  lifecycle: Array<{ stage: string, timestamp: string, status: string }>;
  qa: any;
  movements: any[];
  findings: any[];
}

class ComplianceService {

  async getReadinessScore(): Promise<ComplianceScore> {
    const batteries = await batteryService.getBatteries();
    // Simulate scoring logic based on dataset
    const totalBatteries = batteries.length || 1;
    
    const certified = batteries.filter(b => b.certificateRef).length;
    const tracked = batteries.filter(b => b.location).length;
    // Fix line 46: use correct enum value 'DONE' instead of 'PASS'
    const provisioned = batteries.filter(b => b.provisioningStatus === 'DONE').length;
    
    // Weighted Components (Mocked slightly for demo variance)
    const identityScore = Math.min(20, Math.floor((provisioned / totalBatteries) * 20));
    const processScore = 18; // Assume good process
    const qaScore = Math.min(25, Math.floor((certified / totalBatteries) * 25));
    const traceScore = Math.min(15, Math.floor((tracked / totalBatteries) * 15));
    const custodyScore = 19; // Assume good custody

    const total = identityScore + processScore + qaScore + traceScore + custodyScore;
    
    const topGaps = [];
    if (qaScore < 20) topGaps.push("Low Certificate Coverage");
    if (identityScore < 15) topGaps.push("Provisioning Gaps");
    if (traceScore < 12) topGaps.push("Location Data Missing");

    return {
      total,
      breakdown: {
        identity: identityScore,
        process: processScore,
        qa: qaScore,
        traceability: traceScore,
        custody: custodyScore
      },
      topGaps
    };
  }

  async runChecks(): Promise<ComplianceCheck[]> {
    const batteries = await batteryService.getBatteries();
    
    // R1: Shipped without EOL PASS
    const r1Affected = batteries.filter(b => 
        (b.status === BatteryStatus.IN_TRANSIT || b.status === BatteryStatus.DEPLOYED) && 
        b.eolResult !== 'PASS'
    ).map(b => b.id);

    // R2: IN_TRANSIT without dispatchId
    const r2Affected = batteries.filter(b => 
        b.status === BatteryStatus.IN_TRANSIT && !b.dispatchId
    ).map(b => b.id);

    // R3: EOL PASS missing certificateRef
    const r3Affected = batteries.filter(b => 
        b.eolResult === 'PASS' && !b.certificateRef
    ).map(b => b.id);

    // R4: Inventory missing location
    const r4Affected = batteries.filter(b => 
        (b.inventoryStatus === InventoryStatus.AVAILABLE || b.inventoryStatus === InventoryStatus.RESERVED) && 
        !b.inventoryLocation
    ).map(b => b.id);

    // R5: QA FAIL not quarantined
    const r5Affected = batteries.filter(b => 
        b.eolResult === 'FAIL' && 
        b.inventoryStatus !== InventoryStatus.QUARANTINED && 
        !b.scrapFlag && !b.reworkFlag
    ).map(b => b.id);

    // R6: Reserved > 7 days (Mock Logic: random sampling for demo)
    const r6Affected = batteries.filter(b => b.inventoryStatus === InventoryStatus.RESERVED).slice(0, 2).map(b => b.id);

    return [
      { id: 'R1', name: 'Shipped without EOL PASS', status: r1Affected.length > 0 ? 'FAIL' : 'PASS', severity: 'HIGH', affectedCount: r1Affected.length, affectedIds: r1Affected, description: 'Batteries marked as shipped/deployed must have explicit EOL PASS.' },
      { id: 'R2', name: 'In-Transit missing Dispatch ID', status: r2Affected.length > 0 ? 'FAIL' : 'PASS', severity: 'HIGH', affectedCount: r2Affected.length, affectedIds: r2Affected, description: 'Batteries in transit must link to a Dispatch Order.' },
      { id: 'R3', name: 'Certified units missing Cert Ref', status: r3Affected.length > 0 ? 'WARN' : 'PASS', severity: 'MED', affectedCount: r3Affected.length, affectedIds: r3Affected, description: 'EOL PASS units should have a generated certificate reference.' },
      { id: 'R4', name: 'Inventory missing Location', status: r4Affected.length > 0 ? 'WARN' : 'PASS', severity: 'LOW', affectedCount: r4Affected.length, affectedIds: r4Affected, description: 'Available/Reserved units must have a shelf location.' },
      { id: 'R5', name: 'Uncontained Failures', status: r5Affected.length > 0 ? 'FAIL' : 'PASS', severity: 'HIGH', affectedCount: r5Affected.length, affectedIds: r5Affected, description: 'Failed units must be Quarantined, Reworked, or Scrapped.' },
      { id: 'R6', name: 'Stale Reservations (>7 days)', status: r6Affected.length > 0 ? 'WARN' : 'PASS', severity: 'MED', affectedCount: r6Affected.length, affectedIds: r6Affected, description: 'Reserved stock not dispatched within SLA.' },
    ];
  }

  async buildEvidencePackForBattery(batteryId: string): Promise<EvidencePack | null> {
    const battery = await batteryService.getBatteryById(batteryId);
    if (!battery) return null;

    const findings = await findingsStore.listFindings();
    const relatedFindings = findings.filter(f => f.linkedId === batteryId);

    return {
      generatedAt: new Date().toISOString(),
      subject: { type: 'Battery', id: battery.id },
      identity: {
        sn: battery.serialNumber,
        batch: battery.batchId,
        bms: battery.bmsUid,
        firmware: battery.firmwareVersion
      },
      lifecycle: [
        { stage: 'Created', timestamp: battery.manufacturedAt || '', status: 'OK' },
        { stage: 'Provisioned', timestamp: battery.provisioningLogs?.[0]?.timestamp || '', status: battery.provisioningStatus },
        { stage: 'EOL Test', timestamp: battery.eolMeasurements?.timestamp || '', status: battery.eolResult || 'PENDING' },
        { stage: 'Inventory', timestamp: battery.inventoryEnteredAt || '', status: battery.inventoryStatus || 'N/A' },
        { stage: 'Current', timestamp: battery.lastSeen, status: battery.status }
      ],
      qa: {
        result: battery.eolResult,
        measurements: battery.eolMeasurements,
        certificate: battery.certificateRef
      },
      movements: battery.inventoryMovementLog || [],
      findings: relatedFindings
    };
  }

  // TODO: Implement battery/batch/dispatch evidence builders if needed
}

export const complianceService = new ComplianceService();
