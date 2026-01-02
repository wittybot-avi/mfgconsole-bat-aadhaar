import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchService } from '../services/api';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { Batch, BatchStatus, BatchNote } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '../components/ui/design-system';
import { ArrowLeft, AlertTriangle, Lock, PlayCircle, ClipboardList, Box, Layers, Plus, ArrowRight, X } from 'lucide-react';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';
import { routes } from '../../app/routes';

const CreateModulesModal = ({ isOpen, onClose, onCreated, batch }: any) => {
  const [count, setCount] = useState(batch?.targetQuantity || 1);
  const [loading, setLoading] = useState(false);
  const { currentRole, currentCluster } = useAppStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const actor = `${currentRole?.name} (${currentCluster?.id})`;
      await moduleAssemblyService.createBatchModules(
        batch.id, 
        batch.skuId || 'sku-happy', 
        batch.sku, 
        count, 
        batch.seriesCount || 16, 
        actor
      );
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Initialize Modules
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Generating assembly work orders for Batch <span className="font-bold text-foreground">{batch.batchNumber}</span>.</p>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-500">Number of Modules</label>
            <Input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 0)} />
            <p className="text-[10px] text-slate-400 italic">Default matches batch target quantity.</p>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || count <= 0}>
              {loading ? 'Generating...' : 'Create Work Orders'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const NoteItem = ({ note }: { note: BatchNote, key?: any }) => (
  <div className="border-b last:border-0 pb-3 mb-3">
    <div className="flex justify-between items-start mb-1">
      <span className="font-semibold text-sm">{note.author} <span className="text-xs font-normal text-muted-foreground">({note.role})</span></span>
      <span className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</span>
    </div>
    <div className="text-sm">
      {note.type !== 'General' && <Badge variant="outline" className="mr-2 text-[10px] font-bold">{note.type}</Badge>}
      {note.text}
    </div>
  </div>
);

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModulesOpen, setIsCreateModulesOpen] = useState(false);

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadBatch(id);
  }, [id]);

  const loadBatch = async (batchId: string) => {
    setLoading(true);
    const data = await batchService.getBatchById(batchId);
    if (!data) {
        addNotification({ title: 'Redirection', message: 'Batch not found. Redirecting to queue.', type: 'info' });
        navigate(routes.batchesList());
        return;
    }
    setBatch(data);
    setLoading(false);
  };

  if (loading || !batch) return <div className="p-10 text-center animate-pulse">Syncing batch ledger...</div>;

  const guards = workflowGuardrails.getBatchGuardrail(batch, clusterId);

  const handleRelease = async () => {
    try {
        await batchService.updateBatch(batch.id, { status: BatchStatus.IN_PRODUCTION });
        addNotification({ title: "Released", message: "Batch released to shopfloor.", type: "success" });
        loadBatch(batch.id);
    } catch (e) {
        addNotification({ title: "Error", message: "Action failed", type: "error" });
    }
  };

  const handleCreated = () => {
    addNotification({ title: 'Work Orders Ready', message: 'Modules generated in assembly queue.', type: 'success' });
    navigate(`${routes.moduleAssemblyList()}?batchId=${batch.id}`);
  };

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S3"
        title="Manufacturing Authorization"
        objective="Activate production planning for a specific SKU lot and authorize resource allocation."
        entityLabel={batch.batchNumber}
        status={batch.status}
        diagnostics={{ route: '/batches', entityId: batch.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(routes.batchesList())} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Production Log
            </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <NextStepsPanel entity={batch} type="BATCH" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2 border-b bg-slate-50/50 dark:bg-slate-800/30"><CardTitle className="text-lg flex items-center gap-2"><ClipboardList size={18} className="text-primary"/> Production Plan</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-6 pt-6">
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Target Quantity</p><p className="text-2xl font-black text-slate-800 dark:text-slate-100">{batch.targetQuantity}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Yield</p><p className="text-2xl font-black text-emerald-600">{batch.qtyPassedEOL}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">SKU Blueprint</p><p className="text-sm font-bold font-mono text-indigo-600 truncate">{batch.sku}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Plant Location</p><p className="text-sm font-bold uppercase">{batch.plantId}</p></div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2 border-b bg-slate-50/50 dark:bg-slate-800/30"><CardTitle className="text-lg flex items-center gap-2"><Box size={18} className="text-primary"/> Process Audit</CardTitle></CardHeader>
                    <CardContent className="max-h-[250px] overflow-y-auto pt-4 pr-2">
                        {batch.notes.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-8">No audit events recorded for this lot.</p> : batch.notes.map(note => <NoteItem key={note.id} note={note} />)}
                    </CardContent>
                </Card>
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-4 shrink-0">
             <Card className="bg-slate-900 text-white border-none shadow-xl">
                 <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-sm uppercase tracking-wider text-slate-400">Workstation Control</CardTitle></CardHeader>
                 <CardContent className="space-y-4 pt-6">
                    {batch.status === BatchStatus.DRAFT ? (
                        <ActionGuard 
                            guard={guards.release} 
                            onClick={handleRelease} 
                            label="Release to Shopfloor" 
                            icon={PlayCircle} 
                            className="w-full h-12 bg-primary hover:bg-primary/90 border-none shadow-lg shadow-primary/20 font-bold"
                            actionName="Release_Batch"
                            entityId={batch.id}
                        />
                    ) : (
                        <div className="space-y-3">
                             <Button onClick={() => setIsCreateModulesOpen(true)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/10 font-bold gap-2">
                                <Plus size={18} /> Initialize Modules
                             </Button>
                             <Button onClick={() => navigate(`${routes.moduleAssemblyList()}?batchId=${batch.id}`)} variant="outline" className="w-full h-12 text-white border-slate-700 hover:bg-slate-800 font-bold gap-2">
                                <Layers size={18} /> Assembly Queue
                             </Button>
                        </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                        <ActionGuard 
                            guard={guards.close} 
                            onClick={() => addNotification({title: "Closed", message: "Batch record finalized.", type: "success"})} 
                            label="Finalize Batch Registry" 
                            icon={Lock} 
                            variant="outline"
                            className="w-full text-white border-slate-700 hover:bg-slate-800"
                            actionName="Finalize_Batch"
                            entityId={batch.id}
                        />
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded text-[10px] text-slate-400 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                        <p>Batch finalization requires target quantity parity and 100% EOL certification coverage.</p>
                    </div>
                 </CardContent>
             </Card>
          </div>
        </div>
      </div>

      <CreateModulesModal 
        isOpen={isCreateModulesOpen} 
        onClose={() => setIsCreateModulesOpen(false)} 
        onCreated={handleCreated}
        batch={batch}
      />
    </div>
  );
}