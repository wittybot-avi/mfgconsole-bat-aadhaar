import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { packAssemblyService } from '../services/packAssemblyService';
import { PackInstance, PackStatus, EolTestRun } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, ClipboardList, CheckCircle, XCircle, ShieldCheck, Zap, History, Play, Battery, Cpu, AlertTriangle } from 'lucide-react';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';
import { useAppStore } from '../lib/store';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { routes } from '../../app/routes';

export default function EolDetails() {
  const { buildId } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [testRun, setTestRun] = useState<EolTestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // P50: Deterministic Demo Bypass
    // Synchronous mock data means handshake is verified on first tick
    const timer = setTimeout(() => {
        if (loading) setLoading(false);
    }, 100);

    if (buildId) loadData(buildId);

    return () => clearTimeout(timer);
  }, [buildId]);

  const loadData = async (pid: string) => {
    try {
      const p = await packAssemblyService.getPack(pid);
      if (!p) {
        console.warn(`[DIAGNOSTIC] Build ID ${pid} not found in current scenario registry.`);
        handleSyntheticBypass(pid);
        return;
      }
      setPack(p);
      const run = await eolQaService.getTestRun(p.id);
      setTestRun(run || null);
    } catch (e) {
      console.error(e);
      handleSyntheticBypass(pid);
    } finally {
      setLoading(false);
    }
  };

  const handleSyntheticBypass = (pid: string) => {
    if (pid.startsWith('demo-')) {
        setPack({
          id: pid,
          status: PackStatus.READY_FOR_EOL,
          skuId: 'sku-happy',
          skuCode: 'VV360-DEMO',
          moduleIds: ['MOD-DEMO-01'],
          packSerial: `SN-DEMO-${pid.slice(-4)}`,
          qcStatus: 'PASSED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Verified Demo Context'
        } as any);
    }
  };

  const handleApprove = async () => {
    if (!pack) return;
    setProcessing(true);
    try {
        const actor = `${currentRole?.name} (${currentCluster?.id})`;
        await eolQaService.createBatteryFromPack(pack.id, actor);
        addNotification({ title: 'Success', message: 'Battery identity certified. Queued for S9 Provisioning.', type: 'success' });
        navigate('/manufacturing/provisioning/queue');
    } catch (e: any) {
        addNotification({ title: 'Certification Error', message: e.message, type: 'error' });
    } finally {
        setProcessing(false);
    }
  };

  if (loading && !pack) return <div className="p-20 text-center animate-pulse font-mono text-sm uppercase tracking-widest text-slate-400">Verifying secure ledger context...</div>;

  if (!pack) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <AlertTriangle className="h-10 w-10 text-rose-500 opacity-50" />
      <h3 className="text-lg font-bold">Identity Resolution Failure</h3>
      <p className="text-sm text-muted-foreground">The build record <span className="font-mono">{buildId}</span> could not be retrieved from current scenario.</p>
      <Button onClick={() => navigate(routes.eolQueue())}>Return to EOL Queue</Button>
    </div>
  );

  const currentPack = pack!;
  const clusterId = currentCluster?.id || '';
  const guards = workflowGuardrails.getPackGuardrail(currentPack, clusterId);
  const isPass = currentPack.eolStatus === 'PASS';

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <StageHeader 
        stageCode="S7"
        title="EOL Detail Analysis"
        objective="Deep verification of electrical, thermal, and BMS parameters for individual build units."
        entityLabel={currentPack.id}
        status={currentPack.status}
        diagnostics={{ route: '/assure/eol/details', entityId: currentPack.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(routes.eolQueue())} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Queue
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <Badge variant="outline" className="font-mono text-xs bg-slate-50">{currentPack.skuCode}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <NextStepsPanel entity={currentPack} type="PACK" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-black tracking-widest">Pack Identity</CardTitle></CardHeader>
                    <CardContent>
                        <p className="font-mono font-bold text-lg">{currentPack.packSerial || 'UNASSIGNED'}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Build ID: {currentPack.id}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-black tracking-widest">Workstation State</CardTitle></CardHeader>
                    <CardContent>
                        <Badge variant={currentPack.eolStatus === 'PASS' ? 'success' : 'default'} className="text-sm font-black uppercase tracking-tighter">
                            {currentPack.eolStatus || 'QUEUED'}
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-black tracking-widest">Ledger Proof</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-2 text-emerald-600 font-bold">
                        <ShieldCheck size={20} /> Verified Signed (Demo)
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 font-bold"><ClipboardList size={18} className="text-primary"/> Test Result Summary</CardTitle>
                    {!isPass && currentPack.status !== PackStatus.QUARANTINED && (
                        <Button size="sm" onClick={() => navigate(`/assure/eol/run/${currentPack.id}`)} className="gap-2 bg-indigo-600 font-black text-[10px] uppercase tracking-wider h-8 shadow-md">
                            <Play size={12} fill="currentColor" /> Go to Run EOL Test
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px]">Parameter</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Actual</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px]">Result</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {testRun?.items ? testRun.items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="font-mono">{item.measurement || '-'} {item.unit}</TableCell>
                                    <TableCell className="text-right">
                                        {item.status === 'PASS' ? <CheckCircle size={16} className="text-emerald-500 ml-auto" /> : item.status === 'FAIL' ? <XCircle size={16} className="text-rose-500 ml-auto" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200 ml-auto" />}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={3} className="text-center py-12 text-slate-400 italic text-xs">Awaiting test session execution...</TableCell></TableRow>
                            )}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400 font-black">Gate Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <ActionGuard 
                        guard={{ ...guards.createBatteryIdentity, allowed: isPass && !currentPack.batteryRecordCreated }} 
                        onClick={handleApprove} 
                        label="Approve for Provisioning" 
                        icon={ShieldCheck} 
                        loading={processing}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/20 font-black text-xs uppercase"
                        actionName="S8_Certification_Bridge"
                        entityId={currentPack.id}
                    />
                    {currentPack.batteryRecordCreated && (
                        <Button onClick={() => navigate('/manufacturing/provisioning/queue')} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 border-none font-black text-xs uppercase gap-2 shadow-lg shadow-indigo-500/20">
                            <Cpu size={18} /> Provisioning Queue
                        </Button>
                    )}
                    <Button variant="outline" className="w-full text-white border-slate-700 hover:bg-slate-800 h-12 font-bold text-xs uppercase" onClick={() => navigate(routes.eolQueue())}>
                        Exit Analysis
                    </Button>
                </CardContent>
            </Card>

            <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                 <History size={24} className="text-slate-400" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Audit History</p>
                 <p className="text-[9px] text-slate-400 leading-tight">Immutable test logs are persistent in the console audit vault.</p>
                 <Button variant="link" size="sm" className="text-[10px] font-bold" onClick={() => navigate(`/assure/eol/audit/${currentPack.id}`)}>Open Audit Node</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}