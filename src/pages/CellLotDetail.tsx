import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { CellLot, CellSerialRecord } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, Fingerprint, Printer, ShieldCheck, Info, Scan, History, CheckCircle, Download, Database, AlertCircle, FileText, LayoutGrid, CheckSquare, Square, PlayCircle, Box } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

export default function CellLotDetail() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [lot, setLot] = useState<CellLot | null>(null);
  const [serials, setSerials] = useState<CellSerialRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isFailsafe, setIsFailsafe] = useState(false);

  // Form states
  const [genParams, setGenParams] = useState({
    prefix: '',
    start: 1,
    count: 0
  });
  const [scanInput, setScanInput] = useState('');

  const clusterId = currentCluster?.id || '';
  const isSuperAdmin = clusterId === 'CS';
  const isLogistics = clusterId === 'C6' || isSuperAdmin;
  const canScan = isSuperAdmin || clusterId === 'C2';

  useEffect(() => {
    // P54: Failsafe grace period
    const failsafeTimer = setTimeout(() => {
      if (loading && !lot && lotId?.startsWith('clot-failsafe')) {
         engageFailsafe(lotId);
      }
    }, 1500);

    if (lotId) loadData(lotId);

    return () => clearTimeout(failsafeTimer);
  }, [lotId]);

  const engageFailsafe = (id: string) => {
    console.warn("[P-054] engaging failsafe detail for", id);
    const mock = {
        id: id,
        lotCode: id.toUpperCase(),
        supplierName: 'Failsafe-Sourced',
        supplierLotNo: 'FS-99',
        chemistry: 'LFP',
        formFactor: 'Prismatic',
        capacityAh: 100,
        receivedDate: new Date().toISOString(),
        quantityReceived: 1000,
        status: 'PUBLISHED',
        generatedCount: 1000,
        scannedCount: 1000,
        boundCount: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    setLot(mock as any);
    setIsFailsafe(true);
    setLoading(false);
  };

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const l = await cellTraceabilityService.getLot(id);
      if (l) {
        setLot(l);
        const s = await cellTraceabilityService.listSerials(id);
        setSerials(s);
        setGenParams(prev => ({ ...prev, prefix: l.supplierName.slice(0, 3).toUpperCase(), count: l.quantityReceived }));
      } else if (id.startsWith('clot-failsafe')) {
        engageFailsafe(id);
      }
    } catch (e) {
      console.error("Ledger detail sync error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDoc = async (field: keyof CellLot, val: any) => {
    if (!lot || isFailsafe) return;
    try {
      const updated = await cellTraceabilityService.createLot({ ...lot, [field]: val } as any);
      setLot(updated);
      addNotification({ title: 'Updated', message: `${field} recorded.`, type: 'info' });
    } catch (e) {}
  };

  const handleGenerate = async () => {
    if (!lot || isFailsafe) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await cellTraceabilityService.generateSerials(lot.id, { ...genParams, format: 'DEFAULT' }, actor);
      addNotification({ title: 'Generated', message: `${genParams.count} serials generated for this lot.`, type: 'success' });
      await loadData(lot.id);
      setActiveTab('labels');
    } catch (any: any) {
      addNotification({ title: 'Error', message: any.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleScan = async () => {
    if (!lot || !scanInput || isFailsafe) return;
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await cellTraceabilityService.scanSerial(lot.id, scanInput, actor);
      setScanInput('');
      await loadData(lot.id);
      addNotification({ title: 'Scanned', message: `Confirmed serial: ${scanInput}`, type: 'success' });
    } catch (e: any) {
      addNotification({ title: 'Scan Error', message: e.message, type: 'error' });
    }
  };

  const handleRelease = async () => {
      if (!lot || isFailsafe) return;
      setProcessing(true);
      try {
          await cellTraceabilityService.createLot({ ...lot, status: 'PUBLISHED' } as any);
          addNotification({ title: 'Released', message: 'Lot is now available for production consumption.', type: 'success' });
          await loadData(lot.id);
      } finally {
          setProcessing(false);
      }
  };

  if (loading && !lot) return <div className="p-20 text-center animate-pulse text-sm font-mono tracking-widest text-slate-400">Syncing traceable records...</div>;

  const currentLot = lot!;
  const guards = workflowGuardrails.getCellLotGuardrail(currentLot, clusterId);
  const checklist = [
      { label: 'Inbound Docs Captured', status: (currentLot.poNumber && currentLot.invoiceNumber && currentLot.grnNumber) ? 'DONE' : 'PENDING', icon: FileText },
      { label: 'Identities Generated', status: currentLot.generatedCount > 0 ? 'DONE' : 'PENDING', icon: Fingerprint },
      { label: 'Identities Bound', status: (currentLot.scannedCount >= currentLot.generatedCount && currentLot.generatedCount > 0) ? 'DONE' : 'PENDING', icon: Scan },
      { label: 'QC Completed', status: currentLot.qcPassed ? 'DONE' : 'PENDING', icon: CheckCircle }
  ];

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S2"
        title="Incoming Material Receipt & Inbound Inventory"
        objective="Validate physical cell arrival against digital procurement records and generate immutable identities."
        entityLabel={currentLot.lotCode}
        status={currentLot.status}
        diagnostics={{ route: '/trace/cells', entityId: currentLot.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Trace Log
            </Button>
            {isFailsafe && (
                <Badge variant="warning" className="animate-pulse">FAILSAFE MODE</Badge>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <NextStepsPanel entity={currentLot} type="LOT" />

            <Card className="shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30">
                    <CardTitle className="text-base flex items-center gap-2"><CheckSquare size={18} className="text-primary"/> S2 Readiness Checklist</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {checklist.map((item, i) => (
                            <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${item.status === 'DONE' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                <div className={`${item.status === 'DONE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">{item.status}</p>
                                    <p className="text-xs font-bold leading-tight">{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
                {[
                  { id: 'overview', label: 'Lot Summary', icon: Info },
                  { id: 'docs', label: 'Inbound Docs', icon: FileText },
                  { id: 'serialize', label: 'Serialization', icon: Fingerprint },
                  { id: 'scan', label: 'Scan Confirm', icon: Scan }
                ].map(t => (
                  <button 
                    key={t.id} 
                    className={`pb-2 border-b-2 capitalize transition-all flex items-center gap-2 ${activeTab === t.id ? 'border-primary text-primary font-bold' : 'border-transparent'}`} 
                    onClick={() => setActiveTab(t.id)}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
            </div>

            <div className="animate-in fade-in duration-300">
                {activeTab === 'overview' && (
                    <Card>
                    <CardHeader><CardTitle className="text-lg">Physical Lot Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-6 gap-x-12">
                        <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Supplier Reference</label>
                        <p className="font-medium">{currentLot.supplierLotNo}</p>
                        </div>
                        <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Quantity</label>
                        <p className="font-medium text-lg">{currentLot.quantityReceived.toLocaleString()} cells</p>
                        </div>
                        <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Chemistry / Form</label>
                        <p className="font-medium">{currentLot.chemistry} • {currentLot.formFactor}</p>
                        </div>
                        <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Capacity Profile</label>
                        <p className="font-medium">{currentLot.capacityAh} Ah (Nominal)</p>
                        </div>
                        <div className="col-span-2 pt-4 border-t">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Current Progress</label>
                        <div className="mt-2 space-y-3">
                            <div className="flex justify-between text-sm">
                            <span>Confirmed Scans</span>
                            <span className="font-mono">{currentLot.scannedCount} / {currentLot.generatedCount || currentLot.quantityReceived}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(currentLot.scannedCount / (currentLot.generatedCount || 1)) * 100}%` }} />
                            </div>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                )}

                {activeTab === 'docs' && (
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Procurement Links</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">PO Number</label>
                                    <Input disabled={isFailsafe} value={currentLot.poNumber || ''} onChange={e => handleUpdateDoc('poNumber', e.target.value)} placeholder="PO-XXXX" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Invoice Number</label>
                                    <Input disabled={isFailsafe} value={currentLot.invoiceNumber || ''} onChange={e => handleUpdateDoc('invoiceNumber', e.target.value)} placeholder="INV-XXXX" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">GRN Number</label>
                                    <Input disabled={isFailsafe} value={currentLot.grnNumber || ''} onChange={e => handleUpdateDoc('grnNumber', e.target.value)} placeholder="GRN-XXXX" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Incoming QC Result</label>
                                    <div className="flex gap-2">
                                        <Button disabled={isFailsafe} variant={currentLot.qcPassed === true ? 'default' : 'outline'} className={currentLot.qcPassed ? 'bg-emerald-600' : ''} onClick={() => handleUpdateDoc('qcPassed', true)}>PASS</Button>
                                        <Button disabled={isFailsafe} variant={currentLot.qcPassed === false ? 'destructive' : 'outline'} onClick={() => handleUpdateDoc('qcPassed', false)}>FAIL</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'serialize' && (
                    <Card>
                    <CardHeader><CardTitle className="text-lg">Serialization Parameters</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Serial Prefix</label>
                            <Input 
                            disabled={!isLogistics || currentLot.status !== 'DRAFT' || isFailsafe} 
                            value={genParams.prefix} 
                            onChange={e => setGenParams({...genParams, prefix: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Generation Count</label>
                            <Input 
                            type="number" 
                            disabled={!isLogistics || currentLot.status !== 'DRAFT' || isFailsafe} 
                            value={genParams.count} 
                            onChange={e => setGenParams({...genParams, count: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        </div>
                        
                        <div className="pt-4 border-t flex justify-end">
                            <ActionGuard 
                                guard={isFailsafe ? {allowed: false, reason: "Manual serialization disabled in failsafe mode."} : guards.generateSerials}
                                onClick={handleGenerate}
                                label={serials.length > 0 ? "Regenerate IDs" : "Generate Identities"}
                                icon={Fingerprint}
                                loading={processing}
                                actionName="Generate_Cell_Serials"
                                entityId={currentLot.id}
                            />
                        </div>
                    </CardContent>
                    </Card>
                )}

                {activeTab === 'scan' && (
                    <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scan className="h-5 w-5" /> Inbound Verification Scan</CardTitle></CardHeader>
                    <CardContent className="space-y-8">
                        <div className="max-w-md mx-auto space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-center block">Scan Cell Serial to Confirm Possession</label>
                            <div className="flex gap-2">
                            <Input 
                                placeholder="SCAN HERE..." 
                                className="text-lg h-12 text-center font-mono tracking-widest"
                                value={scanInput}
                                onChange={e => setScanInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleScan()}
                                disabled={!canScan || serials.length === 0 || isFailsafe}
                            />
                            <Button size="lg" onClick={handleScan} disabled={!canScan || !scanInput || isFailsafe}>OK</Button>
                            </div>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-sm uppercase tracking-wider text-slate-400">Process Action Hub</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <ActionGuard 
                        guard={isFailsafe ? {allowed: false, reason: "Ledger finalize disabled in failsafe mode."} : guards.releaseToProd} 
                        onClick={handleRelease} 
                        label="Release to Production" 
                        icon={PlayCircle} 
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/20"
                        actionName="Release_Lot_To_Prod"
                        entityId={currentLot.id}
                    />
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                        <Button 
                            variant="outline"
                            className="w-full text-white border-slate-700 hover:bg-slate-800 h-12"
                            onClick={() => navigate(`/batches?prefillLotId=${currentLot.id}`)}
                            disabled={currentLot.status !== 'PUBLISHED' || isFailsafe}
                        >
                            <Box className="mr-2 h-4 w-4" /> Issue to Batch
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-none shadow-lg">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Ledger Compliance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Identity Integrity</p>
                            <p className="text-xs text-slate-400">Unique cell serials are cryptographically linked to Lot {currentLot.id}.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}