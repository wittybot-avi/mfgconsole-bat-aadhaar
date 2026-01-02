import { safeStorage } from '../utils/safeStorage';
import { EolTestRun, EolTestItem, PackInstance, PackStatus, QuarantineRecord, Battery, BatteryStatus, CustodyStatus } from '../domain/types';
import { packAssemblyService } from './packAssemblyService';
import { batteryService } from './api';

class EolQaService {
  private TEST_RUN_STORAGE_KEY = 'aayatana_eol_test_runs_v1';
  private QUARANTINE_STORAGE_KEY = 'aayatana_quarantine_v1';

  private loadTestRuns(): EolTestRun[] {
    const data = safeStorage.getItem(this.TEST_RUN_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveTestRuns(runs: EolTestRun[]) {
    safeStorage.setItem(this.TEST_RUN_STORAGE_KEY, JSON.stringify(runs));
  }

  private loadQuarantine(): QuarantineRecord[] {
    const data = safeStorage.getItem(this.QUARANTINE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveQuarantine(records: QuarantineRecord[]) {
    safeStorage.setItem(this.QUARANTINE_STORAGE_KEY, JSON.stringify(records));
  }

  private getDefaultItems(): EolTestItem[] {
    return [
      { id: 'elec-1', group: 'Electrical', name: 'Open Circuit Voltage (OCV)', required: true, status: 'NOT_RUN', unit: 'V', threshold: '48.0 - 54.0' },
      { id: 'elec-2', group: 'Electrical', name: 'Internal Resistance (IR)', required: true, status: 'NOT_RUN', unit: 'mΩ', threshold: '< 35.0' },
      { id: 'elec-3', group: 'Electrical', name: 'Insulation Resistance', required: true, status: 'NOT_RUN', unit: 'MΩ', threshold: '> 500' },
      { id: 'bms-1', group: 'BMS', name: 'CAN Communication Handshake', required: true, status: 'NOT_RUN' },
      { id: 'bms-2', group: 'BMS', name: 'Firmware Revision Check', required: true, status: 'NOT_RUN' },
      { id: 'mech-1', group: 'Mechanical', name: 'Torque Inspection (Busbars)', required: true, status: 'NOT_RUN' },
      { id: 'mech-2', group: 'Mechanical', name: 'Visual Case Inspection', required: true, status: 'NOT_RUN' }
    ];
  }

  async listEolQueue(filters?: { status?: PackStatus, batchId?: string }): Promise<PackInstance[]> {
    const allPacks = await packAssemblyService.listPacks();
    const eolStatuses = [
      PackStatus.READY_FOR_EOL, 
      PackStatus.IN_EOL_TEST, 
      PackStatus.PASSED, 
      PackStatus.FAILED, 
      PackStatus.QUARANTINED
    ];
    
    let filtered = allPacks.filter(p => eolStatuses.includes(p.status));
    if (filters?.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters?.batchId) {
      filtered = filtered.filter(p => p.batchId === filters.batchId);
    }
    return filtered;
  }

  async getTestRun(packId: string): Promise<EolTestRun | undefined> {
    return this.loadTestRuns().find(r => r.packId === packId);
  }

  async createOrLoadTestRun(packId: string, actor: string): Promise<EolTestRun> {
    const runs = this.loadTestRuns();
    let run = runs.find(r => r.packId === packId);
    
    if (!run) {
      run = {
        id: `TR-${Date.now().toString().slice(-6)}`,
        packId,
        startedAt: new Date().toISOString(),
        actor,
        items: this.getDefaultItems(),
        computedResult: 'PENDING'
      };
      runs.unshift(run);
      this.saveTestRuns(runs);
      
      await packAssemblyService.updatePack(packId, { 
        status: PackStatus.IN_EOL_TEST,
        eolStatus: 'PENDING'
      });
    }
    return run;
  }

  async updateTestItem(packId: string, itemId: string, patch: Partial<EolTestItem>): Promise<EolTestRun> {
    const runs = this.loadTestRuns();
    const rIdx = runs.findIndex(r => r.packId === packId);
    if (rIdx === -1) throw new Error("Test run not found");

    const iIdx = runs[rIdx].items.findIndex(i => i.id === itemId);
    if (iIdx === -1) throw new Error("Item not found");

    runs[rIdx].items[iIdx] = { ...runs[rIdx].items[iIdx], ...patch };
    
    const item = runs[rIdx].items[iIdx];
    if (item.measurement !== undefined && item.threshold) {
      if (item.threshold.startsWith('<')) {
        const limit = parseFloat(item.threshold.replace('<', '').trim());
        item.status = item.measurement < limit ? 'PASS' : 'FAIL';
      } else if (item.threshold.startsWith('>')) {
        const limit = parseFloat(item.threshold.replace('>', '').trim());
        item.status = item.measurement > limit ? 'PASS' : 'FAIL';
      }
    }

    const requiredItems = runs[rIdx].items.filter(i => i.required);
    if (requiredItems.some(i => i.status === 'FAIL')) {
      runs[rIdx].computedResult = 'FAIL';
    } else if (requiredItems.every(i => i.status === 'PASS' || i.status === 'NA')) {
      runs[rIdx].computedResult = 'PASS';
    } else {
      runs[rIdx].computedResult = 'PENDING';
    }

    this.saveTestRuns(runs);
    return runs[rIdx];
  }

  async startEolTest(packId: string, actor: string): Promise<void> {
    await packAssemblyService.updatePack(packId, { eolStatus: 'IN_TEST', eolPerformedBy: actor });
  }

  async finalizeDecision(packId: string, decision: 'PASS' | 'FAIL' | 'QUARANTINE' | 'SCRAP', payload: { actor: string, notes?: string, ncrId?: string, reason?: string }): Promise<void> {
    const runs = this.loadTestRuns();
    const rIdx = runs.findIndex(r => r.packId === packId);
    if (rIdx === -1) throw new Error("Test run not found");

    runs[rIdx].finalDecision = decision;
    runs[rIdx].decisionBy = payload.actor;
    runs[rIdx].decisionAt = new Date().toISOString();
    runs[rIdx].notes = payload.notes;
    runs[rIdx].completedAt = new Date().toISOString();
    this.saveTestRuns(runs);

    let newStatus = PackStatus.PASSED;
    let eolStatus: any = 'PASS';
    if (decision === 'PASS') {
      newStatus = PackStatus.PASSED;
      eolStatus = 'PASS';
    } else if (decision === 'FAIL' || decision === 'QUARANTINE') {
      newStatus = PackStatus.QUARANTINED;
      eolStatus = 'FAIL';
    } else if (decision === 'SCRAP') {
      newStatus = PackStatus.SCRAPPED;
      eolStatus = 'FAIL';
    }

    await packAssemblyService.updatePack(packId, { 
      status: newStatus,
      qcStatus: decision === 'PASS' ? 'PASSED' : 'FAILED',
      eolStatus: eolStatus,
      eolTimestamp: new Date().toISOString(),
      eolFailReason: payload.reason || payload.notes
    });

    if (decision === 'QUARANTINE') {
      const qRecords = this.loadQuarantine();
      qRecords.unshift({
        id: `QN-${Date.now().toString().slice(-4)}`,
        packId,
        reason: payload.reason || "Failed EOL Test",
        ncrId: payload.ncrId,
        createdAt: new Date().toISOString(),
        createdBy: payload.actor,
        notes: payload.notes
      });
      this.saveQuarantine(qRecords);
    }
  }

  /**
   * S8: Battery Create & Identity
   */
  async createBatteryFromPack(packId: string, actor: string): Promise<Battery> {
    const pack = await packAssemblyService.getPack(packId);
    if (!pack) throw new Error("Pack not found");
    if (pack.eolStatus !== 'PASS') throw new Error("Requires EOL PASS certification.");

    const existing = await batteryService.getBatteries();
    if (existing.some(b => b.packId === packId)) throw new Error("Battery record already initialized.");

    const newBattery: Battery = {
      id: `batt-${Date.now()}`,
      serialNumber: pack.packSerial || `SN-B-${Date.now().toString().slice(-4)}`,
      packId: pack.id,
      skuId: pack.skuId,
      batchId: pack.batchId || 'UNLINKED',
      qrCode: `QR-${pack.packSerial}`,
      plantId: 'PLANT-01',
      status: BatteryStatus.PROVISIONING,
      location: 'QA Testing Area',
      lastSeen: new Date().toISOString(),
      manufacturedAt: pack.createdAt,
      assemblyEvents: [],
      reworkFlag: false,
      scrapFlag: false,
      provisioningStatus: 'NOT_STARTED',
      cryptoProvisioned: false,
      soh: 100,
      soc: 0,
      voltage: 0,
      capacityAh: 100,
      eolResult: 'PASS',
      certificationStatus: 'CERTIFIED',
      certificateId: `CERT-${Date.now().toString().slice(-6)}`,
      notes: [{ author: actor, role: 'QA', text: 'Battery Identity Certified (S8)', timestamp: new Date().toISOString() }]
    };

    // Simulate creation in global mock store
    const currentBatts = JSON.parse(localStorage.getItem('aayatana_batteries_mock_v1') || '[]');
    currentBatts.unshift(newBattery);
    localStorage.setItem('aayatana_batteries_mock_v1', JSON.stringify(currentBatts));

    await packAssemblyService.updatePack(packId, { batteryRecordCreated: true });
    
    return newBattery;
  }

  /**
   * P45: Provisioning Queue Operations
   */
  async listProvisioningQueue(): Promise<Battery[]> {
    const batteries = await batteryService.getBatteries();
    // Assets in Provisioning stage that aren't yet DONE
    return batteries.filter(b => b.status === BatteryStatus.PROVISIONING && b.provisioningStatus !== 'DONE');
  }

  async getDispatchEligiblePacks(): Promise<PackInstance[]> {
    const all = await packAssemblyService.listPacks();
    return all.filter(p => p.status === PackStatus.PASSED && p.qcStatus === 'PASSED');
  }
}

export const eolQaService = new EolQaService();