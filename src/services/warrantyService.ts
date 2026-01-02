import { WarrantyClaim, ClaimStatus, ClaimPriority, FailureCategory, ClaimDisposition, LiabilityAttribution, Battery, CustodyStatus } from '../domain/types';
import { batteryService, dispatchService } from './api';

export interface WarrantyMetrics {
  open: number;
  underAnalysis: number;
  avgResolutionDays: number;
  highPriority: number;
  byCategory: Array<{ name: string; value: number }>;
}

class WarrantyService {
  private STORAGE_KEY = 'aayatana_warranty_claims_v1';

  private load(): WarrantyClaim[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(claims: WarrantyClaim[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(claims));
  }

  /**
   * List claims filtered by RBAC.
   * C9: Only claims for batteries assigned to their customer/org.
   * C6: Only LOGISTICS_DAMAGE.
   */
  async listClaims(clusterId: string, filters?: any): Promise<WarrantyClaim[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    let claims = this.load();

    if (clusterId === 'C9') {
      // Mock filter: Assume C9 session maps to "Mega Motors" or "PowerWall" or generic matching
      // For demo, we just return claims where customerName includes "Customer" or "Mega" or "Power"
      // or if createdByRole is C9_OEM
      claims = claims.filter(c => c.customerName.includes('Customer') || c.customerName.includes('Mega') || c.customerName.includes('Power') || c.createdByRole === 'OEM Partner');
    } else if (clusterId === 'C6') {
      // Logistics only sees Logistics Damage
      claims = claims.filter(c => c.failureCategory === FailureCategory.LOGISTICS_DAMAGE);
    }

    // Apply standard filters
    if (filters) {
      if (filters.status && filters.status !== 'All') claims = claims.filter(c => c.status === filters.status);
      if (filters.priority && filters.priority !== 'All') claims = claims.filter(c => c.priority === filters.priority);
      if (filters.category && filters.category !== 'All') claims = claims.filter(c => c.failureCategory === filters.category);
    }

    return claims.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }

  async getClaim(claimId: string): Promise<WarrantyClaim | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.load().find(c => c.claimId === claimId);
  }

  async createClaim(payload: Partial<WarrantyClaim>, session: { role: string, user: string, cluster: string }): Promise<WarrantyClaim> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Eligibility Check
    const battery = await batteryService.getBatteryById(payload.batteryId!);
    if (!battery) throw new Error("Battery not found");
    
    // Allow claims on DELIVERED (received but damaged), ACCEPTED (field issue), or REJECTED (RMA).
    if (battery.custodyStatus !== CustodyStatus.ACCEPTED && 
        battery.custodyStatus !== CustodyStatus.DELIVERED && 
        battery.custodyStatus !== CustodyStatus.REJECTED) {
        throw new Error("Claims can only be raised for batteries that have been received/accepted by customer.");
    }

    const claims = this.load();
    const newClaim: WarrantyClaim = {
      claimId: `CLM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: ClaimStatus.OPEN,
      priority: ClaimPriority.MEDIUM, // Default
      evidenceAttachments: [],
      reportedAt: new Date().toISOString(),
      createdByRole: session.role,
      createdByName: session.user,
      batteryId: payload.batteryId!,
      batchId: battery.batchId,
      customerName: payload.customerName || 'Unknown', // Should be enriched from Dispatch
      failureCategory: payload.failureCategory || FailureCategory.UNKNOWN,
      symptoms: payload.symptoms || '',
      ...payload
    } as WarrantyClaim;

    claims.unshift(newClaim);
    this.save(claims);
    return newClaim;
  }

  async updateClaim(claimId: string, patch: Partial<WarrantyClaim>, session: { user: string }): Promise<WarrantyClaim> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const claims = this.load();
    const idx = claims.findIndex(c => c.claimId === claimId);
    if (idx === -1) throw new Error("Claim not found");

    claims[idx] = { ...claims[idx], ...patch };
    
    // Append logic for evidence if array sent? Assuming replace for simple update
    if (patch.evidenceAttachments && claims[idx].evidenceAttachments !== patch.evidenceAttachments) {
        // merged handled by spread if passed full array
    }

    this.save(claims);
    return claims[idx];
  }

  async decideDisposition(claimId: string, decision: { disposition: ClaimDisposition, liability: LiabilityAttribution, notes: string }, session: { user: string }): Promise<WarrantyClaim> {
    return this.updateClaim(claimId, {
      disposition: decision.disposition,
      liabilityAttribution: decision.liability,
      decisionNotes: decision.notes,
      status: ClaimStatus.DECIDED,
      decidedAt: new Date().toISOString(),
      decidedBy: session.user
    }, session);
  }

  async closeClaim(claimId: string, notes: string, session: { user: string }): Promise<WarrantyClaim> {
    return this.updateClaim(claimId, {
      status: ClaimStatus.CLOSED,
      closureNotes: notes,
      closedAt: new Date().toISOString()
    }, session);
  }

  async getMetrics(clusterId: string): Promise<WarrantyMetrics> {
    const claims = await this.listClaims(clusterId);
    
    const byCategoryMap = new Map<string, number>();
    claims.forEach(c => {
      byCategoryMap.set(c.failureCategory, (byCategoryMap.get(c.failureCategory) || 0) + 1);
    });

    // Sort by count desc
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    // Mock resolution time
    const avgResolutionDays = 4.2;

    return {
      open: claims.filter(c => c.status === ClaimStatus.OPEN).length,
      underAnalysis: claims.filter(c => c.status === ClaimStatus.UNDER_ANALYSIS || c.status === ClaimStatus.AWAITING_EVIDENCE).length,
      highPriority: claims.filter(c => c.priority === ClaimPriority.HIGH || c.priority === ClaimPriority.CRITICAL).length,
      avgResolutionDays,
      byCategory
    };
  }
  
  // Helper to find eligible batteries for C9 intake
  async getEligibleBatteriesForCustomer(customerName: string): Promise<Battery[]> {
      const all = await batteryService.getBatteries();
      // In real app, filter by customer ownership.
      // Mock: Return ACCEPTED batteries.
      return all.filter(b => b.custodyStatus === CustodyStatus.ACCEPTED || b.custodyStatus === CustodyStatus.DELIVERED);
  }
}

export const warrantyService = new WarrantyService();