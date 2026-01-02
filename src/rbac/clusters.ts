export interface Cluster {
  id: string;
  name: string;
  description: string;
}

export const CLUSTERS: Record<string, Cluster> = {
  CS: { id: 'CS', name: 'Super User (Full Access)', description: 'Unrestricted access to all modules and actions for development/demo.' },
  C1: { id: 'C1', name: 'Executive & Plant Leadership', description: 'Strategic oversight, reporting, full visibility.' },
  C2: { id: 'C2', name: 'Manufacturing & Production', description: 'Shopfloor execution, batch management, assembly.' },
  C3: { id: 'C3', name: 'Quality & Reliability', description: 'EOL testing, certification, QA approval.' },
  C4: { id: 'C4', name: 'Engineering & IT', description: 'System config, digital transformation, admin.' },
  C5: { id: 'C5', name: 'BMS & Firmware', description: 'Device provisioning, telemetry analysis.' },
  C6: { id: 'C6', name: 'Supply Chain & Logistics', description: 'Warehousing, inventory, dispatch.' },
  C7: { id: 'C7', name: 'Warranty & Service', description: 'Claims, RMA, field issues.' },
  C8: { id: 'C8', name: 'Compliance & Legal', description: 'Audit, ESG, digital records.' },
  C9: { id: 'C9', name: 'External Stakeholders', description: 'OEMs, partners, limited portal view.' },
};

export const CLUSTER_IDS = Object.keys(CLUSTERS);