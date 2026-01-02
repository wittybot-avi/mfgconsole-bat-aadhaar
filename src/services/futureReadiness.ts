import { Battery } from '../domain/types';

export interface ReadinessField {
  label: string;
  value: string;
  status: 'AVAILABLE' | 'PARTIAL' | 'FUTURE';
  source?: string;
}

export interface DppReadiness {
  identity: ReadinessField[];
  conformity: ReadinessField[];
  traceability: ReadinessField[];
  composition: ReadinessField[];
  circularity: ReadinessField[];
}

export interface RegulatoryProfile {
  id: string;
  name: string;
  description: string;
  fieldCount: number;
  readinessPct: number;
}

class FutureReadinessService {
  
  analyzeDppReadiness(battery: Battery | null): DppReadiness {
    if (!battery) {
      // Return empty structure with placeholders
      return {
        identity: [], conformity: [], traceability: [], composition: [], circularity: []
      };
    }

    return {
      identity: [
        { label: 'Battery ID', value: battery.id, status: 'AVAILABLE', source: 'System' },
        { label: 'Batch ID', value: battery.batchId, status: 'AVAILABLE', source: 'Batch Record' },
        { label: 'Model / Variant', value: 'VV360-LFP-48V', status: 'PARTIAL', source: 'Batch Link (Derived)' },
        { label: 'Manufacturer', value: 'Aayatana Tech', status: 'AVAILABLE', source: 'Org Profile' },
        { label: 'Mfg Date', value: battery.manufacturedAt ? new Date(battery.manufacturedAt).toLocaleDateString() : 'Pending', status: battery.manufacturedAt ? 'AVAILABLE' : 'PARTIAL' },
      ],
      conformity: [
        { label: 'EOL Status', value: battery.eolResult || 'Not Tested', status: battery.eolResult ? 'AVAILABLE' : 'PARTIAL' },
        { label: 'Certificate Ref', value: battery.certificateRef || 'Pending', status: battery.certificateRef ? 'AVAILABLE' : 'PARTIAL' },
        { label: 'Firmware Version', value: battery.firmwareVersion || 'Unknown', status: battery.firmwareVersion ? 'AVAILABLE' : 'FUTURE' },
        { label: 'CE Marking', value: 'Pending', status: 'FUTURE' },
      ],
      traceability: [
        { label: 'Current Location', value: battery.location, status: 'AVAILABLE' },
        { label: 'Audit Trail Link', value: `/compliance/audit/${battery.id}`, status: 'AVAILABLE' },
        { label: 'Import Entry Ref', value: '-', status: 'FUTURE' },
      ],
      composition: [
        { label: 'Chemistry', value: 'LFP (LiFePO4)', status: 'PARTIAL', source: 'SKU Map' },
        { label: 'Critical Raw Materials', value: 'Lithium (3%), Graphite (12%)', status: 'FUTURE' },
        { label: 'Recycled Content', value: '0%', status: 'FUTURE' },
        { label: 'HazMat Declaration', value: '-', status: 'FUTURE' },
      ],
      circularity: [
        { label: 'SoH History', value: battery.soh ? `${battery.soh}% (Last)` : '-', status: battery.soh ? 'PARTIAL' : 'FUTURE' },
        { label: 'Repair History', value: battery.reworkFlag ? 'Reworked' : 'None', status: 'PARTIAL' },
        { label: 'Second Life Suitability', value: '-', status: 'FUTURE' },
        { label: 'Recycler Handover', value: '-', status: 'FUTURE' },
      ]
    };
  }

  getRegulatoryProfiles(): RegulatoryProfile[] {
    return [
      { id: 'EU_DPP', name: 'EU Battery Regulation (DPP)', description: 'JSON-LD format compliant with ESPR', fieldCount: 45, readinessPct: 45 },
      { id: 'IN_AADHAAR', name: 'India Battery Aadhaar', description: 'BEE compliance export (CSV)', fieldCount: 32, readinessPct: 70 },
      { id: 'OEM_STD', name: 'OEM Standard Template', description: 'Automotive tier-1 exchange format', fieldCount: 28, readinessPct: 90 },
    ];
  }

  getSustainabilityMetrics() {
    return {
      co2: { value: '85 kg', status: 'FUTURE' },
      energy: { value: '14.2 kWh', status: 'FUTURE' },
      scrap: { value: '1.2%', status: 'PARTIAL', source: 'Quality Module' },
      water: { value: 'Pending', status: 'FUTURE' },
    };
  }
}

export const futureReadinessService = new FutureReadinessService();