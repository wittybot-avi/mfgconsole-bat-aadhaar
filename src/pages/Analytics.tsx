import React, { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { analyticsMetricsService, AnalyticsOverview, BatchAnalytics, StationAnalytics, QualityPareto, LocationMovementAnalytics, AnalyticsReport } from '../services/analyticsMetrics';
import { canView, canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Tooltip } from '../components/ui/design-system';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, Calendar, Filter, MapPin, AlertTriangle, CheckCircle, Clock, Truck, ShieldCheck, Activity, Layers, Box } from 'lucide-react';

// --- Widget Components ---

const MetricCard = ({ title, value, unit, trend, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className={`text-xs ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// --- Tabs ---

const OverviewTab = ({ data }: { data: AnalyticsOverview }) => (
    <div className="space-y-6 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Avg Yield" value={(data.yieldTrend[data.yieldTrend.length-1]?.value || 0).toFixed(1)} unit="%" trend={2.5} icon={CheckCircle} color="emerald" />
            <MetricCard title="Production Rate" value={data.outputTrend[data.outputTrend.length-1]?.value || 0} unit="units/day" trend={5} icon={Layers} color="blue" />
            <MetricCard title="Exceptions" value={data.exceptionsTrend.reduce((acc, curr) => acc + curr.value, 0)} unit="last 7d" trend={-10} icon={AlertTriangle} color="amber" />
            <MetricCard title="In Transit" value={data.dispatchSummary.inTransit} unit="packs" icon={Truck} color="indigo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle className="text-base">Yield Trend</CardTitle></CardHeader>
                <CardContent className="h-[300px] min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.yieldTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={[80, 100]} fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Exceptions Volume</CardTitle></CardHeader>
                <CardContent className="h-[300px] min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.exceptionsTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
);

const BatchesTab = ({ data }: { data: BatchAnalytics[] }) => (
    <div className="space-y-4 animate-in fade-in">
        <Card>
            <CardHeader><CardTitle>Batch Performance</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Batch ID</TableHead>
                            <TableHead>Total Units</TableHead>
                            <TableHead>Yield %</TableHead>
                            <TableHead>Failures</TableHead>
                            <TableHead>Top Defect</TableHead>
                            <TableHead>Avg IR (mΩ)</TableHead>
                            <TableHead>Avg Temp (°C)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {data.map(b => (
                            <TableRow key={b.id}>
                                <TableCell className="font-mono font-medium">{b.batchNumber}</TableCell>
                                <TableCell>{b.total}</TableCell>
                                <TableCell>
                                    <Badge variant={b.passRate > 95 ? 'success' : b.passRate > 90 ? 'warning' : 'destructive'}>
                                        {b.passRate}%
                                    </Badge>
                                </TableCell>
                                <TableCell>{b.failCount}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{b.topReason}</TableCell>
                                <TableCell>{b.avgIR?.toFixed(1)}</TableCell>
                                <TableCell>{b.avgTemp?.toFixed(1)}</TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

const QualityTab = ({ pareto }: { pareto: QualityPareto[] }) => (
    <div className="space-y-6 animate-in fade-in">
        <Card>
            <CardHeader><CardTitle>Failure Pareto Analysis</CardTitle></CardHeader>
            <CardContent className="h-[400px] min-h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pareto} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="reason" type="category" width={120} fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-4">
             {pareto.slice(0, 3).map((item, idx) => (
                 <Card key={idx} className="bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900">
                     <CardContent className="p-4 flex justify-between items-center">
                         <div>
                             <p className="text-xs text-rose-600 font-bold uppercase">Top Offender #{idx+1}</p>
                             <p className="text-lg font-medium">{item.reason}</p>
                         </div>
                         <div className="text-2xl font-bold text-rose-700">{item.count}</div>
                     </CardContent>
                 </Card>
             ))}
        </div>
    </div>
);

const LocationTab = ({ data }: { data: LocationMovementAnalytics }) => (
    <div className="space-y-6 animate-in fade-in">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-md border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Geo-fence analytics uses simulated route events in demo mode. No live GPS tracking available.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Avg Factory Dwell" value={data.avgFactoryDwellHours.toFixed(1)} unit="hrs" icon={Clock} color="slate" />
            <MetricCard title="Avg WH Dwell" value={data.avgInventoryDwellHours.toFixed(1)} unit="hrs" icon={Box} color="slate" />
            <MetricCard title="Avg Transit Time" value={data.avgTransitHours.toFixed(1)} unit="hrs" icon={Truck} color="blue" />
            <MetricCard title="SLA Breaches" value={data.delayedBeyondSLA} unit="%" icon={AlertTriangle} color="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle className="text-base">Dwell Time by Stage</CardTitle></CardHeader>
                <CardContent className="h-[300px] min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.dwellTimeByStage}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="stage" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="hours" fill="#64748b" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-base">Geofence Violations (Mock)</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Route Segment</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead className="text-right">Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {data.geofenceViolations.map((v, i) => (
                                <TableRow key={i}>
                                    <TableCell>{v.route}</TableCell>
                                    <TableCell>
                                        <Badge variant={v.severity === 'High' ? 'destructive' : v.severity === 'Medium' ? 'warning' : 'outline'}>
                                            {v.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{v.violations}</TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
);

const ReportsTab = ({ reports, onExport, loading }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
        {reports.map((rpt: AnalyticsReport) => (
            <Card key={rpt.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{rpt.title}</CardTitle>
                        <Badge variant="outline">{rpt.type}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <p className="text-sm text-muted-foreground">{rpt.description}</p>
                    <Button variant="outline" className="w-full gap-2" onClick={() => onExport(rpt.id)} disabled={loading}>
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </CardContent>
            </Card>
        ))}
    </div>
);

// --- Main Page ---

export default function Analytics() {
    const { currentCluster, addNotification } = useAppStore();
    
    // Permission Checks
    const showOverview = canView(currentCluster?.id || '', ScreenId.ANALYTICS_OVERVIEW_TAB);
    const showBatches = canView(currentCluster?.id || '', ScreenId.ANALYTICS_BATCH_TAB);
    const showStations = canView(currentCluster?.id || '', ScreenId.ANALYTICS_STATION_TAB);
    const showQuality = canView(currentCluster?.id || '', ScreenId.ANALYTICS_QUALITY_TAB);
    const showLocation = canView(currentCluster?.id || '', ScreenId.ANALYTICS_LOCATION_TAB);
    const showReports = canView(currentCluster?.id || '', ScreenId.ANALYTICS_REPORTS_TAB);
    const canExport = canDo(currentCluster?.id || '', ScreenId.ANALYTICS_EXPORT, 'X');

    // State
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    
    // Data State
    const [overviewData, setOverviewData] = useState<AnalyticsOverview | null>(null);
    const [batchData, setBatchData] = useState<BatchAnalytics[]>([]);
    const [qualityData, setQualityData] = useState<QualityPareto[]>([]);
    const [locationData, setLocationData] = useState<LocationMovementAnalytics | null>(null);
    const [reports, setReports] = useState<AnalyticsReport[]>([]);

    useEffect(() => {
        // Resilient tab selection: ensure active tab is always one of the visible ones
        const tabs = [
            { id: 'overview', allowed: showOverview },
            { id: 'batches', allowed: showBatches },
            { id: 'stations', allowed: showStations },
            { id: 'quality', allowed: showQuality },
            { id: 'location', allowed: showLocation },
            { id: 'reports', allowed: showReports },
        ];
        
        const currentTabValid = tabs.find(t => t.id === activeTab)?.allowed;
        if (!currentTabValid) {
            const firstAllowed = tabs.find(t => t.allowed);
            if (firstAllowed) setActiveTab(firstAllowed.id);
        }
    }, [activeTab, showOverview, showBatches, showStations, showQuality, showLocation, showReports]);

    useEffect(() => {
        loadData();
    }, [dateRange, activeTab]);

    const loadData = async () => {
        // Prevent loading if no access or tab mismatch
        if (!activeTab) return;

        setLoading(true);
        try {
            if (activeTab === 'overview' && showOverview) {
                const data = await analyticsMetricsService.getOverview(dateRange);
                setOverviewData(data);
            } else if (activeTab === 'batches' && showBatches) {
                const data = await analyticsMetricsService.getBatchAnalytics(dateRange);
                setBatchData(data);
            } else if (activeTab === 'quality' && showQuality) {
                const data = await analyticsMetricsService.getQualityPareto(dateRange);
                setQualityData(data);
            } else if (activeTab === 'location' && showLocation) {
                const data = await analyticsMetricsService.getLocationMovementAnalytics(dateRange);
                setLocationData(data);
            } else if (activeTab === 'reports' && showReports) {
                setReports(analyticsMetricsService.getAvailableReports());
            }
        } catch (e) {
            console.error("Analytics load failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (reportId: string) => {
        if (!canExport) {
            addNotification({ title: "Restricted", message: "Export permission required.", type: "error" });
            return;
        }
        addNotification({ title: "Generating", message: "Preparing report export...", type: "info" });
        await analyticsMetricsService.exportReport(reportId);
        addNotification({ title: "Success", message: "Report downloaded successfully.", type: "success" });
    };

    if (!showOverview && !showBatches && !showStations && !showQuality && !showLocation && !showReports) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
                <ShieldCheck className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                <h2 className="text-2xl font-bold text-muted-foreground">Access Restricted</h2>
                <p className="text-muted-foreground mt-2">Your role does not have permission to view Analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Suite</h2>
                    <p className="text-muted-foreground">Historical performance, quality trends, and operational insights.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md bg-white dark:bg-slate-900 px-2 py-1">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        <select 
                            className="bg-transparent text-sm font-medium focus:outline-none"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                    </div>
                    <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                </div>
            </div>

            {/* Tabs Header */}
            <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto shrink-0">
                {showOverview && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                )}
                {showBatches && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'batches' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('batches')}
                    >
                        Batches
                    </button>
                )}
                {showStations && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'stations' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('stations')}
                    >
                        Stations
                    </button>
                )}
                {showQuality && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'quality' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('quality')}
                    >
                        Quality
                    </button>
                )}
                {showLocation && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'location' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('location')}
                    >
                        Location & Movement
                    </button>
                )}
                {showReports && (
                    <button 
                        className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reports' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} 
                        onClick={() => setActiveTab('reports')}
                    >
                        Reports
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 pt-2">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">Loading analytics...</div>
                ) : (
                    <>
                        {activeTab === 'overview' && overviewData && <OverviewTab data={overviewData} />}
                        {activeTab === 'batches' && <BatchesTab data={batchData} />}
                        {activeTab === 'stations' && (
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                Station analytics simulation not initialized.
                            </div>
                        )}
                        {activeTab === 'quality' && <QualityTab pareto={qualityData} />}
                        {activeTab === 'location' && locationData && <LocationTab data={locationData} />}
                        {activeTab === 'reports' && <ReportsTab reports={reports} onExport={handleExport} loading={loading} />}
                    </>
                )}
            </div>
        </div>
    );
}