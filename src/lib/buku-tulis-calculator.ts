// ponytail: kalkulator dan master parameter buku tulis 72 hal (06. Pricelist Buku Tulis)
// Referensi: Pricelist Buku Tulis.xlsx sheets Source Buku Tulis, HARGA JULI 2026, PRICELIST 2026
// Soft cover 72 hal (18 lembar isi), cover Art Carton 230 gsm 4 warna 1 muka laminasi glossy, isi HVS 70 gsm 1 warna bolak-balik

export interface BukuTulisMasterParams {
  // A. Bahan Kertas
  tarifArtCarton230Kg: number; // Master!D12 default 16.400 /kg
  upArtCartonPct: number; // default 0% (sesuai Master!E12 = 0)
  tarifHvs70Kg: number; // Master!D22 HVS 70 15.700 /kg
  upHvsPct: number; // default 3% (sesuai Master!E22 = 0.03)

  // B. Insheet
  insheetCoverPod: number; // Master!D13 default 7
  insheetCoverOffset: number; // Master!D13 default 100
  insheetIsiRyobi: number; // Master!D23 default 30
  insheetIsiOliver: number; // Master!D23 default 100
  insheetIsiSm: number; // Master!D23 default 300

  // C. Desain
  tarifDesignCover: number; // Master!D17 default 20.000
  tarifDesignIsiPerHlm: number; // Master!D26 default 2.500 per halaman

  // D. Cetak Cover & Isi
  tarifPrintCoverA3: number; // Rp 2.500 / lbr A3+
  tarifPlatOliver: number; // Rp 45.000
  minOrderOliver: number; // Rp 90.000
  tarifDrekOliver: number; // Rp 40
  tarifPlatRyobi: number; // Rp 10.000
  minOrderRyobi: number; // Rp 15.000
  tarifDrekRyobi: number; // Rp 30
  tarifPlatSm: number; // Rp 78.000
  minOrderSm: number; // Rp 310.000
  tarifDrekSm: number; // Rp 100

  // E. Laminasi
  tarifLaminasiGlossyCm2: number; // Rp 0.35 / cm2
  minLaminasi: number; // Rp 50.000

  // F. Finishing & Packing
  tarifSisirPerPcs: number; // Rp 150 / pcs
  tarifTransport: number; // Rp 15.000
  tarifKardusBox: number; // Rp 8.500
  kapasitasKardus: number; // 300 pcs / box
  tarifLakbanRoll: number; // Rp 9.600

  // G. Margin & nego
  marginDefaultPct: number; // default 20%
  negoDefaultPct: number; // default 4%
}

export const DEFAULT_BUKU_TULIS_PARAMS: BukuTulisMasterParams = {
  tarifArtCarton230Kg: 16400,
  upArtCartonPct: 0,
  tarifHvs70Kg: 15700,
  upHvsPct: 3,

  insheetCoverPod: 7,
  insheetCoverOffset: 100,
  insheetIsiRyobi: 30,
  insheetIsiOliver: 100,
  insheetIsiSm: 300,

  tarifDesignCover: 20000,
  tarifDesignIsiPerHlm: 2500,

  tarifPrintCoverA3: 2500,
  tarifPlatOliver: 45000,
  minOrderOliver: 90000,
  tarifDrekOliver: 40,
  tarifPlatRyobi: 10000,
  minOrderRyobi: 15000,
  tarifDrekRyobi: 30,
  tarifPlatSm: 78000,
  minOrderSm: 310000,
  tarifDrekSm: 100,

  tarifLaminasiGlossyCm2: 0.35,
  minLaminasi: 50000,

  tarifSisirPerPcs: 150,
  tarifTransport: 15000,
  tarifKardusBox: 8500,
  kapasitasKardus: 300,
  tarifLakbanRoll: 9600,

  marginDefaultPct: 20,
  negoDefaultPct: 4,
};

export type BukuTulisUkuranType = '15,5 x 21' | '16 x 21';
export type BukuTulisMesinCoverType = 'Otomatis' | 'Print Inter' | 'Oliver' | 'SM';
export type BukuTulisMesinIsiType = 'Otomatis' | 'Ryobi' | 'Oliver' | 'SM';

export const BUKU_TULIS_CONFIG: Record<BukuTulisUkuranType, {
  w: number; h: number;
  description: string;
}> = {
  '15,5 x 21': {
    w: 15.5, h: 21,
    description: '15,5 x 21 cm (tertutup) · 72 hal / 18 lbr · Cover AC 230 gsm 4W 1Muka + Laminasi Glossy',
  },
  '16 x 21': {
    w: 16, h: 21,
    description: '16 x 21 cm (tertutup) · 72 hal / 18 lbr · Cover AC 230 gsm 4W 1Muka + Laminasi Glossy',
  },
};

export const BUKU_TULIS_TIERS: number[] = [
  20, 30, 50, 70, 100, 150, 200, 250, 300, 350, 400, 500,
  600, 650, 700, 750, 800, 850, 900, 950, 1000, 1500, 2000, 2500, 3000, 3500, 5000, 10000,
];

export interface BukuTulisSimulatorInput {
  oplah: number;
  ukuran: BukuTulisUkuranType;
  jumlahHalaman: number; // fixed 72
  metodeCetakCover?: BukuTulisMesinCoverType;
  metodeCetakIsi?: BukuTulisMesinIsiType;
  opsiLaminasi: boolean;
  opsiSisir: boolean;
  marginPct: number;
  negoDiskonPct: number;
}

export interface BukuTulisBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface BukuTulisSimulatorResult {
  input: BukuTulisSimulatorInput;
  metodeCoverTerpilih: 'Print Inter' | 'Oliver';
  metodeIsiTerpilih: 'Ryobi' | 'Oliver' | 'SM';
  breakdown: BukuTulisBreakdownItem[];
  kebutuhanCover: number;
  kebutuhanIsi: number;
  totalHpp: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  hargaNegoPerPcs: number;
  totalHargaJual: number;
  totalHargaNego: number;
  profitPerPcs: number;
  profitNegoPerPcs: number;
  profitTotal: number;
  profitNegoTotal: number;
  marginPct: number;
  marginNegoPct: number;
}

export function calculateBukuTulisHpp(
  input: BukuTulisSimulatorInput,
  rawParams: BukuTulisMasterParams = DEFAULT_BUKU_TULIS_PARAMS
): BukuTulisSimulatorResult {
  const p: BukuTulisMasterParams = { ...DEFAULT_BUKU_TULIS_PARAMS, ...(rawParams || {}) };
  const { oplah, jumlahHalaman = 72, opsiLaminasi = true, opsiSisir = true, marginPct = p.marginDefaultPct, negoDiskonPct = p.negoDefaultPct } = input;
  const validOplah = Math.max(1, oplah);

  // Klasifikasi skala mesin produksi sesuai master Excel 2026:
  // 1. Oplah <= 500 pcs: Cover Print Inter A3+ (POD) & Isi Ryobi 1W
  // 2. Oplah 600 - 2.500 pcs: Cover Oliver 4W & Isi Oliver 1W
  // 3. Oplah >= 3.000 pcs: Cover Oliver 4W & Isi Speedmaster SM 102 1W
  const coverMesin: 'Print Inter' | 'Oliver' | 'SM' =
    input.metodeCetakCover && input.metodeCetakCover !== 'Otomatis'
      ? input.metodeCetakCover
      : (validOplah <= 500 ? 'Print Inter' : 'Oliver');

  const isiMesin: 'Ryobi' | 'Oliver' | 'SM' =
    input.metodeCetakIsi && input.metodeCetakIsi !== 'Otomatis'
      ? input.metodeCetakIsi
      : (validOplah <= 500 ? 'Ryobi' : (validOplah < 3000 ? 'Oliver' : 'SM'));

  const isCoverPrintInter = coverMesin === 'Print Inter';
  const isCoverSM = coverMesin === 'SM';
  const isIsiRyobi = isiMesin === 'Ryobi';
  const isIsiOliver = isiMesin === 'Oliver';
  const isIsiSM = isiMesin === 'SM';

  const breakdown: BukuTulisBreakdownItem[] = [];
  let totalHpp = 0;

  const add = (nama: string, nominal: number, keterangan = '') => {
    if (nominal === 0) return;
    breakdown.push({ nama, nominal: Math.round(nominal), pct: 0, keterangan });
    totalHpp += nominal;
  };

  // 1. COVER (Art Carton 230 gsm)
  let biayaKertasCover = 0;
  let biayaPlatCover = 0;
  let biayaCetakCover = 0;
  const biayaDesainCover = p.tarifDesignCover;
  let kebutuhanCover = 0;
  const isOplahBesar = validOplah >= 3000;

  if (isCoverPrintInter) {
    // Print Inter A3+ (Ukuran 15.5 x 21 cm, 1 A3+ muat 2 cover) - BUKU!R7: (H7/2)+K6
    const insheet = p.insheetCoverPod ?? 7;
    const rCover = (validOplah / 2) + insheet;
    kebutuhanCover = Math.ceil(rCover);
    biayaKertasCover = rCover * p.tarifPrintCoverA3;
    add('Cover Print Digital A3+ (POD Inter)', biayaKertasCover,
      `${rCover.toFixed(1)} lbr A3+ POD (net ${validOplah / 2} + ${insheet} insheet) @ Rp ${p.tarifPrintCoverA3.toLocaleString('id-ID')}`);
  } else if (isCoverSM) {
    // Speedmaster SM 102 (Ukuran 16 x 21 cm, Plano 79 x 109 cm potong 2, muat 8 cover)
    // BUKU!O7 = 2, BUKU!P7 = 8, BUKU!Y6 = 78.000, BUKU!AB6 = 310.000, BUKU!AC7 = 100
    const insheetBase = p.insheetCoverOffset ?? 100;
    const insheet = isOplahBesar ? Math.max(insheetBase, validOplah * 0.03) : insheetBase;
    const rCover = (validOplah / 8) + (insheet / 2);
    kebutuhanCover = Math.ceil(rCover);

    const beratPlanoRim = (79 * 109 * 230) / 20000;
    const hargaPlanoCover = (beratPlanoRim * p.tarifArtCarton230Kg * (1 + p.upArtCartonPct / 100)) / 500;
    biayaKertasCover = rCover * hargaPlanoCover;

    biayaPlatCover = 4 * p.tarifPlatSm; // 4 * 78.000 = 312.000
    const qCetakCover = rCover * 2;
    const minOrderCover = p.minOrderSm * 4; // 4 * 310.000 = 1.240.000
    const overDrekCover = Math.max(0, qCetakCover - 3000);
    const biayaOverCover = overDrekCover * p.tarifDrekSm * 4; // over * 100 * 4
    biayaCetakCover = minOrderCover + biayaOverCover;

    add('Kertas Cover Art Carton 230 gsm (Plano)', biayaKertasCover,
      `${rCover.toFixed(1)} plano 79×109 cm @ Rp ${Math.round(hargaPlanoCover).toLocaleString('id-ID')}`);
    add('Plat & Cetak Mesin SM 102 Cover (4W)', biayaPlatCover + biayaCetakCover,
      `4 Plat CTP SM + Ongkos Cetak Speedmaster (Min Rp ${minOrderCover.toLocaleString('id-ID')}${overDrekCover > 0 ? ` + Over Rp ${biayaOverCover.toLocaleString('id-ID')}` : ''})`);
  } else {
    // Oliver Offset (Ukuran 16 x 21 cm, Plano 79 x 109 cm muat 10 cover)
    // BUKU!K7: di oplah besar (>=3000) K7 = MAX(100, H * 0.03). Di oplah < 3000 K7 = flat 100.
    const insheetBase = p.insheetCoverOffset ?? 100;
    const insheet = isOplahBesar ? Math.max(insheetBase, validOplah * 0.03) : insheetBase;
    const rCover = (validOplah / 10) + (insheet / 5);
    kebutuhanCover = Math.ceil(rCover);

    // Berat plano 79x109x230/20000 = 99,0265 kg/rim * 16400 * (1 + up%) / 500 (BUKU!W29)
    const beratPlanoRim = (79 * 109 * 230) / 20000;
    const hargaPlanoCover = (beratPlanoRim * p.tarifArtCarton230Kg * (1 + p.upArtCartonPct / 100)) / 500;
    biayaKertasCover = rCover * hargaPlanoCover;

    biayaPlatCover = 4 * p.tarifPlatOliver;
    const qCetakCover = rCover * 5;
    const minOrderCover = p.minOrderOliver * 4;
    const overDrekCover = Math.max(0, qCetakCover - 1000);
    const biayaOverCover = overDrekCover * p.tarifDrekOliver * 4;
    biayaCetakCover = minOrderCover + biayaOverCover;

    add('Kertas Cover Art Carton 230 gsm (Plano)', biayaKertasCover,
      `${rCover.toFixed(1)} plano 79×109 cm @ Rp ${Math.round(hargaPlanoCover).toLocaleString('id-ID')}`);
    add('Plat & Cetak Mesin Oliver Cover (4W)', biayaPlatCover + biayaCetakCover,
      `4 Plat CTP Oliver + Ongkos Cetak Oliver (Min Rp ${minOrderCover.toLocaleString('id-ID')}${overDrekCover > 0 ? ` + Over Rp ${biayaOverCover.toLocaleString('id-ID')}` : ''})`);
  }

  // 2. ISI BUKU (72 Halaman = 18 Lembar HVS 70 gsm)
  let biayaKertasIsi = 0;
  // BUKU!AT7: Desain isi = Master!D26 * 18 lembar (72 halaman)
  const biayaDesainIsi = p.tarifDesignIsiPerHlm * 18;
  let biayaPlatIsi = 0;
  let biayaCetakIsi = 0;
  let kebutuhanIsi = 0;

  if (isIsiRyobi) {
    // Cetak Ryobi (15.5 x 21 cm / 16 x 21 cm): Folio muat 4 isi (AN = 18)
    const an = 18;
    const insheet = p.insheetIsiRyobi ?? 30;
    const apIsi = (validOplah * an) + (insheet * an);
    kebutuhanIsi = apIsi;

    // Berat folio rim: (21.5 * 33 * 70)/20000 = 2.48325 kg * 15700 * (1 + up%) / rim (BUKU!AU29)
    const beratFolioKg = (21.5 * 33 * 70) / 20000;
    const hargaFolioRim = beratFolioKg * p.tarifHvs70Kg * (1 + p.upHvsPct / 100);
    biayaKertasIsi = (apIsi / 500) * hargaFolioRim;

    biayaPlatIsi = p.tarifPlatRyobi; // 10.000
    const putaranIsi = apIsi * 2;
    const overDrekIsi = Math.max(0, putaranIsi - 500);
    biayaCetakIsi = p.minOrderRyobi + (overDrekIsi * p.tarifDrekRyobi);

    add('Kertas Isi HVS 70 gsm (Folio)', biayaKertasIsi,
      `${apIsi} lbr folio (${(apIsi / 500).toFixed(1)} rim) @ Rp ${Math.round(hargaFolioRim).toLocaleString('id-ID')}/rim`);
    add('Plat & Cetak Mesin Ryobi Isi (1W)', biayaPlatIsi + biayaCetakIsi,
      `1 Plat CTP + Ongkos Cetak Ryobi (Min Rp ${p.minOrderRyobi.toLocaleString('id-ID')} + Over ${overDrekIsi} drek)`);
  } else if (isIsiOliver) {
    // Cetak Oliver (16 x 21 cm): Plano 65x100 potong 2 (muat 32 isi per plano, AN=4.5, AN6=5)
    const an = 4.5;
    const an6 = 5; // ROUNDUP(4.5, 0)
    // BUKU!AI6: Insheet Isi Oliver mengacu dinamis ke p.insheetIsiOliver
    const insheet = p.insheetIsiOliver ?? 100;
    const apIsi = ((validOplah / 2) * an) + ((insheet / 2) * an6);
    kebutuhanIsi = Math.ceil(apIsi);
    const aoIsi = apIsi * 2;

    // Berat plano 65x100x70/20000 = 22.75 kg * 15700 * (1 + up%) / 500 = Rp 714,35 / plano (BUKU!AU29)
    const hargaPlanoIsi = ((65 * 100 * 70) / 20000 * p.tarifHvs70Kg * (1 + p.upHvsPct / 100)) / 500;
    biayaKertasIsi = apIsi * hargaPlanoIsi;

    biayaPlatIsi = p.tarifPlatOliver; // 45.000
    const putaranIsi = aoIsi * 2;
    const overDrekIsi = Math.max(0, putaranIsi - 1000);
    biayaCetakIsi = p.minOrderOliver + (overDrekIsi * p.tarifDrekOliver);

    add('Kertas Isi HVS 70 gsm (Plano 65×100)', biayaKertasIsi,
      `${apIsi.toFixed(1)} plano 65×100 @ Rp ${Math.round(hargaPlanoIsi).toLocaleString('id-ID')}/plano`);
    add('Plat & Cetak Mesin Oliver Isi (1W)', biayaPlatIsi + biayaCetakIsi,
      `1 Plat CTP + Ongkos Cetak Oliver (Min Rp ${p.minOrderOliver.toLocaleString('id-ID')} + Over ${overDrekIsi} drek)`);
  } else {
    // Cetak Speedmaster SM 102 (16 x 21 cm, Oplah >= 3000): Plano 65x100 potong 1 (muat 32 isi, AN=2.25, AN6=3)
    const an = 2.25;
    const an6 = 3; // ROUNDUP(2.25, 0)
    const insheet = p.insheetIsiSm ?? 300;
    const apIsi = (validOplah * an) + (insheet * an6);
    kebutuhanIsi = Math.ceil(apIsi);
    const aoIsi = apIsi * 1;

    // Berat plano 65x100x70/20000 = 22.75 kg * 15700 * (1 + up%) / 500 (BUKU!AU29)
    const hargaPlanoIsi = ((65 * 100 * 70) / 20000 * p.tarifHvs70Kg * (1 + p.upHvsPct / 100)) / 500;
    biayaKertasIsi = apIsi * hargaPlanoIsi;

    biayaPlatIsi = p.tarifPlatSm; // 78.000
    const putaranIsi = aoIsi * 2;
    const overDrekIsi = Math.max(0, putaranIsi - 3000);
    biayaCetakIsi = p.minOrderSm + (overDrekIsi * p.tarifDrekSm);

    add('Kertas Isi HVS 70 gsm (Plano 65×100)', biayaKertasIsi,
      `${apIsi} plano 65×100 @ Rp ${Math.round(hargaPlanoIsi).toLocaleString('id-ID')}/plano`);
    add('Plat & Cetak Mesin SM 102 Isi (1W)', biayaPlatIsi + biayaCetakIsi,
      `1 Plat CTP SM + Ongkos Cetak Speedmaster (Min Rp ${p.minOrderSm.toLocaleString('id-ID')} + Over ${overDrekIsi} drek)`);
  }

  // 3. DESAIN ARTWORK
  if (biayaDesainCover + biayaDesainIsi > 0) {
    add('Desain Setting Cover & Isi', biayaDesainCover + biayaDesainIsi,
      `Cover Rp ${biayaDesainCover.toLocaleString('id-ID')}${biayaDesainIsi > 0 ? ` + Isi Rp ${biayaDesainIsi.toLocaleString('id-ID')}` : ' (Isi gratis)'}`);
  }

  // 4. LAMINASI GLOSSY COVER
  // BUKU!CI7: (((D7*2)*(F7)*$CI$6)*H7)*N7
  // Pada file 3.000-10.000 pcs (16x21): D7 = 15.5, F7 = 21 (tanpa +1 bleed, luas = 651 cm2)
  // Pada file < 3000 pcs: D7*2+1 = 32, F7+1 = 22 (dengan +1 bleed, luas = 704 cm2)
  if (opsiLaminasi) {
    const luasLaminasi = isOplahBesar ? (15.5 * 2 * 21) : (32 * 22);
    const rawLam = luasLaminasi * p.tarifLaminasiGlossyCm2 * validOplah;
    const biayaLaminasi = Math.max(p.minLaminasi, rawLam);
    add('Laminasi Glossy Cover', biayaLaminasi,
      biayaLaminasi <= p.minLaminasi ? `Tarif Minimum Rp ${p.minLaminasi.toLocaleString('id-ID')}` : `${validOplah} pcs × Rp ${(biayaLaminasi / validOplah).toFixed(1)}/pcs`);
  }

  // 5. FINISHING JILID & POTONG SISIR
  // BUKU!BT7: Ongkos Sisir H7 * 150
  const sisir = opsiSisir ? validOplah * p.tarifSisirPerPcs : 0;
  let jilidSusun = 0;
  let ketFinishing = '';

  if (isIsiRyobi && validOplah <= 500) {
    // BUKU!BP7 + BQ7: Susun & Staples manual di oplah kecil
    jilidSusun = (validOplah * 161.062) + (validOplah * 9);
    ketFinishing = `Susun & Staples manual (Rp 170,06/pcs)${opsiSisir ? ` + Sisir Rp ${p.tarifSisirPerPcs}/pcs` : ''}`;
  } else {
    // Jilid Mesin Stiching (BUKU!BJ7 + BK7 + BL7 + BM7)
    // BUKU!BK7: ($BK$6 * (H7 * $BK$2)) -> BK2 bernilai 1 di oplah >= 3.000, bernilai 2 di oplah 600-2.500
    const pengaliSisip = isOplahBesar ? 1 : 2;
    const sisipJilid = 45.097359999999995 * pengaliSisip * validOplah;

    // BUKU!BJ7: ($BJ$6 * $AN$6) * H7 -> AN6 = 3 (SM), 5 (Oliver), 18 (Ryobi)
    let an6 = 5;
    if (isIsiSM) an6 = 3;
    else if (isIsiOliver) an6 = 5;
    else if (isIsiRyobi) an6 = 18;

    const lipat = 6.012981333333333 * an6 * validOplah;
    const kawat = 4.761904761904762 * validOplah; // BUKU!BL7
    const stiching = 17.34513846153846 * validOplah; // BUKU!BM7
    jilidSusun = lipat + sisipJilid + kawat + stiching;

    const mesinLabel = isIsiSM ? 'otomatis SM' : (isIsiOliver ? 'mesin Oliver' : 'mesin Ryobi');
    const tarifPcs = (jilidSusun / validOplah).toFixed(2);
    ketFinishing = `Lipat + Sisip + Stiching kawat ${mesinLabel} (Rp ${tarifPcs}/pcs)${opsiSisir ? ` + Sisir Rp ${p.tarifSisirPerPcs}/pcs` : ''}`;
  }

  add('Jilid Staples / Stiching & Sisir', jilidSusun + sisir, ketFinishing);
  add('Transportasi Finishing', p.tarifTransport, 'Biaya transportasi antar proses');

  // 6. KARDUS MASTER & PACKING LAKBAN (BUKU!DD7)
  const boxCount = Math.ceil(validOplah / (p.kapasitasKardus ?? 300));
  const biayaKardus = boxCount * p.tarifKardusBox;
  const biayaLakban = (validOplah / (p.kapasitasKardus ?? 300) / 39.03061224489796) * (p.tarifLakbanRoll ?? 9600);
  add('Packing Kardus Master & Lakban', biayaKardus + biayaLakban,
    `${boxCount} box kardus master (@ ${p.kapasitasKardus ?? 300} pcs/box) + segel lakban`);

  // Recompute pct
  breakdown.forEach(b => { b.pct = totalHpp > 0 ? b.nominal / totalHpp : 0; });

  const roundedTotalHpp = Math.round(totalHpp);
  const hppPerPcs = roundedTotalHpp / validOplah;
  const rawHargaJual = hppPerPcs * (1 + marginPct / 100);
  const hargaJualPerPcs = Math.ceil(rawHargaJual / 10) * 10;
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct / 100)) / 10) * 10;
  const totalHargaJual = hargaJualPerPcs * validOplah;
  const totalHargaNego = hargaNegoPerPcs * validOplah;
  const profitPerPcs = hargaJualPerPcs - hppPerPcs;
  const profitNegoPerPcs = hargaNegoPerPcs - hppPerPcs;
  const profitTotal = totalHargaJual - roundedTotalHpp;
  const profitNegoTotal = totalHargaNego - roundedTotalHpp;
  const marginPctActual = hargaJualPerPcs > 0 ? profitPerPcs / hargaJualPerPcs : 0;
  const marginNegoPct = hargaNegoPerPcs > 0 ? profitNegoPerPcs / hargaNegoPerPcs : 0;

  return {
    input,
    metodeCoverTerpilih: coverMesin,
    metodeIsiTerpilih: isiMesin,
    breakdown,
    kebutuhanCover,
    kebutuhanIsi,
    totalHpp: roundedTotalHpp,
    hppPerPcs,
    hargaJualPerPcs,
    hargaNegoPerPcs,
    totalHargaJual,
    totalHargaNego,
    profitPerPcs,
    profitNegoPerPcs,
    profitTotal,
    profitNegoTotal,
    marginPct: marginPctActual,
    marginNegoPct,
  };
}

export type SavedBukuTulisSimulationItem = {
  id: string;
  title: string;
  savedAt: string;
  data: BukuTulisSimulatorResult;
  paramsSnapshot?: BukuTulisMasterParams;
};
