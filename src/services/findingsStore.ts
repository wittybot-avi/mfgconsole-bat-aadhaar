export interface Finding {
  findingId: string;
  title: string;
  type: 'PROCESS' | 'QUALITY' | 'TRACEABILITY' | 'DATA_INTEGRITY';
  severity: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED';
  linkedType: 'battery' | 'batch' | 'dispatch';
  linkedId: string;
  ownerRole: string;
  ownerName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

class FindingsStore {
  private STORAGE_KEY = 'aayatana_findings_v1';

  private load(): Finding[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(findings: Finding[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(findings));
  }

  async listFindings(filters?: { status?: string, severity?: string, type?: string }): Promise<Finding[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let findings = this.load();
    if (filters) {
      if (filters.status && filters.status !== 'ALL') findings = findings.filter(f => f.status === filters.status);
      if (filters.severity && filters.severity !== 'ALL') findings = findings.filter(f => f.severity === filters.severity);
      if (filters.type && filters.type !== 'ALL') findings = findings.filter(f => f.type === filters.type);
    }
    return findings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createFinding(payload: Partial<Finding>): Promise<Finding> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const findings = this.load();
    const newFinding: Finding = {
      findingId: `FIND-${Date.now().toString().slice(-6)}`,
      title: payload.title || 'Untitled Finding',
      type: payload.type || 'PROCESS',
      severity: payload.severity || 'LOW',
      status: 'OPEN',
      linkedType: payload.linkedType || 'battery',
      linkedId: payload.linkedId || 'unknown',
      ownerRole: payload.ownerRole || 'Unknown',
      ownerName: payload.ownerName || 'System',
      notes: payload.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    findings.unshift(newFinding);
    this.save(findings);
    return newFinding;
  }

  async updateFinding(id: string, patch: Partial<Finding>): Promise<Finding> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const findings = this.load();
    const idx = findings.findIndex(f => f.findingId === id);
    if (idx === -1) throw new Error("Finding not found");
    
    findings[idx] = { ...findings[idx], ...patch, updatedAt: new Date().toISOString() };
    this.save(findings);
    return findings[idx];
  }

  async closeFinding(id: string, notes: string): Promise<Finding> {
    const findings = this.load();
    const idx = findings.findIndex(f => f.findingId === id);
    if (idx === -1) throw new Error("Finding not found");
    
    findings[idx] = { 
        ...findings[idx], 
        status: 'CLOSED', 
        notes: findings[idx].notes + `\n[CLOSED]: ${notes}`, 
        updatedAt: new Date().toISOString() 
    };
    this.save(findings);
    return findings[idx];
  }
}

export const findingsStore = new FindingsStore();