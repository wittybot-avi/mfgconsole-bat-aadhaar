
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cellService, CellLot, CellSerial } from '../services/cellService';
// Fix: Added missing Table, TableHeader, TableRow, TableHead, TableCell imports from design-system
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Scan, Info, AlertTriangle, ListChecks, CheckCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function CellScanBind() {
    const { lotId } = useParams();
    const navigate = useNavigate();
    const { currentRole, currentCluster, addNotification } = useAppStore();
    const [lot, setLot] = useState<CellLot | null>(null);
    const [scanCode, setScanCode] = useState('');
    const [station, setStation] = useState('M-01 Module Line');
    const [bindKind, setBindKind] = useState<'MODULE' | 'PACK'>('MODULE');
    const [recentScans, setRecentScans] = useState<CellSerial[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lotId) {
            cellService.getLot(lotId).then(setLot);
            cellService.listSerials(lotId).then(s => {
                setRecentScans(s.filter(x => x.status === 'SCANNED').sort((a,b) => (b.scannedAt || '').localeCompare(a.scannedAt || '')).slice(0, 10));
            });
        }
    }, [lotId]);

    const handleScan = async () => {
        if (!lot || !scanCode) return;
        setLoading(true);
        try {
            const result = await cellService.scanSerial(lot.id, scanCode, {
                station,
                actor: `${currentRole?.name}`,
                bindKind
            });
            addNotification({ title: 'Bound', message: `Serial ${result.serial} scanned successfully.`, type: 'success' });
            setScanCode('');
            // Update local recent scans
            setRecentScans([result, ...recentScans].slice(0, 10));
        } catch (err: any) {
            addNotification({ title: 'Scan Error', message: err.message || 'Validation failed.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!lot) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold">Assembly Scanning</h2>
                    <p className="text-muted-foreground">{lot.lotCode} • Lot {lot.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-primary/20 shadow-lg">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Scan className="h-5 w-5" /> Scanner Entry</CardTitle></CardHeader>
                        <CardContent className="space-y-6 p-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Workstation</label>
                                    <select className="w-full p-2 border rounded bg-background" value={station} onChange={e => setStation(e.target.value)}>
                                        <option value="M-01 Module Line">M-01 Module Line</option>
                                        <option value="M-02 Module Line">M-02 Module Line</option>
                                        <option value="P-02 Pack Assembly">P-02 Pack Assembly</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Target Record</label>
                                    <select className="w-full p-2 border rounded bg-background" value={bindKind} onChange={e => setBindKind(e.target.value as any)}>
                                        <option value="MODULE">Target: MODULE (Sub-assembly)</option>
                                        <option value="PACK">Target: PACK (Main-assembly)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-4">
                                <label className="text-sm font-medium text-center block mb-2">Scan or Manually Enter Cell Serial</label>
                                <div className="flex gap-2">
                                    <Input 
                                        className="text-2xl font-mono h-16 text-center tracking-widest border-2 focus-visible:ring-primary" 
                                        placeholder="C1000..." 
                                        value={scanCode} 
                                        onChange={e => setScanCode(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleScan()}
                                        autoFocus
                                    />
                                    <Button size="lg" className="h-16 px-10" onClick={handleScan} disabled={loading || !scanCode}>
                                        {loading ? 'Validating...' : 'SCAN'}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                                <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                    Binding to actual module/pack entities will be integrated in Patch C. 
                                    Currently, this scan registers a "Used" status in the digital ledger for the selected workstation.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> Session History</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Serial</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Scanned At</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <tbody>
                                    {recentScans.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No scans in this session.</TableCell></TableRow>
                                    ) : (
                                        recentScans.map((s, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-mono font-bold">{s.serial}</TableCell>
                                                <TableCell className="text-xs">{s.boundTo?.kind}: {s.boundTo?.refId}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{new Date(s.scannedAt!).toLocaleTimeString()}</TableCell>
                                                <TableCell className="text-right"><CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Station Validation Rules</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-emerald-600">
                                <CheckCircle className="h-4 w-4" /> <span>Lot Status: PUBLISHED</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-emerald-600">
                                <CheckCircle className="h-4 w-4" /> <span>Chemistry: {lot.chemistry} (LFP Match)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-emerald-600">
                                <CheckCircle className="h-4 w-4" /> <span>Operator Authorized: {currentRole?.name}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2 opacity-30 grayscale">
                        <AlertTriangle className="h-8 w-8" />
                        <p className="text-xs font-bold uppercase tracking-widest">Hard Gate Active</p>
                        <p className="text-[10px]">Station P-02 prevents pack closing until 16 cell scans are verified.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
