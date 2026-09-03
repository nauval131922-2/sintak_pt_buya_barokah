import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export interface RekapItemCandidate {
  id: number;
  tgl: string;
  faktur: string;
  kd_supplier: string;
  kd_barang: string;
  qty: number;
  harga: number;
  total_item: number;
  calculatedPricePerKg?: number;
  unitType?: 'kg' | 'lembar' | 'rim' | 'roll' | 'pcs' | 'box' | 'other';
  matchConfidence?: string;
}

// Helper untuk menghitung estimasi harga per Kg jika barang berupa kertas lembaran/plano/rim
export function calculateEstimatedPricePerKg(kdBarang: string, harga: number): { pricePerKg: number; unitType: 'kg' | 'lembar' | 'rim' | 'roll' | 'pcs' | 'box' | 'other' } {
  const upper = kdBarang.toUpperCase();
  
  if (upper.includes('KG ') || upper.startsWith('KG -')) {
    return { pricePerKg: Math.round(harga), unitType: 'kg' };
  }

  // Deteksi gramatur (gsm)
  let gsm = 0;
  const gsmMatch = upper.match(/(\d{2,3})\s*GSM/) || upper.match(/HVS\s*(\d{2,3})/) || upper.match(/ART\s*PAPER\s*(\d{2,3})/) || upper.match(/ART\s*CARTON\s*(\d{2,3})/) || upper.match(/AP\s*(\d{2,3})/) || upper.match(/AC\s*(\d{2,3})/);
  if (gsmMatch) {
    gsm = parseInt(gsmMatch[1], 10);
  }

  // Deteksi dimensi plano (cm)
  let w = 65;
  let l = 100;
  const dimMatch = upper.match(/(\d+(?:\.\d+)?)\s*[X*]\s*(\d+(?:\.\d+)?)/);
  if (dimMatch) {
    w = parseFloat(dimMatch[1]);
    l = parseFloat(dimMatch[2]);
  } else if (upper.includes('-79') || upper.includes(' 79')) {
    w = 79;
    l = 109;
  } else if (upper.includes('-65') || upper.includes(' 65')) {
    w = 65;
    l = 100;
  } else if (upper.includes('-61') || upper.includes(' 61')) {
    w = 61;
    l = 86;
  } else if (upper.includes('A4')) {
    w = 21;
    l = 29.7;
  } else if (upper.includes('F4') || upper.includes('FOLIO')) {
    w = 21.5;
    l = 33;
  } else if (upper.includes('A3')) {
    w = 29.7;
    l = 42;
  }

  if (upper.includes('RIM ') || upper.startsWith('RIM -')) {
    if (gsm > 0) {
      // 1 rim = 500 lembar
      const weightRimKg = (500 * w * l * gsm) / 10000000;
      if (weightRimKg > 0) {
        return { pricePerKg: Math.round(harga / weightRimKg), unitType: 'rim' };
      }
    }
    return { pricePerKg: Math.round(harga), unitType: 'rim' };
  }

  if (upper.includes('LEMBAR ') || upper.startsWith('LEMBAR -')) {
    if (gsm > 0) {
      const weightSheetKg = (w * l * gsm) / 10000000;
      if (weightSheetKg > 0) {
        return { pricePerKg: Math.round(harga / weightSheetKg), unitType: 'lembar' };
      }
    }
    return { pricePerKg: Math.round(harga), unitType: 'lembar' };
  }

  if (upper.includes('ROLL ') || upper.startsWith('ROLL -')) {
    return { pricePerKg: Math.round(harga), unitType: 'roll' };
  }

  if (upper.includes('BOX ') || upper.includes('DUS ') || upper.startsWith('BOX -') || upper.startsWith('DUS -')) {
    return { pricePerKg: Math.round(harga), unitType: 'box' };
  }

  return { pricePerKg: Math.round(harga), unitType: 'pcs' };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetParam = searchParams.get('targetParam') || '';
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // Preset keywords jika targetParam ditentukan
    let searchTerms: string[] = [];
    if (query) {
      searchTerms = [query];
    } else if (targetParam) {
      switch (targetParam) {
        case 'tarifHvs70':
          searchTerms = ['HVS 70', 'HVS 70-65', 'HVS 70-61', 'HVS 70-79', 'HVS 70-A4'];
          break;
        case 'tarifAp120':
          searchTerms = ['Art Paper 120', 'AP 120', 'Art Paper 120-79', 'Art Paper 120-65'];
          break;
        case 'tarifAp150':
          searchTerms = ['Art Paper 150', 'AP 150', 'Art Paper 150-79', 'Art Paper 150-65'];
          break;
        case 'tarifAc230Kg':
          searchTerms = ['Art Carton 230', 'AC 230', 'Art Carton 230-65', 'Art Carton 230-79'];
          break;
        case 'tarifAc260Kg':
          searchTerms = ['Art Carton 260', 'AC 260', 'Art Carton 260-65', 'Art Carton 260-79'];
          break;
        case 'oliverPlatUnit':
          searchTerms = ['Plate ctcp 724', 'Plate ctcp 745', 'Plate ctcp 770', 'Plate ctcp', 'PLATE'];
          break;
        case 'ryobiPlatUnit':
          searchTerms = ['Plate ctcp 255', 'Plate 254', 'Alumunium Plate - 254', 'Alumunium Plate - 510', 'Plate Toko'];
          break;
        case 'tarifPrintA3':
          searchTerms = ['Print Art Carton 230', 'Print Art Paper 150', 'Print Inter', 'LEMBAR - Print'];
          break;
        case 'tarifPrintInter1Muka':
          searchTerms = ['Print Art Paper 120gsm - 1 Muka', 'Print Art Paper 150gsm - 1 Muka', 'Print Hvs 100 - 1 Muka', '1 Muka'];
          break;
        case 'tarifPrintInter2Muka':
          searchTerms = ['Print Art Paper 120gsm - BB', 'Print Art Paper 150gsm - BB', 'Print Art Carton 230gsm - BB', 'BB'];
          break;
        case 'tarifKardusBox':
          searchTerms = ['Kardus', 'Box', 'DUS'];
          break;
        case 'tarifLakbanRoll':
          searchTerms = ['Lakban', 'Lakban Roll', 'Tape'];
          break;
        case 'tarifPlastikOppPcs':
          searchTerms = ['Plastik OPP', 'OPP', 'Plastik'];
          break;
        case 'tarifLaminasiGlossyCm2':
          searchTerms = ['Laminasi Glossy', 'Plastik Laminasi Glossy', 'Laminasi'];
          break;
        case 'tarifLaminasiDoffCm2':
          searchTerms = ['Laminasi Doff', 'Plastik Laminasi Doff', 'Laminasi'];
          break;
        case 'tarifStaplesPcs':
          searchTerms = ['Staples', 'Isi staples', 'Kawat Staples'];
          break;
        default:
          searchTerms = [targetParam];
      }
    }

    let sql = `SELECT id, tgl, faktur, kd_supplier, kd_barang, qty, harga, total_item 
               FROM rekap_pembelian_barang WHERE 1=1`;
    const sqlParams: any[] = [];

    if (searchTerms.length > 0) {
      const likes = searchTerms.map(() => `kd_barang LIKE ?`).join(' OR ');
      sql += ` AND (${likes})`;
      searchTerms.forEach(t => sqlParams.push(`%${t}%`));
    }

    // Prioritaskan harga > 0 dan transaksi terbaru
    sql += ` AND harga > 0 ORDER BY substr(tgl,7,4) DESC, substr(tgl,4,2) DESC, substr(tgl,1,2) DESC, id DESC LIMIT ?`;
    sqlParams.push(limit);

    const result = await db.execute({ sql, args: sqlParams });
    const rows = (result.rows || []) as any[];

    const data: RekapItemCandidate[] = rows.map((r) => {
      const est = calculateEstimatedPricePerKg(r.kd_barang || '', Number(r.harga || 0));
      return {
        id: Number(r.id),
        tgl: String(r.tgl || ''),
        faktur: String(r.faktur || ''),
        kd_supplier: String(r.kd_supplier || ''),
        kd_barang: String(r.kd_barang || ''),
        qty: Number(r.qty || 0),
        harga: Number(r.harga || 0),
        total_item: Number(r.total_item || 0),
        calculatedPricePerKg: est.pricePerKg,
        unitType: est.unitType,
      };
    });

    return NextResponse.json({
      success: true,
      targetParam,
      query,
      data,
    });
  } catch (error: any) {
    console.error('Error in rekap-lookup API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
