export interface Role {
  id: string;
  name: string;
  clusterId: string;
  description?: string;
}

export const ROLES: Role[] = [
  // Super User
  { id: 'SUPER_ADMIN', name: 'System Administrator', clusterId: 'CS', description: 'Root access to all systems.' },

  // C1
  { id: 'C1_PLANT_HEAD', name: 'Plant Director', clusterId: 'C1' },
  { id: 'C1_COO', name: 'COO', clusterId: 'C1' },
  
  // C2
  { id: 'C2_PROD_MGR', name: 'Production Manager', clusterId: 'C2' },
  { id: 'C2_OPERATOR', name: 'Assembly Operator', clusterId: 'C2' },
  
  // C3
  { id: 'C3_QA_MGR', name: 'QA Manager', clusterId: 'C3' },
  { id: 'C3_TEST_ENG', name: 'Test Engineer', clusterId: 'C3' },
  
  // C4
  { id: 'C4_IT_LEAD', name: 'IT/Digital Lead', clusterId: 'C4' },
  { id: 'C4_AUTO_ENG', name: 'Automation Engineer', clusterId: 'C4' },
  
  // C5
  { id: 'C5_FIRMWARE', name: 'BMS Engineer', clusterId: 'C5' },
  
  // C6
  { id: 'C6_LOGISTICS', name: 'Logistics Coordinator', clusterId: 'C6' },
  { id: 'C6_WH_MGR', name: 'Warehouse Manager', clusterId: 'C6' },
  
  // C7
  { id: 'C7_WARRANTY', name: 'Warranty Manager', clusterId: 'C7' },
  
  // C8
  { id: 'C8_COMPLIANCE', name: 'Compliance Officer', clusterId: 'C8' },
  
  // C9
  { id: 'C9_OEM', name: 'OEM Partner', clusterId: 'C9' },
];

export const getRolesByCluster = (clusterId: string) => ROLES.filter(r => r.clusterId === clusterId);