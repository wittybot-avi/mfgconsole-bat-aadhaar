import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui/design-system';
import { Save } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function ProvisioningStationSetup() {
    const { addNotification } = useAppStore();
    const [config, setConfig] = useState({
        stationId: '',
        defaultFirmware: ''
    });

    useEffect(() => {
        const sid = localStorage.getItem('provisioning_station_id') || 'P-01';
        const fw = localStorage.getItem('provisioning_default_fw') || 'v2.4.0';
        setConfig({ stationId: sid, defaultFirmware: fw });
    }, []);

    const handleSave = () => {
        localStorage.setItem('provisioning_station_id', config.stationId);
        localStorage.setItem('provisioning_default_fw', config.defaultFirmware);
        addNotification({ title: "Saved", message: "Station configuration updated", type: "success" });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Station Setup</h2>
                <p className="text-muted-foreground">Configure local station parameters.</p>
            </div>

            <Card>
                <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Station Identifier</label>
                        <Input value={config.stationId} onChange={(e) => setConfig({...config, stationId: e.target.value})} placeholder="e.g. P-01" />
                        <p className="text-xs text-muted-foreground">Unique ID for this physical provisioning terminal.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Default Firmware</label>
                        <Input value={config.defaultFirmware} onChange={(e) => setConfig({...config, defaultFirmware: e.target.value})} />
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" /> Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}