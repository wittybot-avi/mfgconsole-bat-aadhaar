export const seedHappyPath = () => {
  const now = new Date().toISOString();
  const past = new Date(Date.now() - 3600000).toISOString();
  
  const skus = [{
    id: 'sku-happy',
    skuCode: 'VV360-LFP-HAPPY',
    skuName: 'Vanguard Happy Path',
    version: '1.0.0',
    chemistry: 'LFP',
    formFactor: 'Prismatic',
    seriesCount: 16,
    parallelCount: 1,
    nominalVoltage: 48,
    capacityAh: 100,
    requiredModules: 1,
    status: 'ACTIVE',
    rules: { minCells: 16, maxCells: 16, allowedChemistry: ['LFP'], requiredScans: ['CELL_SERIAL'] },
    createdAt: now,
    updatedAt: now
  }];

  const lots = [{
    id: 'lot-happy',
    lotCode: 'CATL-HAPPY-PATH',
    supplierName: 'CATL',
    supplierLotNo: 'SL-HAPPY-001',
    chemistry: 'LFP',
    formFactor: 'Prismatic',
    capacityAh: 100,
    receivedDate: '2024-05-01',
    quantityReceived: 100,
    status: 'READY_TO_BIND',
    generatedCount: 100,
    scannedCount: 100,
    boundCount: 80,
    createdAt: now,
    updatedAt: now
  }];

  // 1. Pack already PASS
  const packs = [
    {
      id: 'PB-CERT-001',
      skuId: 'sku-happy',
      skuCode: 'VV360-LFP-HAPPY',
      requiredModules: 1,
      moduleIds: ['MOD-HAPPY-01'],
      status: 'PASSED',
      packSerial: 'SN-VANG-2024-001',
      qcStatus: 'PASSED',
      eolStatus: 'PASS',
      eolPerformedBy: 'QA Engineer',
      eolTimestamp: past,
      batteryRecordCreated: false,
      createdBy: 'System Seeder',
      createdAt: past,
      updatedAt: past
    },
    {
      id: 'PB-FAIL-001',
      skuId: 'sku-happy',
      skuCode: 'VV360-LFP-HAPPY',
      requiredModules: 1,
      moduleIds: ['MOD-HAPPY-02'],
      status: 'QUARANTINED',
      packSerial: 'SN-VANG-2024-ERR',
      qcStatus: 'FAILED',
      eolStatus: 'FAIL',
      eolFailReason: 'Voltage ripple exceeds threshold',
      createdBy: 'System Seeder',
      createdAt: past,
      updatedAt: past
    },
    {
      id: 'PB-PEND-001',
      skuId: 'sku-happy',
      skuCode: 'VV360-LFP-HAPPY',
      requiredModules: 1,
      moduleIds: ['MOD-HAPPY-03'],
      status: 'READY_FOR_EOL',
      packSerial: 'SN-VANG-2024-PEND-1',
      qcStatus: 'PASSED',
      createdBy: 'System Seeder',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'PB-PEND-002',
      skuId: 'sku-happy',
      skuCode: 'VV360-LFP-HAPPY',
      requiredModules: 1,
      moduleIds: ['MOD-HAPPY-04'],
      status: 'READY_FOR_EOL',
      packSerial: 'SN-VANG-2024-PEND-2',
      qcStatus: 'PASSED',
      createdBy: 'System Seeder',
      createdAt: now,
      updatedAt: now
    }
  ];

  localStorage.setItem('aayatana_skus_v1', JSON.stringify(skus));
  localStorage.setItem('aayatana_cell_lots_v1', JSON.stringify(lots));
  localStorage.setItem('aayatana_packs_v1', JSON.stringify(packs));
};