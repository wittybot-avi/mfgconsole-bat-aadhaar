
export const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
};

export const exportAsJson = (data: any, fileName: string) => {
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, `${fileName}.json`, "application/json");
};

export const exportAsCsv = (headers: string[], rows: any[][], fileName: string) => {
    const content = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    downloadFile(content, `${fileName}.csv`, "text/csv");
};

/**
 * Generates a mock "Digital Product Passport" (DPP-lite) based on EU structure.
 * This is a demo placeholder for future regulatory requirements.
 */
export const exportAsDppLite = (subject: any, children: any[], sku: any, events: any[]) => {
    const dpp = {
        "@context": "https://aayatana.tech/contexts/dpp-v1.jsonld",
        "id": subject.id || subject.serial,
        "type": "DigitalProductPassport",
        "issuedAt": new Date().toISOString(),
        "productIdentity": {
            "model": sku?.skuName || "Unknown",
            "sku": subject.skuCode || sku?.skuCode || "N/A",
            "serial": subject.packSerial || subject.id || subject.serial,
            "chemistry": sku?.chemistry || "LFP"
        },
        "manufacturingTrace": {
            "facility": "Aayatana Bangalore Plant Alpha",
            "batch": subject.batchId || "N/A",
            "timestamp": subject.createdAt || subject.generatedAt
        },
        "composition": {
            "type": subject.type || "ASSET",
            "componentsCount": children.length,
            "components": children.map(c => ({ 
                id: c.id || c.serial, 
                type: c.type || "COMPONENT" 
            }))
        },
        "compliance": {
            "readinessStatus": subject.status || "Active",
            "qualityDecision": subject.qcStatus || "PASS",
            "eventsCount": events.length,
            "lifecycleEvents": events.map(e => ({ 
                type: e.type, 
                ts: e.timestamp, 
                actor: e.actor 
            }))
        },
        "circularity": {
            "carbonFootprint": "Estimated 85kg CO2e",
            "recyclingInstructions": "Standard industrial LFP recovery protocol.",
            "reproducibilityScore": "High (Level 4)"
        }
    };
    exportAsJson(dpp, `DPP_Lite_${subject.id || subject.serial}`);
};
