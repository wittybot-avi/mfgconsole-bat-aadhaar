
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { warrantyService, WarrantyMetrics } from '../services/warrantyService';
import { WarrantyClaim, ClaimStatus, ClaimPriority, FailureCategory } from '../domain/types';
import { canView, canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Input } from '../components/ui/design-system';
import { AlertCircle, CheckCircle, Clock, Plus, Search, Filter, Eye, BarChart2, Download, ExternalLink } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <Card className={`cursor-pointer hover:shadow-md transition-all border-l-4 border-l-${color}-500`} onClick={onClick}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <Icon className={`h-4 w-4 text-${color}-500`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const ClaimsList = ({ claims, onClick }: { claims: WarrantyClaim[], onClick: (id: string) => void }) => (
    <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Battery ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {claims.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No claims found.</TableCell></TableRow>
                    ) : (
                        claims.map(c => (
                            <TableRow key={c.claimId} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => onClick(c.claimId)}>
                                <TableCell className="font-mono font-medium">{c.claimId}</TableCell>
                                <TableCell className="font-mono text-xs">{c.batteryId}</TableCell>
                                <TableCell>{c.customerName}</TableCell>
                                <TableCell className="text-xs">{c.failureCategory}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        c.status === ClaimStatus.OPEN ? 'destructive' :
                                        c.status === ClaimStatus.CLOSED ? 'success' : 'secondary'
                                    }>
                                        {c.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className={`text-xs font-bold ${c.priority === ClaimPriority.CRITICAL ? 'text-red-600' : c.priority === ClaimPriority.HIGH ? 'text-orange-500' : 'text-slate-500'}`}>
                                        {c.priority}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{new Date(c.reportedAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => onClick(c.claimId)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </tbody>
            </Table>
        </CardContent>
    </Card>
);

export default function Warranty() {
    const navigate = useNavigate();
    const { currentCluster, addNotification } = useAppStore();
    
    // State
    const [activeTab, setActiveTab] = useState('overview');
    const [metrics, setMetrics] = useState<WarrantyMetrics | null>(null);
    const [claims, setClaims] = useState<WarrantyClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // RBAC
    const showOverview = canView(currentCluster?.id || '', ScreenId.WARRANTY_OVERVIEW);
    const showList = canView(currentCluster?.id || '', ScreenId.WARRANTY_CLAIMS_LIST);
    const canIntakeExternal = canView(currentCluster?.id || '', ScreenId.WARRANTY_EXTERNAL_INTAKE);
    const canCreateInternal = canDo(currentCluster?.id || '', ScreenId.WARRANTY_CREATE_CLAIM_INTERNAL, 'C');
    const canExport = canDo(currentCluster?.id || '', ScreenId.WARRANTY_EXPORT, 'X');

    useEffect(() => {
        // Tab Resilience
        if (!showOverview && showList) setActiveTab('list');
    }, [showOverview, showList]);

    useEffect(() => {
        loadData();
    }, [currentCluster, activeTab, statusFilter]);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === 'overview' && showOverview) {
            const m = await warrantyService.getMetrics(currentCluster?.id || '');
            setMetrics(m);
        }
        if (activeTab === 'list' && showList) {
            const list = await warrantyService.listClaims(currentCluster?.id || '', { 
                status: statusFilter === 'All' ? undefined : statusFilter 
            });
            // Client side search filter
            const filtered = list.filter(c => 
                c.claimId.toLowerCase().includes(search.toLowerCase()) || 
                c.batteryId.toLowerCase().includes(search.toLowerCase()) ||
                c.customerName.toLowerCase().includes(search.toLowerCase())
            );
            setClaims(filtered);
        }
        setLoading(false);
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(claims, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `warranty_claims_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addNotification({ title: "Exported", message: "Claims data downloaded.", type: "success" });
    };

    if (!showOverview && !showList) return <div className="p-10 text-center">Access Denied</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Warranty & Returns</h2>
                    <p className="text-muted-foreground">Manage claims, RMAs, and field issue resolution.</p>
                </div>
                <div className="flex gap-2">
                    {canIntakeExternal && (
                        <Button onClick={() => navigate('/warranty/intake')}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Submit Claim
                        </Button>
                    )}
                    {canCreateInternal && (
                        <Button onClick={() => addNotification({title: "Coming Soon", message: "Internal creation via Battery Detail page.", type: "info"})}>
                            <Plus className="mr-2 h-4 w-4" /> Create Internal Claim
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
                {showOverview && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('overview')}>Overview</button>}
                {showList && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('list')}>All Claims</button>}
            </div>

            {/* Content */}
            <div className="pt-2">
                {loading ? <div className="text-center py-10">Loading warranty data...</div> : (
                    <>
                        {activeTab === 'overview' && metrics && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <KPICard title="Open Claims" value={metrics.open} icon={AlertCircle} color="rose" onClick={() => { setStatusFilter(ClaimStatus.OPEN); setActiveTab('list'); }} />
                                    <KPICard title="Under Analysis" value={metrics.underAnalysis} icon={BarChart2} color="blue" onClick={() => { setStatusFilter(ClaimStatus.UNDER_ANALYSIS); setActiveTab('list'); }} />
                                    <KPICard title="High Priority" value={metrics.highPriority} icon={AlertCircle} color="amber" onClick={() => setActiveTab('list')} />
                                    <KPICard title="Avg Resolution" value={`${metrics.avgResolutionDays}d`} icon={Clock} color="emerald" />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">Claims by Category</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {/* Fix: Explicitly type category map items to avoid 'unknown' Key error */}
                                                {metrics.byCategory.map((cat: { name: string, value: number }, i: number) => (
                                                    <div key={i} className="flex items-center justify-between">
                                                        <span className="text-sm">{cat.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500" style={{width: `${Math.min(100, (cat.value/Math.max(1, metrics.open + metrics.underAnalysis))*100)}%`}} />
                                                            </div>
                                                            <span className="text-xs font-bold">{cat.value}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === 'list' && (
                            <div className="space-y-6 animate-in fade-in">
                                <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    placeholder="Search claims..." 
                                                    className="pl-9 bg-white dark:bg-slate-950" 
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-4 w-4 text-muted-foreground" />
                                                <select 
                                                    className="h-10 rounded-md border border-input bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                >
                                                    <option value="All">All Statuses</option>
                                                    {Object.values(ClaimStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                {canExport && (
                                                    <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <ClaimsList claims={claims} onClick={(id) => navigate(`/warranty/claims/${id}`)} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
