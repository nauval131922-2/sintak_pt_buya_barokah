// ponytail: kalkulator dan master parameter buku manasik (01. Pricelist Buku Manasik)

export interface ManasikMasterParams {
  // 1. Bahan & Kertas Cover
  tarifAc230Kg: number; // 15100 per kg
  tarifAc260Kg: number; // 15100 per kg
  tarifPrintCoverA3: number; // 2500 per lembar A3+ (POD)
  insheetCover: number; // 5 lembar

  // 2. Ongkos Cetak Cover Offset (Oliver)
  oliverMinOngkosCover: number; // 90000 (1000 lbr)
  oliverPlatUnitCover: number; // 45000 (ctp/plat)
  oliverDrekOverCover: number; // 40 per drek over
  tarifDesainCover: number; // 20000

  // 3. Blok Isi Manasik (Kosongan / Ready)
  hargaIsiKosongan96: number; // 1800
  hargaIsiKosongan128: number; // 2300
  hargaIsiKosongan192: number; // 3421 (standar 192 hal)
  hargaIsiKosongan208: number; // 3650

  // 4. Finishing & Jilid
  tarifBendingPerCm2: number; // 50 (min 100000)
  minBending: number; // 100000
  tarifLaminasiGlossyCm2: number; // 0.35 (min 50000)
  tarifLaminasiDoffCm2: number; // 0.40 (min 50000)
  tarifUvVarnishCm2: number; // 0.11 (min 50000)
  minLaminasi: number; // 50000

  tarifStaplesPalu: number; // 112.74
  tarifCasingIn: number; // 225.49
  tarifSisir: number; // 150
  tarifLubangBor: number; // 225.49
  tarifPasangTali: number; // 112.74
  tarifTaliKurPerPcs: number; // 285.71 (1 roll 16000 / 56 pcs)
  tarifSpiralManasik: number; // 1200

  // 5. Packing & Kemasan
  tarifPlastikOppPack: number; // 9200 (isi 100) -> 92/pcs
  jasaPlastikOpp: number; // 225.49
  tarifKardusBox: number; // 8500
  kapasitasKardusManasik: number; // 200 pcs / box
  tarifLakbanBox: number; // 1500
}

export const DEFAULT_MANASIK_PARAMS: ManasikMasterParams = {
  tarifAc230Kg: 15100,
  tarifAc260Kg: 15500,
  tarifPrintCoverA3: 2500,
  insheetCover: 5,

  oliverMinOngkosCover: 90000,
  oliverPlatUnitCover: 45000,
  oliverDrekOverCover: 40,
  tarifDesainCover: 20000,

  hargaIsiKosongan96: 1800,
  hargaIsiKosongan128: 2300,
  hargaIsiKosongan192: 3421,
  hargaIsiKosongan208: 3650,

  tarifBendingPerCm2: 50,
  minBending: 100000,
  tarifLaminasiGlossyCm2: 0.35,
  tarifLaminasiDoffCm2: 0.40,
  tarifUvVarnishCm2: 0.11,
  minLaminasi: 50000,

  tarifStaplesPalu: 113,
  tarifCasingIn: 225,
  tarifSisir: 150,
  tarifLubangBor: 225,
  tarifPasangTali: 113,
  tarifTaliKurPerPcs: 286,
  tarifSpiralManasik: 1200,

  tarifPlastikOppPack: 9200,
  jasaPlastikOpp: 225,
  tarifKardusBox: 8500,
  kapasitasKardusManasik: 200,
  tarifLakbanBox: 1500,
};

export interface ManasikSimulatorInput {
  oplah: number;
  jumlahHalaman: 96 | 128 | 192 | 208;
  tipeJilid: 'Softcover (Bending/Lem Panas)' | 'Staples Kawat' | 'Tali Cocard' | 'Spiral Kawat';
  metodeCetakCover: 'Otomatis' | 'Print Digital (A3+)' | 'Offset (Oliver)';
  laminasiCover: 'Tanpa Laminasi' | 'Glossy' | 'Doff' | 'UV Varnish';
  opsiPlastikOpp: boolean;
  opsiKardus: boolean;
  marginPct: number; // Default 30%
  negoDiskonPct: number; // 0-100%
}

export interface ManasikBreakdownItem {
  nama: string;
  nominal: number;
  pct: number;
  keterangan: string;
}

export interface ManasikSimulatorOutput {
  input: ManasikSimulatorInput;
  metodeCoverTerpilih: 'Print Digital (A3+)' | 'Offset (Oliver)';
  tebalPunggungCm: number;
  breakdown: ManasikBreakdownItem[];
  kebutuhanPlanoCover: number;
  kebutuhanA3Cover: number;
  summary: {
    totalHpp: number;
    hppPerPcs: number;
    marginNominalPerPcs: number;
    totalHargaJual: number;
    hargaJualPerPcs: number;
    totalHargaNego: number;
    hargaNegoPerPcs: number;
    totalProfit: number;
    totalProfitNego: number;
  };
}

export function calculateManasikSimulator(
  input: ManasikSimulatorInput,
  params: ManasikMasterParams = DEFAULT_MANASIK_PARAMS
): ManasikSimulatorOutput {
  const {
    oplah,
    jumlahHalaman,
    tipeJilid,
    metodeCetakCover,
    laminasiCover,
    opsiPlastikOpp,
    opsiKardus,
    marginPct,
    negoDiskonPct,
  } = input;

  const validOplah = Math.max(1, oplah);
  const widthCm = 10;
  const heightCm = 15.5;

  // 1. Hitung Tebal Punggung Buku
  let tebalPunggung = 0.5;
  if (jumlahHalaman <= 100) tebalPunggung = 0.5;
  else if (jumlahHalaman <= 200) tebalPunggung = 0.9;
  else if (jumlahHalaman <= 300) tebalPunggung = 1.5;
  else tebalPunggung = 2.0;

  // 2. Tentukan Metode Cetak Cover (POD vs Offset)
  let metodeCover: 'Print Digital (A3+)' | 'Offset (Oliver)' = 'Print Digital (A3+)';
  if (metodeCetakCover === 'Offset (Oliver)') {
    metodeCover = 'Offset (Oliver)';
  } else if (metodeCetakCover === 'Print Digital (A3+)') {
    metodeCover = 'Print Digital (A3+)';
  } else {
    // Otomatis: Oplah < 300 pakai POD A3+, >= 300 pakai Offset Oliver
    metodeCover = validOplah >= 300 ? 'Offset (Oliver)' : 'Print Digital (A3+)';
  }

  // 3. Biaya Cover (Bahan + Cetak + Plat + Desain)
  let biayaCover = 0;
  let kebutuhanPlanoCover = 0;
  let kebutuhanA3Cover = 0;

  if (metodeCover === 'Print Digital (A3+)') {
    // 1 Lembar A3+ muat 4 cover ukuran 10x15.5 cm
    const a3MuatCover = 4;
    kebutuhanA3Cover = Math.ceil(validOplah / a3MuatCover) + params.insheetCover;
    biayaCover = (kebutuhanA3Cover * params.tarifPrintCoverA3) + params.tarifDesainCover;
  } else {
    // 1 Plano 65x100 muat 16 cover (4 potong x 4 cover)
    const planoMuatCover = 16;
    kebutuhanPlanoCover = Math.ceil((validOplah / planoMuatCover) + (params.insheetCover / 4));
    // Berat 500 plano AC 230 (65x100) ≈ 74.75 kg -> 1 plano ≈ 0.1495 kg
    const beratPlanoKg = (65 * 100 * 230) / 10000000;
    const biayaKertasPlano = kebutuhanPlanoCover * beratPlanoKg * params.tarifAc230Kg;
    
    // Plat CTP 4 warna
    const jmlPlat = 4;
    const biayaPlat = jmlPlat * params.oliverPlatUnitCover;
    
    // Ongkos Cetak Oliver
    const lbrCetak = kebutuhanPlanoCover * 4; // 1 plano = 4 lembar mesin
    const ongkosDasar = params.oliverMinOngkosCover * jmlPlat;
    const cetakOver = Math.max(0, lbrCetak - 1000);
    const ongkosOver = cetakOver * params.oliverDrekOverCover * jmlPlat;
    const biayaCetak = ongkosDasar + ongkosOver;

    biayaCover = biayaKertasPlano + biayaPlat + biayaCetak + params.tarifDesainCover;
  }

  // 4. Biaya Blok Isi Kosongan
  let hargaIsiPerPcs = params.hargaIsiKosongan192;
  if (jumlahHalaman === 96) hargaIsiPerPcs = params.hargaIsiKosongan96;
  else if (jumlahHalaman === 128) hargaIsiPerPcs = params.hargaIsiKosongan128;
  else if (jumlahHalaman === 192) hargaIsiPerPcs = params.hargaIsiKosongan192;
  else if (jumlahHalaman === 208) hargaIsiPerPcs = params.hargaIsiKosongan208;

  const biayaIsi = hargaIsiPerPcs * validOplah;

  // 5. Biaya Laminasi / Varnish Cover
  let biayaLaminasi = 0;
  const luasCm2Cover = (widthCm * 2 + tebalPunggung + 2) * (heightCm + 1); // Bentangan cover terbuka
  if (laminasiCover === 'Glossy') {
    const rawLam = luasCm2Cover * params.tarifLaminasiGlossyCm2 * validOplah;
    biayaLaminasi = Math.max(params.minLaminasi, rawLam);
  } else if (laminasiCover === 'Doff') {
    const rawLam = luasCm2Cover * params.tarifLaminasiDoffCm2 * validOplah;
    biayaLaminasi = Math.max(params.minLaminasi, rawLam);
  } else if (laminasiCover === 'UV Varnish') {
    const rawLam = luasCm2Cover * params.tarifUvVarnishCm2 * validOplah;
    biayaLaminasi = Math.max(params.minLaminasi, rawLam);
  }

  // 6. Biaya Jilid & Finishing Sesuai Tipe
  let biayaJilid = 0;
  let biayaTali = 0;
  let biayaSisir = params.tarifSisir * validOplah;

  if (tipeJilid === 'Softcover (Bending/Lem Panas)') {
    const rawBending = params.tarifBendingPerCm2 * heightCm * tebalPunggung * validOplah;
    biayaJilid = Math.max(params.minBending, rawBending);
  } else if (tipeJilid === 'Staples Kawat') {
    biayaJilid = params.tarifStaplesPalu * validOplah + params.tarifCasingIn * validOplah;
  } else if (tipeJilid === 'Tali Cocard') {
    biayaJilid = params.tarifStaplesPalu * validOplah + params.tarifCasingIn * validOplah;
    const biayaBor = params.tarifLubangBor * validOplah;
    const biayaPasang = params.tarifPasangTali * validOplah;
    const biayaBahanTali = params.tarifTaliKurPerPcs * validOplah;
    biayaTali = biayaBor + biayaPasang + biayaBahanTali;
  } else if (tipeJilid === 'Spiral Kawat') {
    biayaJilid = params.tarifSpiralManasik * validOplah;
  }

  // 7. Biaya Kemasan & Packing
  let biayaOpp = 0;
  if (opsiPlastikOpp) {
    const hargaBahanOpp = (params.tarifPlastikOppPack / 100) * validOplah;
    const jasaOpp = params.jasaPlastikOpp * validOplah;
    biayaOpp = hargaBahanOpp + jasaOpp;
  }

  let biayaKardusLakban = 0;
  if (opsiKardus) {
    const jmlBox = Math.ceil(validOplah / params.kapasitasKardusManasik);
    biayaKardusLakban = jmlBox * (params.tarifKardusBox + params.tarifLakbanBox);
  }

  // Total HPP
  const totalHpp = Math.round(
    biayaCover +
    biayaIsi +
    biayaLaminasi +
    biayaJilid +
    biayaTali +
    biayaSisir +
    biayaOpp +
    biayaKardusLakban
  );

  const hppPerPcs = Math.round(totalHpp / validOplah);

  // Breakdown List
  const breakdown: ManasikBreakdownItem[] = [
    {
      nama: 'Cover Buku (Bahan + Cetak/POD + Plat + Desain)',
      nominal: Math.round(biayaCover),
      pct: totalHpp > 0 ? (biayaCover / totalHpp) * 100 : 0,
      keterangan: `${metodeCover}, AC 230 gsm, ${kebutuhanA3Cover > 0 ? kebutuhanA3Cover + ' Lbr A3+' : kebutuhanPlanoCover + ' Lbr Plano'}`,
    },
    {
      nama: `Blok Isi Manasik (${jumlahHalaman} Halaman Ready)`,
      nominal: Math.round(biayaIsi),
      pct: totalHpp > 0 ? (biayaIsi / totalHpp) * 100 : 0,
      keterangan: `@ Rp ${hargaIsiPerPcs.toLocaleString('id-ID')} x ${validOplah} eks`,
    },
  ];

  if (biayaLaminasi > 0) {
    breakdown.push({
      nama: `Laminasi Cover (${laminasiCover})`,
      nominal: Math.round(biayaLaminasi),
      pct: (biayaLaminasi / totalHpp) * 100,
      keterangan: `Finishing permukaan cover tahan air/gores`,
    });
  }

  if (biayaJilid > 0) {
    breakdown.push({
      nama: `Jilid (${tipeJilid})`,
      nominal: Math.round(biayaJilid),
      pct: (biayaJilid / totalHpp) * 100,
      keterangan: `Ongkos binding/staples perakitan buku`,
    });
  }

  if (biayaTali > 0) {
    breakdown.push({
      nama: 'Tali Cocard & Lubang Mata Ayam',
      nominal: Math.round(biayaTali),
      pct: (biayaTali / totalHpp) * 100,
      keterangan: 'Pita/Tali Kur leher + plong bor mata ayam',
    });
  }

  if (biayaSisir > 0) {
    breakdown.push({
      nama: 'Potong Sisir Sisi Buku',
      nominal: Math.round(biayaSisir),
      pct: (biayaSisir / totalHpp) * 100,
      keterangan: 'Perapihan 3 sisi buku',
    });
  }

  if (biayaOpp > 0) {
    breakdown.push({
      nama: 'Plastik OPP Satuan',
      nominal: Math.round(biayaOpp),
      pct: (biayaOpp / totalHpp) * 100,
      keterangan: 'Kemasan segel plastik per buku',
    });
  }

  if (biayaKardusLakban > 0) {
    breakdown.push({
      nama: 'Packing Kardus Master & Lakban',
      nominal: Math.round(biayaKardusLakban),
      pct: (biayaKardusLakban / totalHpp) * 100,
      keterangan: `${Math.ceil(validOplah / params.kapasitasKardusManasik)} box kardus pengiriman`,
    });
  }

  // Summary Profit & Nego
  const marginNominalPerPcs = Math.round((hppPerPcs * marginPct) / 100);
  const hargaJualPerPcs = hppPerPcs + marginNominalPerPcs;
  const totalHargaJual = hargaJualPerPcs * validOplah;
  const totalProfit = totalHargaJual - totalHpp;

  const diskonNominalPerPcs = Math.round((hargaJualPerPcs * Math.max(0, Math.min(100, negoDiskonPct))) / 100);
  const hargaNegoPerPcs = hargaJualPerPcs - diskonNominalPerPcs;
  const totalHargaNego = hargaNegoPerPcs * validOplah;
  const totalProfitNego = totalHargaNego - totalHpp;

  return {
    input,
    metodeCoverTerpilih: metodeCover,
    tebalPunggungCm: tebalPunggung,
    breakdown,
    kebutuhanPlanoCover,
    kebutuhanA3Cover,
    summary: {
      totalHpp,
      hppPerPcs,
      marginNominalPerPcs,
      totalHargaJual,
      hargaJualPerPcs,
      totalHargaNego,
      hargaNegoPerPcs,
      totalProfit,
      totalProfitNego,
    },
  };
}
