import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardMetricsService, DashboardMetrics } from '../services/dashboardMetrics';
import { useAppStore } from '../lib/store';
import { canView } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
// Added Button to imports
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui/design-system';
import { Battery, Box, CheckCircle, AlertTriangle, Truck, Layers, Activity, ShieldAlert, FileCheck, Package, Loader2, Inbox } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// --- Widget Components ---

const KPICard = ({ title, value, icon: Icon, trend, color, onClick }: any) => (
  <Card className={`cursor-pointer hover:shadow-md transition-all border-l-4 border-l-${color}-500`} onClick={onClick}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className={`text-xs ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const ProductionWidget = ({ data }: { data: DashboardMetrics['production'] }) => (
  <Card className="col-span-1 lg:col-span-2">
    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5" /> Production Output</CardTitle></CardHeader>
    <CardContent>
      <div className="h-[250px] min-h-[250px] w-full">
        {data.outputTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.outputTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="built" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Built" />
              <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg">
             <Inbox className="h-8 w-8 mb-2 opacity-20" />
             <p className="text-xs">No production data in current scenario.</p>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
         <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <span className="text-muted-foreground">WIP</span>
            <div className="font-bold text-lg">{data.wipCount}</div>
         </div>
         <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <span className="text-muted-foreground">Finished</span>
            <div className="font-bold text-lg">{data.finishedCount}</div>
         </div>
      </div>
    </CardContent>
  </Card>
);

const ActiveBatchesWidget = ({ data }: { data: DashboardMetrics['production']['topActiveBatches'] }) => (
    <Card>
        <CardHeader><CardTitle className="text-lg">Active Batches</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-4">
                {data.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground italic text-sm">
                     No active production batches.
                  </div>
                ) : 
                 data.map(b => (
                    <div key={b.id} className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-sm">{b.number}</div>
                            <div className="text-xs text-muted-foreground">Progress</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${b.progress}%`}} />
                            </div>
                            <span className="text-xs font-bold">{b.progress}%</span>
                        </div>
                    </div>
                 ))
                }
            </div>
        </CardContent>
    </Card>
);

const QualityWidget = ({ data }: { data: DashboardMetrics['quality'] }) => (
    <Card className="col-span-1 lg:col-span-2">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> Quality Trends</CardTitle></CardHeader>
        <CardContent>
            <div className="h-[250px] min-h-[250px] w-full">
                {data.passFailTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.passFailTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="passed" stroke="#10b981" strokeWidth={2} dot={{r: 3}} name="Passed" />
                          <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} name="Failed" />
                      </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <Activity className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs">Awaiting EOL test results...</p>
                  </div>
                )}
            </div>
        </CardContent>
    </Card>
);

const LogisticsWidget = ({ data }: { data: DashboardMetrics['logistics'] }) => (
    <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5" /> Logistics Status</CardTitle></CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-md">
                    <div className="text-xs text-muted-foreground uppercase">Available</div>
                    <div className="text-2xl font-bold text-emerald-600">{data.inventoryAvailable}</div>
                </div>
                <div className="text-center p-3 border rounded-md">
                    <div className="text-xs text-muted-foreground uppercase">In Transit</div>
                    <div className="text-2xl font-bold text-blue-600">{data.inTransit}</div>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Reserved for Dispatch:</span> <span className="font-mono font-medium">{data.inventoryReserved}</span></div>
                <div className="flex justify-between"><span>Ready to Ship Orders:</span> <span className="font-mono font-medium">{data.dispatchReady}</span></div>
            </div>
        </CardContent>
    </Card>
);

const RiskWidget = ({ data }: { data: DashboardMetrics['risk'] }) => (
    <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Risk & Compliance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded border border-rose-100 dark:border-rose-900">
                 <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
                     <AlertTriangle className="h-4 w-4" />
                     <span className="text-sm font-medium">Quarantined</span>
                 </div>
                 <span className="font-bold text-lg text-rose-600">{data.quarantineCount}</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-900">
                 <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                     <Activity className="h-4 w-4" />
                     <span className="text-sm font-medium">Provisioning Fail</span>
                 </div>
                 <span className="font-bold text-lg text-amber-600">{data.provisioningFailures}</span>
             </div>
             <div className="pt-2 border-t">
                 <div className="flex justify-between text-sm items-center">
                     <span className="text-muted-foreground">Digital Cert Coverage</span>
                     <Badge variant={data.certCoveragePct > 90 ? 'success' : 'warning'}>{data.certCoveragePct}%</Badge>
                 </div>
                 <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{ width: `${data.certCoveragePct}%`}} />
                 </div>
             </div>
        </CardContent>
    </Card>
);

// --- Main Page ---

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // RBAC Checks
  const showExec = canView(currentCluster?.id || '', ScreenId.DASHBOARD_EXEC_SUMMARY);
  const showProd = canView(currentCluster?.id || '', ScreenId.DASHBOARD_PRODUCTION);
  const showQual = canView(currentCluster?.id || '', ScreenId.DASHBOARD_QUALITY);
  const showLogs = canView(currentCluster?.id || '', ScreenId.DASHBOARD_LOGISTICS);
  const showRisk = canView(currentCluster?.id || '', ScreenId.DASHBOARD_RISK_COMPLIANCE);
  
  const isExternal = currentCluster?.id === 'C9';

  useEffect(() => {
    setLoading(true);
    dashboardMetricsService.getMetrics().then(data => {
      setMetrics(data);
      setLoading(false);
    }).catch(err => {
      console.error("Dashboard metric fetch failed", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Aggregating real-time ledger metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-500 opacity-50" />
        <h3 className="text-lg font-bold">Metrics Unavailable</h3>
        <p className="text-sm text-muted-foreground">Unable to fetch dashboard data. Please try again or check scenario.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry Fetch</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-1 duration-500">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Operational overview and key performance indicators.</p>
      </div>

      {/* Executive Summary Row */}
      {showExec && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <KPICard 
            title={isExternal ? "My Batteries" : "Total Batteries"} 
            value={isExternal ? metrics.kpis.shippedCount : metrics.kpis.totalBatteries} 
            icon={Battery} 
            color="indigo"
            onClick={() => navigate('/batteries')}
          />
          {!isExternal && (
            <KPICard 
                title="Active Batches" 
                value={metrics.kpis.activeBatches} 
                icon={Box} 
                color="blue"
                onClick={() => navigate('/batches')}
            />
          )}
          <KPICard 
            title="EOL Pass Rate" 
            value={`${metrics.kpis.eolPassRate}%`} 
            icon={CheckCircle} 
            color="emerald" 
            onClick={() => navigate('/eol')} 
          />
          {!isExternal && (
            <KPICard 
                title="Open Exceptions" 
                value={metrics.kpis.openExceptions} 
                icon={AlertTriangle} 
                color="amber"
                onClick={() => navigate('/compliance')} 
            />
          )}
          {isExternal && (
             <KPICard 
                title="Certified Units" 
                value={`${metrics.risk.certCoveragePct}%`} 
                icon={FileCheck} 
                color="teal"
            />
          )}
        </div>
      )}

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
        
        {/* Production Column */}
        {showProd && (
            <div className="col-span-1 lg:col-span-2 grid grid-cols-1 gap-6">
                <ProductionWidget data={metrics.production} />
            </div>
        )}
        
        {/* Side Column for Lists */}
        {showProd && (
            <div className="col-span-1">
                <ActiveBatchesWidget data={metrics.production.topActiveBatches} />
            </div>
        )}

        {/* Quality Section */}
        {showQual && (
             <QualityWidget data={metrics.quality} />
        )}

        {/* Logistics & Risk Column Group */}
        {(showLogs || showRisk) && (
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {showLogs && <LogisticsWidget data={metrics.logistics} />}
                {showRisk && <RiskWidget data={metrics.risk} />}
                {/* Fallback or additional widget slot */}
                {showLogs && !showRisk && (
                    <Card className="flex items-center justify-center text-muted-foreground p-6 border-dashed">
                        <div className="text-center">
                            <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>Upcoming Shipments</p>
                        </div>
                    </Card>
                )}
            </div>
        )}

      </div>
      
      {!showExec && !showProd && !showQual && !showLogs && !showRisk && (
          <div className="p-10 text-center text-muted-foreground border rounded bg-slate-50 dark:bg-slate-900">
              <ShieldAlert className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">Access Restricted</h3>
              <p>Your role does not have permission to view dashboard widgets.</p>
          </div>
      )}
    </div>
  );
}