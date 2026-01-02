import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { batchService } from '../services/api';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { Batch, BatchStatus, CellLot } from '../domain/types';
import { Button, Input, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Card, CardContent } from '../components/ui/design-system';
import { Plus, Search, Filter, Eye, MoreHorizontal, FileDown, Lock, Unlock, AlertTriangle, CheckCircle, Loader2, PackageOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { routes } from '../../app/routes';

// --- Types & Helpers ---

const getStatusVariant = (status: BatchStatus) => {
  switch (status) {
    case BatchStatus.CLOSED: return 'success';
    case BatchStatus.IN_PRODUCTION: return 'default';
    case BatchStatus.ON_HOLD: return 'destructive';
    case BatchStatus.QA_REVIEW: return 'warning';
    case BatchStatus.RELEASED_TO_INVENTORY: return 'secondary';
    case BatchStatus.DRAFT: return 'outline';
    default: return 'outline';
  }
};

// --- Create Modal ---

const createBatchSchema = z.object({
  batchNumber: z.string().min(3, "Batch number required"),
  sku: z.string().min(1, "SKU required"),
  quantity: z.number().min(1, "Quantity must be > 0"),
  plantId: z.string().min(1, "Plant ID required"),
  prefillLotId: z.string().optional()
});

const CreateBatchModal = ({ isOpen, onClose, onCreated, prefillData }: any) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      batchNumber: `B-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`,
      plantId: 'PLANT-01',
      sku: prefillData?.sku || '',
      quantity: prefillData?.quantity || 100,
      prefillLotId: prefillData?.lotId || ''
    }
  });

  useEffect(() => {
    if (prefillData) {
      setValue('sku', prefillData.sku);
      setValue('quantity', prefillData.quantity);
      setValue('prefillLotId', prefillData.lotId);
    }
  }, [prefillData, setValue]);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await batchService.createBatch({
        batchNumber: data.batchNumber,
        sku: data.sku,
        targetQuantity: data.quantity,
        plantId: data.plantId,
        supplierLots: data.prefillLotId ? [{ id: data.prefillLotId, lotType: 'Cell', supplierName: 'Linked', supplierLotId: data.prefillLotId, receivedDate: new Date().toISOString(), qtyConsumed: data.quantity }] : []
      });
      reset();
      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[500px] shadow-xl border dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4">Create Manufacturing Batch</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {prefillData && (
             <div className="bg-primary/5 p-3 rounded border border-primary/20 flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div className="text-xs">
                    <p className="font-bold">Bridged from Inbound Lot</p>
                    <p className="text-muted-foreground opacity-70">Lot: {prefillData.lotCode}</p>
                </div>
             </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Number</label>
              <Input {...register('batchNumber')} placeholder="e.g. B-2024-001" />
              {errors.batchNumber && <p className="text-xs text-red-500">{errors.batchNumber.message as string}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plant ID</label>
              <Input {...register('plantId')} placeholder="e.g. PLANT-01" />
              {errors.plantId && <p className="text-xs text-red-500">{errors.plantId.message as string}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SKU Config</label>
            <Input {...register('sku')} placeholder="e.g. VV360-LFP-48V" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Quantity</label>
            <Input type="number" {...register('quantity', { valueAsNumber: true })} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Order'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function Batches() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentCluster, currentRole, addNotification } = useAppStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<any>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // RBAC Checks
  const canCreate = currentCluster?.id === 'C2' || currentCluster?.id === 'CS';
  const canExport = ['C1','C3','C6','C7','C8','C9','CS'].includes(currentCluster?.id || '');

  useEffect(() => {
    loadBatches();
    checkPrefill();
  }, []);

  const checkPrefill = async () => {
    const lotId = searchParams.get('prefillLotId');
    if (lotId && canCreate) {
        try {
            const lot = await cellTraceabilityService.getLot(lotId);
            if (lot) {
                setPrefillData({
                    lotId: lot.id,
                    lotCode: lot.lotCode,
                    sku: '', // In real app, map chemistry to SKU
                    quantity: lot.quantityReceived
                });
                setIsCreateOpen(true);
                // Clean up URL
                setSearchParams({});
            }
        } catch (e) {}
    }
  };

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchService.getBatches();
      setBatches(data);
    } catch (err) {
      console.error("Failed to load batches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    addNotification({ title: "Success", message: "Batch created successfully", type: "success" });
    loadBatches();
    setPrefillData(null);
  };

  const handleExport = (batch: Batch) => {
    addNotification({ title: "Export Started", message: `Downloading summary for ${batch.batchNumber}...`, type: "info" });
  };

  const filteredBatches = batches.filter(b => {
    const matchesSearch = 
      b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manufacturing Batches</h2>
          <p className="text-muted-foreground">Manage production lots, BOMs, and EOL testing.</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setIsCreateOpen(true)} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" /> Create Batch
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search batches by ID or SKU..." 
                className="pl-9" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(BatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Product / SKU</TableHead>
                <TableHead>Chemistry</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={8} className="py-6">
                       <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <PackageOpen className="h-12 w-12 opacity-10 mb-2" />
                      <p className="font-medium">No production batches found.</p>
                      <p className="text-xs">Try adjusting filters or checking the current demo scenario.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((batch) => (
                  <TableRow key={batch.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(routes.batchDetails(batch.id))}>
                    <TableCell className="font-medium">
                      {batch.batchNumber}
                      {batch.holdRequestPending && <AlertTriangle className="inline ml-2 h-3 w-3 text-amber-500" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{batch.packModelId}</span>
                        <span className="text-xs text-muted-foreground">{batch.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>{batch.chemistry}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        Target: {batch.targetQuantity}<br/>
                        Built: {batch.qtyBuilt}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800 mb-1 max-w-[100px]">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(batch.qtyBuilt / batch.targetQuantity) * 100}%` }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{batch.eolPassRatePct}% Yield</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(batch.status)}>{batch.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => navigate(routes.batchDetails(batch.id))} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canExport && (
                          <Button variant="ghost" size="icon" onClick={() => handleExport(batch)} title="Export">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <CreateBatchModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={handleCreateSuccess} prefillData={prefillData} />
    </div>
  );
}