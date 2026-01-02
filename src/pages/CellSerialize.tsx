import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cellService, CellLot } from '../services/cellService';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui/design-system';
import { ArrowLeft, ChevronRight, Fingerprint, Printer, CheckCircle, QrCode } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function CellSerialize() {
    const { lotId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useAppStore();
    const [lot, setLot] = useState<CellLot | null>(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [prefix, setPrefix] = useState('');
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (lotId) {
            cellService.getLot(lotId).then(l => {
                if (l) {
                    setLot(l);
                    setPrefix(l.serialPolicy.prefix);
                    setCount(l.quantityReceived);
                }
            });
        }
    }, [lotId]);

    const handleGenerate = async () => {
        if (!lot) return;
        setLoading(true);
        try {
            await cellService.generateSerials(lot.id, count, prefix);
            addNotification({ title: 'Serials Generated', message: `${count} codes added to lot.`, type: 'success' });
            setStep(4);
        } catch (err) {
            addNotification({ title: 'Error', message: 'Failed to generate serials.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!lot) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold">Serialization Wizard</h2>
                    <p className="text-muted-foreground">{lot.lotCode} • Step {step} of 4</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-10">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <h3 className="text-xl font-bold">Step 1: Configuration</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Policy Prefix</label>
                                    <Input value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Code Count</label>
                                    <Input type="number" value={count} onChange={e => setCount(Number(e.target.value))} />
                                </div>
                            </div>
                            <Button className="w-full" onClick={() => setStep(2)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <h3 className="text-xl font-bold">Step 2: Preview Codes</h3>
                            <p className="text-sm text-muted-foreground">Previewing first 10 generated serials based on sequential scheme.</p>
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-4 rounded border font-mono text-sm">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i}>{prefix}{1000 + i}</div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                                <Button className="flex-1" onClick={() => setStep(3)}>Verify Count</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
                            <Fingerprint className="h-16 w-16 mx-auto text-primary animate-pulse" />
                            <h3 className="text-xl font-bold">Step 3: Confirm & Lock</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">This will generate {count} unique identities. This action can only be performed once per lot.</p>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                                <Button className="flex-1" onClick={handleGenerate} disabled={loading}>
                                    {loading ? 'Generating...' : 'Confirm Generation'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <CheckCircle className="h-16 w-16 text-emerald-500" />
                                <h3 className="text-2xl font-bold">Codes Generated Successfully</h3>
                                <p className="text-muted-foreground">Serial range: {prefix}1000 — {prefix}{1000 + count - 1}</p>
                            </div>
                            
                            <div className="p-6 border-2 border-dashed rounded-lg">
                                <h4 className="font-bold mb-4 flex items-center gap-2"><Printer className="h-4 w-4" /> Print Preview (Sample)</h4>
                                <div className="grid grid-cols-4 gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="border p-2 rounded bg-white text-black flex flex-col items-center gap-1">
                                            <QrCode size={48} />
                                            <span className="text-[8px] font-mono font-bold">{prefix}{1000 + i}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button className="w-full" onClick={() => navigate(`/cells/${lot.id}`)}>Return to Lot Detail</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}