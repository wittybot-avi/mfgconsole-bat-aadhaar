
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { complianceService, ComplianceScore, ComplianceCheck, EvidencePack } from '../services/complianceService';
import { findingsStore, Finding } from '../services/findingsStore';
import { futureReadinessService, ReadinessField, RegulatoryProfile } from '../services/futureReadiness';
import { batteryService } from '../services/api';
import { Battery } from '../domain/types';
import { canView, canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Input } from '../components/ui/design-system';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle, Search, Download, Plus, Filter, Activity, History, XCircle, Leaf, Recycle, Globe, AlertOctagon, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// --- Components ---

const StatusChip = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        'PASS': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'WARN': 'bg-amber-100 text-amber-800 border-amber-200',
        'FAIL': 'bg-rose-100 text-rose-800 border-rose-200',
        'OPEN': 'bg-rose-100 text-rose-800 border-rose-200',
        'IN_REVIEW': 'bg-blue-100 text-blue-800 border-blue-200',
        'CLOSED': 'bg-slate-100 text-slate-800 border-slate-200',
        // Future Readiness
        'AVAILABLE': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'PARTIAL': 'bg-amber-50 text-amber-700 border-amber-100',
        'FUTURE': 'bg-slate-100 text-slate-500 border-slate-200 border-dashed',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[status] || 'bg-slate-100'}`}>
            {status}
        </span>
    );
};

const FindingModal = ({ isOpen, onClose, onSave }: any) => {
    const [form, setForm] = useState({ title: '', severity: 'LOW', type: 'PROCESS', linkedId: '', notes: '' });
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[500px] shadow-xl border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">Report Nonconformity</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Issue summary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Severity</label>
                            <select className="w-full p-2 border rounded text-sm bg-background" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                                <option value="LOW">Low</option>
                                <option value="MED">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Type</label>
                            <select className="w-full p-2 border rounded text-sm bg-background" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                <option value="PROCESS">Process</option>
                                <option value="QUALITY">Quality</option>
                                <option value="TRACEABILITY">Traceability</option>
                                <option value="DATA_INTEGRITY">Data Integrity</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Linked ID (Battery/Batch)</label>
                        <Input value={form.linkedId} onChange={e => setForm({...form, linkedId: e.target.value})} placeholder="e.g. batt-123" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Notes</label>
                        <textarea className="w-full p-2 border rounded text-sm bg-background min-h-[80px]" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(form)} disabled={!form.title || !form.linkedId}>Create Finding</Button>
                </div>
            </div>
        </div>
    );
};

// --- Tabs ---

const OverviewTab = ({ score, checks, findings }: { score: ComplianceScore | null, checks: ComplianceCheck[], findings: Finding[] }) => {
    if (!score) return <div>Loading...</div>;
    const openFindings = findings.filter(f => f.status !== 'CLOSED').length;
    const failingChecks = checks.filter(c => c.status === 'FAIL').length;

    const pieData = [
        { name: 'Score', value: score.total },
        { name: 'Gap', value: 100 - score.total },
    ];

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <Card className="flex flex-col items-center justify-center p-6">
                    <div className="relative w-40 h-40">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} innerRadius={60} outerRadius={80} startAngle={180} endAngle={0} dataKey="value">
                                    <Cell fill={score.total > 80 ? '#10b981' : score.total > 60 ? '#f59e0b' : '#ef4444'} />
                                    <Cell fill="#e2e8f0" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                            <span className="text-4xl font-bold">{score.total}</span>
                            <span className="text-xs text-muted-foreground uppercase">Readiness</span>
                        </div>
                    </div>
                    <div className="w-full mt-4 space-y-2">
                        {Object.entries(score.breakdown).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                                <span className="capitalize text-muted-foreground">{key}</span>
                                <div className="flex items-center gap-2 w-1/2">
                                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{width: `${(val/25)*100}%`}} />
                                    </div>
                                    <span className="font-mono text-xs">{val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* KPIs */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <Card className="flex items-center p-4 gap-4 border-l-4 border-l-rose-500">
                        <div className="p-3 bg-rose-100 rounded-full text-rose-600"><AlertTriangle /></div>
                        <div>
                            <div className="text-2xl font-bold">{failingChecks}</div>
                            <div className="text-sm text-muted-foreground">Failing Checks</div>
                        </div>
                    </Card>
                    <Card className="flex items-center p-4 gap-4 border-l-4 border-l-amber-500">
                        <div className="p-3 bg-amber-100 rounded-full text-amber-600"><FileText /></div>
                        <div>
                            <div className="text-2xl font-bold">{openFindings}</div>
                            <div className="text-sm text-muted-foreground">Open Findings</div>
                        </div>
                    </Card>
                    <Card className="col-span-2">
                        <CardHeader className="pb-2"><CardTitle className="text-base">Top Compliance Gaps</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {score.topGaps.length === 0 ? <li className="text-muted-foreground text-sm italic">No major gaps detected.</li> : 
                                score.topGaps.map((gap, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <XCircle className="h-4 w-4 text-rose-500" /> {gap}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const ChecksTab = ({ checks }: { checks: ComplianceCheck[] }) => (
    <div className="space-y-4 animate-in fade-in">
        <Card>
            <CardHeader><CardTitle>Automated Rules</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Rule Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Affected</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {checks.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-mono">{c.id}</TableCell>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell><StatusChip status={c.status} /></TableCell>
                                <TableCell>{c.severity}</TableCell>
                                <TableCell>
                                    {c.affectedCount > 0 ? <span className="text-rose-600 font-bold">{c.affectedCount} units</span> : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={c.description}>{c.description}</TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

const FindingsTab = ({ findings, onCreate, onAction }: any) => {
    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter: All Statuses</span>
                </div>
                {onCreate && <Button onClick={onCreate}><Plus className="h-4 w-4 mr-2" /> New Finding</Button>}
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Linked To</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {findings.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No findings recorded.</TableCell></TableRow>
                            ) : (
                                findings.map((f: Finding) => (
                                    <TableRow key={f.findingId}>
                                        <TableCell className="font-mono text-xs">{f.findingId}</TableCell>
                                        <TableCell className="font-medium">{f.title}</TableCell>
                                        <TableCell>{f.severity}</TableCell>
                                        <TableCell><StatusChip status={f.status} /></TableCell>
                                        <TableCell className="text-xs">{f.linkedType}: {f.linkedId}</TableCell>
                                        <TableCell className="text-xs">{new Date(f.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            {f.status !== 'CLOSED' && onAction && (
                                                <Button variant="ghost" size="sm" onClick={() => onAction(f.findingId, 'close')}>Close</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

const EvidenceTab = ({ onGenerate, pack, loading }: any) => {
    const [inputId, setInputId] = useState('');
    
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-4 items-end">
                <div className="space-y-2 flex-1 max-w-sm">
                    <label className="text-sm font-medium">Target Asset ID</label>
                    <div className="flex gap-2">
                        <Input placeholder="e.g. batt-0" value={inputId} onChange={e => setInputId(e.target.value)} />
                        <Button onClick={() => onGenerate(inputId)} disabled={!inputId || loading}>
                            {loading ? 'Generating...' : 'Generate Pack'}
                        </Button>
                    </div>
                </div>
            </div>

            {pack && (
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center bg-slate-50 dark:bg-slate-900 border-b">
                        <div>
                            <CardTitle className="text-lg">Evidence Pack: {pack.subject.id}</CardTitle>
                            <p className="text-xs text-muted-foreground">Generated: {new Date(pack.generatedAt).toLocaleString()}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                             const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pack, null, 2));
                             const downloadAnchorNode = document.createElement('a');
                             downloadAnchorNode.setAttribute("href", dataStr);
                             downloadAnchorNode.setAttribute("download", `evidence_${pack.subject.id}.json`);
                             document.body.appendChild(downloadAnchorNode);
                             downloadAnchorNode.click();
                             downloadAnchorNode.remove();
                        }}>
                            <Download className="h-4 w-4 mr-2" /> Download JSON
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Identity</h4>
                                <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">{JSON.stringify(pack.identity, null, 2)}</pre>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-2 text-muted-foreground">QA Status</h4>
                                <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">{JSON.stringify(pack.qa, null, 2)}</pre>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Lifecycle Timeline</h4>
                            <div className="space-y-2">
                                {pack.lifecycle.map((evt: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b pb-1">
                                        <span>{evt.stage}</span>
                                        <div className="flex gap-4">
                                            <span className="font-mono text-xs">{evt.timestamp || '-'}</span>
                                            <Badge variant="outline" className="w-20 justify-center">{evt.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

const AuditTrailTab = () => (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <History className="h-10 w-10 mb-2 opacity-20" />
        <p>Select an asset to view detailed audit trail timeline.</p>
        <p className="text-xs mt-2">(Feature simulation limited to Evidence Pack view)</p>
    </div>
);

// --- Future Readiness Components ---

// Fix: Add optional key to component props to satisfy TS when used in list mapping
const FutureField = ({ field }: { field: ReadinessField, key?: any }) => (
    <div className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-dashed border-slate-100 dark:border-slate-800">
        <span className="text-muted-foreground">{field.label}</span>
        <div className="flex items-center gap-2">
            <span className={`font-mono text-xs ${field.status === 'FUTURE' ? 'text-slate-400 italic' : ''}`}>{field.value}</span>
            <StatusChip status={field.status} />
        </div>
    </div>
);

const FutureReadinessTab = () => {
    const { currentCluster } = useAppStore();
    const [batteryId, setBatteryId] = useState('');
    const [battery, setBattery] = useState<Battery | null>(null);
    const [readiness, setReadiness] = useState(futureReadinessService.analyzeDppReadiness(null));
    const [profiles] = useState(futureReadinessService.getRegulatoryProfiles());
    const [sustainability] = useState(futureReadinessService.getSustainabilityMetrics());

    // Granular RBAC for sub-sections
    const showDPP = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_DPP_PREVIEW);
    const showSust = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_SUSTAINABILITY_PREVIEW);
    const showRecycle = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_RECYCLING_PREVIEW);
    const showExport = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW);

    const handlePreview = async () => {
        if (!batteryId) return;
        const batt = await batteryService.getBatteryBySN(batteryId) || await batteryService.getBatteryById(batteryId);
        setBattery(batt || null);
        setReadiness(futureReadinessService.analyzeDppReadiness(batt || null));
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Banner */}
            <div className="bg-slate-900 text-white rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertOctagon className="text-amber-400" />
                        <h3 className="text-xl font-bold">Future Readiness Preview</h3>
                    </div>
                    <p className="text-slate-300 text-sm max-w-2xl">
                        These capabilities are planned for upcoming releases. 
                        The interfaces below are representative mockups demonstrating how current data will map to future regulatory requirements like EU DPP and Circular Economy standards.
                    </p>
                </div>
                <Badge variant="outline" className="text-amber-400 border-amber-400/50 bg-amber-400/10 px-4 py-2 text-sm">PREVIEW / NOT ACTIVE</Badge>
            </div>

            {/* DPP Section */}
            {showDPP && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">DPP Preview (Digital Product Passport)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <Card className="bg-slate-50 dark:bg-slate-900">
                                <CardHeader><CardTitle className="text-base">What this enables</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                        <li>Full lifecycle traceability from raw material to recycling.</li>
                                        <li>Consumer transparency via QR code scanning.</li>
                                        <li>Regulatory compliance with EU Battery Regulation.</li>
                                    </ul>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle className="text-base">Preview Selector</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Enter Battery ID/SN..." 
                                            value={batteryId} 
                                            onChange={e => setBatteryId(e.target.value)} 
                                            onKeyDown={e => e.key === 'Enter' && handlePreview()}
                                        />
                                        <Button onClick={handlePreview}>Preview</Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Try scanning a battery to see mapped fields.</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="text-base">DPP Data Structure</CardTitle>
                                <Button size="sm" variant="ghost" disabled title="Future Release">
                                    <Download className="h-4 w-4 mr-2" /> Export JSON-LD
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Identity & Conformity</h4>
                                        <div className="space-y-1">
                                            {readiness.identity.map((f, i) => <FutureField key={`identity-${i}`} field={f} />)}
                                            {readiness.conformity.map((f, i) => <FutureField key={`conformity-${i}`} field={f} />)}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Traceability & Composition</h4>
                                        <div className="space-y-1">
                                            {readiness.traceability.map((f, i) => <FutureField key={`traceability-${i}`} field={f} />)}
                                            {readiness.composition.map((f, i) => <FutureField key={`composition-${i}`} field={f} />)}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Circularity (Future)</h4>
                                    <div className="space-y-1">
                                        {readiness.circularity.map((f, i) => <FutureField key={`circularity-${i}`} field={f} />)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Sustainability Section */}
            {showSust && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <Leaf className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold">Sustainability Metrics Preview</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase">Est. Carbon Footprint</p>
                                <div className="text-2xl font-bold mt-1 text-slate-400">{sustainability.co2.value}</div>
                                <StatusChip status={sustainability.co2.status} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase">Mfg Energy / Pack</p>
                                <div className="text-2xl font-bold mt-1 text-slate-400">{sustainability.energy.value}</div>
                                <StatusChip status={sustainability.energy.status} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase">Scrap Rate Proxy</p>
                                <div className="text-2xl font-bold mt-1">{sustainability.scrap.value}</div>
                                <StatusChip status={sustainability.scrap.status} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase">Water Usage</p>
                                <div className="text-2xl font-bold mt-1 text-slate-400">{sustainability.water.value}</div>
                                <StatusChip status={sustainability.water.status} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded text-xs text-emerald-800 dark:text-emerald-200 border border-emerald-100 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        This dashboard will be powered by integration with EcoMetricsESG modules. Currently showing preview placeholders.
                    </div>
                </div>
            )}

            {/* Circularity Section */}
            {showRecycle && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <Recycle className="h-5 w-5 text-teal-600" />
                        <h3 className="text-lg font-semibold">Recycling & Circularity Preview</h3>
                    </div>
                    
                    <Card>
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between relative">
                                {/* Connector Line */}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />
                                
                                {['In-Use', 'Returned', 'Diagnosed', 'Second-Life', 'Recycled'].map((stage, i) => (
                                    <div key={stage} className="flex flex-col items-center bg-white dark:bg-slate-950 px-2">
                                        <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${i === 0 ? 'border-primary bg-primary text-white' : 'border-slate-300 text-slate-400'}`}>
                                            {i + 1}
                                        </div>
                                        <span className="text-xs font-medium mt-2 text-muted-foreground">{stage}</span>
                                        <span className="text-[10px] text-slate-400 italic">Future</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 text-center text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-4 rounded border border-dashed">
                                Requires integration with Reverse Logistics and Recycling Partner APIs.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Regulatory Export */}
            {showExport && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold">Regulatory Export Profiles</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {profiles.map(p => (
                            <Card key={p.id} className="opacity-75">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{p.name}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{p.description}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Readiness</span>
                                            <span>{p.readinessPct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${p.readinessPct}%`}} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Fields: {p.fieldCount}</span>
                                        <span>Missing: {Math.round(p.fieldCount * (1 - p.readinessPct/100))}</span>
                                    </div>
                                    <Button className="w-full" variant="outline" disabled title="Requires schema + signing">
                                        Generate Package
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Page ---

export default function Compliance() {
    const { currentCluster, currentRole, addNotification } = useAppStore();
    const [activeTab, setActiveTab] = useState('overview');
    
    // RBAC
    const showOverview = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_OVERVIEW_TAB);
    const showChecks = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_CHECKS_TAB);
    const showFindings = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_FINDINGS_TAB);
    const showEvidence = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_EVIDENCE_TAB);
    const showAudit = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB);
    const showFuture = canView(currentCluster?.id || '', ScreenId.COMPLIANCE_FUTURE_TAB);
    const canEditFindings = canDo(currentCluster?.id || '', ScreenId.COMPLIANCE_FINDINGS_EDIT, 'C');

    // Data State
    const [score, setScore] = useState<ComplianceScore | null>(null);
    const [checks, setChecks] = useState<ComplianceCheck[]>([]);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Evidence State
    const [evidencePack, setEvidencePack] = useState<EvidencePack | null>(null);
    const [packLoading, setPackLoading] = useState(false);

    // Modal
    const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);

    useEffect(() => {
        // Default tab selection
        if (!showOverview && showChecks) setActiveTab('checks');
        else if (!showOverview && !showChecks && showFindings) setActiveTab('findings');
    }, [showOverview, showChecks, showFindings]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        if (showOverview || showChecks) {
            const [s, c] = await Promise.all([complianceService.getReadinessScore(), complianceService.runChecks()]);
            setScore(s);
            setChecks(c);
        }
        if (showFindings) {
            const f = await findingsStore.listFindings();
            setFindings(f);
        }
        setLoading(false);
    };

    const handleCreateFinding = async (data: any) => {
        try {
            await findingsStore.createFinding({
                ...data,
                ownerRole: currentRole?.name,
                ownerName: currentRole?.name // In real app use user name
            });
            setIsFindingModalOpen(false);
            addNotification({ title: "Finding Created", message: "Issue logged successfully.", type: "success" });
            loadData();
        } catch (e) {
            addNotification({ title: "Error", message: "Failed to create finding.", type: "error" });
        }
    };

    const handleFindingAction = async (id: string, action: string) => {
        if (!canEditFindings) return;
        if (action === 'close') {
            const notes = prompt("Enter closure notes:");
            if (!notes) return;
            await findingsStore.closeFinding(id, notes);
            addNotification({ title: "Closed", message: "Finding closed.", type: "success" });
            loadData();
        }
    };

    const handleGenerateEvidence = async (id: string) => {
        setPackLoading(true);
        const pack = await complianceService.buildEvidencePackForBattery(id);
        setEvidencePack(pack);
        if (!pack) addNotification({ title: "Not Found", message: "Could not build pack for ID.", type: "error" });
        setPackLoading(false);
    };

    if (!showOverview && !showChecks && !showFindings && !showEvidence && !showAudit && !showFuture) {
        return <div className="p-10 text-center">Access Denied</div>;
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Compliance & Governance</h2>
                    <p className="text-muted-foreground">Audit readiness, rule enforcement, and digital records.</p>
                </div>
                {score && (
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-muted-foreground uppercase">Readiness Score</div>
                            <div className={`text-2xl font-bold ${score.total > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{score.total}/100</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto shrink-0">
                {showOverview && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('overview')}>Overview</button>}
                {showChecks && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'checks' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('checks')}>Automated Checks</button>}
                {showFindings && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'findings' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('findings')}>Findings Log</button>}
                {showEvidence && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'evidence' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('evidence')}>Evidence Packs</button>}
                {showAudit && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('audit')}>Audit Trail</button>}
                {showFuture && <button className={`pb-2 border-b-2 transition-colors ${activeTab === 'future' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('future')}>Future Readiness</button>}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pt-2">
                {loading ? <div className="text-center py-10">Loading compliance data...</div> : (
                    <>
                        {activeTab === 'overview' && <OverviewTab score={score} checks={checks} findings={findings} />}
                        {activeTab === 'checks' && <ChecksTab checks={checks} />}
                        {activeTab === 'findings' && <FindingsTab findings={findings} onCreate={canEditFindings ? () => setIsFindingModalOpen(true) : undefined} onAction={handleFindingAction} />}
                        {activeTab === 'evidence' && <EvidenceTab onGenerate={handleGenerateEvidence} pack={evidencePack} loading={packLoading} />}
                        {activeTab === 'audit' && <AuditTrailTab />}
                        {activeTab === 'future' && <FutureReadinessTab />}
                    </>
                )}
            </div>

            <FindingModal isOpen={isFindingModalOpen} onClose={() => setIsFindingModalOpen(false)} onSave={handleCreateFinding} />
        </div>
    );
}
