
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { batteryService } from '../services/api';
import { Battery, BatteryStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/design-system';
import { ArrowLeft, CheckCircle, Truck, Cpu, ClipboardCheck, History, Fingerprint, Zap, Info } from 'lucide-react';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

const InfoRow = ({ label, value, isLink = false, linkTo = '' }: { label: string, value: any, isLink?: boolean, linkTo?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</span>
    {isLink ? (
      <Link to={linkTo} className="font-bold text-sm truncate text-primary hover:underline" title={String(value)}>
        {value || '-'}
      </Link>
    ) : (
      <span className="font-bold text-sm truncate text-slate-700 dark:text-slate-200" title={String(value)}>{value || '-'}</span>
    )}
  </div>
);

export default function BatteryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  
  const [battery, setBattery] = useState<Battery | null>(null);
  const [loading, setLoading] = useState(true);

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadBattery(id);
  }, [id]);

  const loadBattery = async (battId: string) => {
    setLoading(true);
    const data = await batteryService.getBatteryById(battId);
    if (!data) {
        addNotification({ title: 'Redirection', message: 'Asset identity not found.', type: 'info' });
        navigate('/batteries');
        return;
    }
    setBattery(data);
    setLoading(false);
  };

  if (loading || !battery) return <div className="p-10 text-center animate-pulse">Syncing traceable record...</div>;

  const guards = workflowGuardrails.getBatteryGuardrail(battery, clusterId);
  const isCertified = battery.certificationStatus === 'CERTIFIED';

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S8"
        title="Battery Identity & Certification"
        objective="Verify individual asset health metrics and authorize immutable certification identity."
        entityLabel={battery.serialNumber}
        status={isCertified ? 'COMPLETED' : 'ACTIVE'}
        diagnostics={{ route: '/batteries', entityId: battery.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/batteries')} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Global Trace
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-slate-400">Pack Origin:</span>
               <Badge variant="outline" className="font-mono text-xs">{battery.packId || 'N/A'}</Badge>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <NextStepsPanel entity={battery} type="BATTERY" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30"><CardTitle className="text-lg flex items-center gap-2"><Fingerprint size={18} className="text-primary"/> Core Identity</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-6 pt-6">
                        <InfoRow label="Serial Number" value={battery.serialNumber} />
                        <InfoRow label="Certificate Ref" value={battery.certificateId || 'PENDING'} />
                        <InfoRow label="Internal ID" value={battery.id} />
                        <InfoRow label="Lot Link" value={battery.batchId} isLink linkTo={`/batches/${battery.batchId}`} />
                    </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30"><CardTitle className="text-lg flex items-center gap-2"><Zap size={18} className="text-primary"/> Vital Statistics</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-6 pt-6">
                        <InfoRow label="State of Health" value={`${battery.soh?.toFixed(1)}%`} />
                        <InfoRow label="Nominal Voltage" value={`${battery.voltage?.toFixed(1)}V`} />
                        <InfoRow label="Nominal Capacity" value={`${battery.capacityAh}Ah`} />
                        <InfoRow label="Certification" value={battery.certificationStatus || 'PENDING'} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><History size={18} className="text-primary"/> Chain of Custody Summary</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <div className="p-8 text-center text-slate-400 text-xs italic font-mono">
                        Genealogy mapping and custody events are available in the full Lineage Explorer.
                    </div>
                </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-80 space-y-4 shrink-0">
             <Card className="bg-slate-900 text-white border-none shadow-xl">
                 <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Stage S9: Operations</CardTitle></CardHeader>
                 <CardContent className="space-y-3 pt-6">
                    <ActionGuard 
                        guard={guards.provision} 
                        onClick={() => navigate(`/provisioning?batteryId=${battery.id}`)} 
                        label="Execute Provisioning (S9)" 
                        icon={Cpu} 
                        className="w-full justify-start h-12 bg-indigo-600 hover:bg-indigo-700 border-none font-bold"
                        actionName="Provision_Battery_Bridge"
                        entityId={battery.id}
                    />
                    <div className="pt-4 border-t border-slate-800 opacity-40">
                        <Button variant="outline" className="w-full justify-start h-12 text-white border-slate-700 hover:bg-slate-800 cursor-not-allowed" disabled>
                            <CheckCircle className="mr-2 h-4 w-4" /> Move to Inventory (S10)
                        </Button>
                    </div>
                 </CardContent>
             </Card>

             <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
                <CardContent className="p-4 flex gap-3">
                    <Info size={16} className="shrink-0 mt-1" />
                    <p className="text-xs leading-relaxed font-medium">Provisioning is the final gated step before this identity can be allocated to a dispatch shipment.</p>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
