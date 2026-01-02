import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input } from '../components/ui/design-system';
import { Plus, Search, ArrowRight, Copy, Loader2, X, Wand2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { routes } from '../../app/routes';

const SkuModal = ({ isOpen, onClose, onSave, initialData }: any) => {
  const [formData, setFormData] = useState<Partial<Sku>>(initialData || {
    skuCode: '',
    skuName: '',
    chemistry: 'LFP',
    formFactor: 'Prismatic',
    seriesCount: 16,
    parallelCount: 1,
    nominalVoltage: 48,
    capacityAh: 100,
    bmsType: 'Standard-BMS',
    firmwareFamily: 'GEN-FW',
    status: 'DRAFT'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {initialData?.id ? 'Clone SKU Configuration' : 'Design New SKU'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU Code</label>
              <Input value={formData.skuCode} onChange={e => setFormData({...formData, skuCode: e.target.value})} placeholder="e.g. VV48-A" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input value={formData.skuName} onChange={e => setFormData({...formData, skuName: e.target.value})} placeholder="e.g. Vanguard 48V" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chemistry</label>
              <select className="w-full h-10 p-2 border rounded bg-background" value={formData.chemistry} onChange={e => setFormData({...formData, chemistry: e.target.value as any})}>
                <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
                <option value="LTO">LTO (Lithium Titanate)</option>
                <option value="Na-Ion">Na-Ion (Sodium Ion)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Form Factor</label>
              <select className="w-full h-10 p-2 border rounded bg-background" value={formData.formFactor} onChange={e => setFormData({...formData, formFactor: e.target.value as any})}>
                <option value="Cylindrical">Cylindrical</option>
                <option value="Prismatic">Prismatic</option>
                <option value="Pouch">Pouch</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Series Count (S)</label>
              <Input type="number" value={formData.seriesCount} onChange={e => setFormData({...formData, seriesCount: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Parallel Count (P)</label>
              <Input type="number" value={formData.parallelCount} onChange={e => setFormData({...formData, parallelCount: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal Voltage (V)</label>
              <Input type="number" value={formData.nominalVoltage} onChange={e => setFormData({...formData, nominalVoltage: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacity (Ah)</label>
              <Input type="number" value={formData.capacityAh} onChange={e => setFormData({...formData, capacityAh: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-2 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(formData)}>
              {initialData?.id ? 'Create Clone' : 'Save Blueprint'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function SkuList() {
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [skus, setSkus] = useState<Sku[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    loadSkus();
  }, []);

  const loadSkus = async () => {
    setLoading(true);
    try {
      const data = await skuService.listSkus();
      setSkus(data);
    } catch (e) {
      console.error("Failed to load SKUs", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = skus.filter(s => 
    s.skuCode.toLowerCase().includes(search.toLowerCase()) || 
    s.skuName.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = currentCluster?.id === 'C2' || currentCluster?.id === 'CS' || currentCluster?.id === 'C4';

  const handleCreate = async (data: any) => {
    try {
      const newSku = await skuService.createSku(data);
      addNotification({ title: 'SKU Created', message: `${newSku.skuCode} blueprint is ready.`, type: 'success' });
      setIsModalOpen(false);
      navigate(routes.skuDetails(newSku.id));
    } catch (e) {
      addNotification({ title: 'Error', message: 'Failed to create SKU blueprint.', type: 'error' });
    }
  };

  const handleClone = async (e: React.MouseEvent, skuId: string) => {
    e.stopPropagation();
    try {
      const cloned = await skuService.cloneSku(skuId);
      addNotification({ title: 'SKU Cloned', message: `New revision created for ${cloned.skuCode}`, type: 'success' });
      loadSkus();
    } catch (err) {
      addNotification({ title: 'Clone Failed', message: 'Could not clone SKU configuration.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SKU Design Studio</h2>
          <p className="text-muted-foreground mt-1">
            Blueprints for battery assembly. Every unit manufactured inherits these specs.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => { setModalData(null); setIsModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> New Blueprint
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by code or name..." 
              className="pl-10 bg-white dark:bg-slate-950" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableHead className="font-bold">SKU Code</TableHead>
                <TableHead className="font-bold">Display Name</TableHead>
                <TableHead className="font-bold">Rev</TableHead>
                <TableHead className="font-bold">Chemistry</TableHead>
                <TableHead className="font-bold">Topology</TableHead>
                <TableHead className="font-bold">Specs</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary opacity-50" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p>No SKU blueprints found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(sku => (
                  <TableRow 
                    key={sku.id} 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" 
                    onClick={() => navigate(routes.skuDetails(sku.id))}
                  >
                    <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{sku.skuCode}</TableCell>
                    <TableCell className="font-medium">{sku.skuName}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono bg-white dark:bg-slate-900">v{sku.version}</Badge></TableCell>
                    <TableCell>{sku.chemistry}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{sku.seriesCount}S / {sku.parallelCount}P</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-bold">{sku.nominalVoltage}V</span> • {sku.capacityAh}Ah
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sku.status === 'ACTIVE' ? 'success' : sku.status === 'DRAFT' ? 'secondary' : 'destructive'}>
                        {sku.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={(e) => handleClone(e, sku.id)} title="Clone Blueprint">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          View <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <footer className="pt-10 text-center">
        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">SKU Module Restored (A.4)</p>
      </footer>

      <SkuModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCreate} 
        initialData={modalData} 
      />
    </div>
  );
}