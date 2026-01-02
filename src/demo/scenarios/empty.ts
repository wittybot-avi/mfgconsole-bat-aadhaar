
export const seedEmpty = () => {
  // Empty is handled by the clear logic in resetAndSeedAllStores
  // but we ensure basic empty arrays are written to prevent null pointers in legacy code
  localStorage.setItem('aayatana_skus_v1', JSON.stringify([]));
  localStorage.setItem('aayatana_cell_lots_v1', JSON.stringify([]));
  localStorage.setItem('aayatana_modules_v1', JSON.stringify([]));
  localStorage.setItem('aayatana_packs_v1', JSON.stringify([]));
  localStorage.setItem('aayatana_lineage_events_v1', JSON.stringify([]));
};
