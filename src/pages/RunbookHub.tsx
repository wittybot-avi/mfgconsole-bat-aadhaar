import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/ui/design-system';
import { BookOpen, Play, Info, ArrowRight, Zap, Layers, Truck, AlertCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';

const RUNBOOKS = [
  {
    id: 'mfg-run',
    title: 'Manufacturing Execution Run',
    description: 'Complete process from Batch Release to EOL Certification.',
    stages: 'S1 -> S9',
    roles: ['Production', 'QA'],
    icon: Layers,
    color: 'indigo'
  },
  {
    id: 'cell-receipt',
    title: 'Material Receipt & Serialization',
    description: 'Register cell shipments, generate identities, and verify ledger bindings.',
    stages: 'S2 -> S4',
    roles: ['Logistics', 'Operator'],
    icon: Zap,
    color: 'amber'
  },
  {
    id: 'logistics-transfer',
    title: 'Dispatch & Custody Chain',
    description: 'Finalize shipment records and manage multi-party sign-offs.',
    stages: 'S10 -> S12',
    roles: ['Logistics', 'Partner'],
    icon: Truck,
    color: 'emerald'
  },
  {
    id: 'warranty-claims',
    title: 'Warranty Lifecycle Management',
    description: 'Process field returns, execute RCA, and finalize dispositions.',
    stages: 'S13 -> S15',
    roles: ['Warranty', 'QA'],
    icon: AlertCircle,
    color: 'rose'
  }
];

export default function RunbookHub() {
  const navigate = useNavigate();
  const { currentRole } = useAppStore();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Guided Workflows</h2>
          <p className="text-muted-foreground mt-1">
            Operational Runbooks mapped to standard SOP stages. Follow the spine to completion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {RUNBOOKS.map((rb) => (
          <Card key={rb.id} className="group hover:shadow-xl transition-all border-l-4" style={{ borderLeftColor: `var(--${rb.color}-500)` }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg bg-${rb.color}-100 text-${rb.color}-600 dark:bg-${rb.color}-900/30 dark:text-${rb.color}-400`}>
                  <rb.icon size={24} />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">{rb.stages}</Badge>
              </div>
              <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">{rb.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[40px]">{rb.description}</p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {rb.roles.map(r => (
                  <Badge key={r} variant="secondary" className="text-[9px] uppercase font-bold tracking-tighter opacity-80">{r}</Badge>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                    <Info size={12} /> Guided steps available
                 </div>
                 <Button onClick={() => navigate(`/runbooks/${rb.id}`)} className="gap-2">
                    Start Process <Play size={14} fill="currentColor" />
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-8 border-2 border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 text-center max-w-2xl mx-auto">
         <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
         <h3 className="font-bold text-lg text-slate-600 dark:text-slate-300">Custom Operational Spines</h3>
         <p className="text-sm text-slate-500 mt-2">Administrators can configure new Runbooks to support custom plant requirements or specific customer SLAs.</p>
      </div>
    </div>
  );
}