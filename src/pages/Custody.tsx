import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { custodyService, CustodyMetrics, CustodyException } from '../services/custodyService';
import { dispatchService } from '../services/api';
import { DispatchOrder, CustodyStatus } from '../domain/types';
import { canView } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Button } from '../components/ui/design-system';
import { Truck, CheckCircle, AlertTriangle, XCircle, Clock, ArrowRight } from 'lucide-react';

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

const ExceptionsList = ({ exceptions, onClick }: { exceptions: CustodyException[], onClick: (id: string) => void }) => (
    <Card>
        <CardHeader><CardTitle>Active Exceptions</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Dispatch ID</TableHead>
                        <TableHead>Issue Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {exceptions.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No active exceptions.</TableCell></TableRow>
                    ) : (
                        exceptions.map((ex, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-mono font-medium">{ex.dispatchId}</TableCell>
                                <TableCell>{ex.type.replace('_', ' ')}</TableCell>
                                <TableCell>
                                    <Badge variant={ex.severity === 'HIGH' ? 'destructive' : 'warning'}>{ex.severity}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{ex.details}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => onClick(ex.dispatchId)}>
                                        View <ArrowRight className="ml-1 h-3 w-3" />
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

const ShipmentsList = ({ shipments, onClick }: { shipments: DispatchOrder[], onClick: (id: string) => void }) => (
    <Card>
        <CardHeader><CardTitle>Recent Shipments</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Dispatch ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Last Update</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {shipments.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No shipments found.</TableCell></TableRow>
                    ) : (
                        shipments.slice(0, 10).map(s => (
                            <TableRow key={s.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => onClick(s.id)}>
                                <TableCell className="font-mono">{s.orderNumber}</TableCell>
                                <TableCell>{s.customerName}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        s.custodyStatus === CustodyStatus.ACCEPTED ? 'success' :
                                        s.custodyStatus === CustodyStatus.REJECTED ? 'destructive' :
                                        s.custodyStatus === CustodyStatus.DELIVERED ? 'warning' : 'outline'
                                    }>
                                        {s.custodyStatus || 'Processing'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{s.batteryIds.length}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {new Date(s.updatedAt).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </tbody>
            </Table>
        </CardContent>
    </Card>
);

export default function Custody() {
    const navigate = useNavigate();
    const { currentCluster } = useAppStore();
    const [metrics, setMetrics] = useState<CustodyMetrics | null>(null);
    const [exceptions, setExceptions] = useState<CustodyException[]>([]);
    const [shipments, setShipments] = useState<DispatchOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // RBAC
    const showOverview = canView(currentCluster?.id || '', ScreenId.CUSTODY_OVERVIEW);
    const showList = canView(currentCluster?.id || '', ScreenId.CUSTODY_LIST);
    const showExceptions = canView(currentCluster?.id || '', ScreenId.CUSTODY_EXCEPTIONS);

    useEffect(() => {
        // Tab Resilience
        if (!showOverview && showList) setActiveTab('list');
        else if (!showOverview && !showList && showExceptions) setActiveTab('exceptions');
    }, [showOverview, showList, showExceptions]);

    useEffect(() => {
        loadData();
    }, [currentCluster]);

    const loadData = async () => {
        setLoading(true);
        const [m, e, s] = await Promise.all([
            custodyService.getMetrics(currentCluster?.id || ''),
            custodyService.getExceptions(currentCluster?.id || ''),
            custodyService.listShipments(currentCluster?.id || '')
        ]);
        setMetrics(m);
        setExceptions(e);
        setShipments(s);
        setLoading(false);
    };

    if (!showOverview && !showList && !showExceptions) return <div className="p-10 text-center">Access Denied</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Chain of Custody</h2>
                    <p className="text-muted-foreground">Track possession, transfers, and acceptance of battery assets.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
                {showOverview && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('overview')}>Overview</button>}
                {showList && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('list')}>Shipments</button>}
                {showExceptions && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'exceptions' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('exceptions')}>Exceptions ({exceptions.length})</button>}
            </div>

            {/* Content */}
            <div className="pt-2">
                {loading ? <div className="text-center py-10">Loading custody data...</div> : (
                    <>
                        {activeTab === 'overview' && metrics && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <KPICard title="In Transit" value={metrics.inTransit} icon={Truck} color="blue" onClick={() => setActiveTab('list')} />
                                    <KPICard title="Pending Accept" value={metrics.pendingAcceptance} icon={Clock} color="amber" onClick={() => setActiveTab('list')} />
                                    <KPICard title="Accepted" value={metrics.accepted} icon={CheckCircle} color="emerald" onClick={() => setActiveTab('list')} />
                                    <KPICard title="Rejected" value={metrics.rejected} icon={XCircle} color="rose" onClick={() => setActiveTab('exceptions')} />
                                    <KPICard title="SLA Breaches" value={metrics.slaBreaches} icon={AlertTriangle} color="slate" onClick={() => setActiveTab('exceptions')} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <ShipmentsList shipments={shipments} onClick={(id) => navigate(`/custody/${id}`)} />
                                    {showExceptions && <ExceptionsList exceptions={exceptions} onClick={(id) => navigate(`/custody/${id}`)} />}
                                </div>
                            </div>
                        )}

                        {activeTab === 'list' && (
                            <div className="space-y-6 animate-in fade-in">
                                <ShipmentsList shipments={shipments} onClick={(id) => navigate(`/custody/${id}`)} />
                            </div>
                        )}

                        {activeTab === 'exceptions' && (
                            <div className="space-y-6 animate-in fade-in">
                                <ExceptionsList exceptions={exceptions} onClick={(id) => navigate(`/custody/${id}`)} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}