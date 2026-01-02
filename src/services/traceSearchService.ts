
import { skuService } from './skuService';
import { cellTraceabilityService } from './cellTraceabilityService';
import { moduleAssemblyService } from './moduleAssemblyService';
import { packAssemblyService } from './packAssemblyService';

export interface SearchResolution {
    route: string;
    type: 'CELL' | 'MODULE' | 'PACK' | 'SKU' | 'LOT';
    id: string;
    label: string;
}

class TraceSearchService {
    async resolveIdentifier(query: string): Promise<SearchResolution | null> {
        const q = query.trim();
        if (!q) return null;

        // 1. Check SKU (matches code or starts with prefix)
        const skus = await skuService.listSkus();
        const foundSku = skus.find(s => s.skuCode.toLowerCase() === q.toLowerCase() || s.id === q);
        if (foundSku) {
            return { route: `/sku/${foundSku.id}`, type: 'SKU', id: foundSku.id, label: foundSku.skuCode };
        }

        // 2. Check Pack (matches ID PB- or serial SN-)
        const packs = await packAssemblyService.listPacks();
        const foundPack = packs.find(p => 
            p.id.toLowerCase() === q.toLowerCase() || 
            (p.packSerial && p.packSerial.toLowerCase() === q.toLowerCase())
        );
        if (foundPack) {
            return { route: `/operate/packs/${foundPack.id}`, type: 'PACK', id: foundPack.id, label: foundPack.packSerial || foundPack.id };
        }

        // 3. Check Module (starts with MOD- or matches ID)
        const modules = await moduleAssemblyService.listModules();
        const foundMod = modules.find(m => m.id.toLowerCase() === q.toLowerCase());
        if (foundMod) {
            return { route: `/operate/modules/${foundMod.id}`, type: 'MODULE', id: foundMod.id, label: foundMod.id };
        }

        // 4. Check Lot (starts with clot- or matches code)
        const lots = await cellTraceabilityService.listLots();
        const foundLot = lots.find(l => l.id.toLowerCase() === q.toLowerCase() || l.lotCode.toLowerCase() === q.toLowerCase());
        if (foundLot) {
            return { route: `/trace/cells/${foundLot.id}`, type: 'LOT', id: foundLot.id, label: foundLot.lotCode };
        }

        // 5. Check Cell Serial (Global Traceability lookup)
        const cellLookup = await cellTraceabilityService.findSerialGlobal(q);
        if (cellLookup) {
            // Found a cell serial, route to lineage for context
            return { route: `/trace/lineage/${cellLookup.serial.serial}`, type: 'CELL', id: cellLookup.serial.serial, label: cellLookup.serial.serial };
        }

        return null;
    }
}

export const traceSearchService = new TraceSearchService();
