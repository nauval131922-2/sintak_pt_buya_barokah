// ponytail: simulator & kalkulator kalender dinding spiral 2027 logic

export interface SimulatorMasterParams {
  tarifHvs70: number;
  tarifAp120: number;
  tarifAp150: number;
  tarifDesain: number;
  tarifAlmanakDesain: number;
  tarifRoyalty: number;
  tarifPotongDasar: number;
  tarifLakbanRoll: number;
  tarifSpiralLubang: number;
  tarifSpiralMin: number;
}

export const DEFAULT_MASTER_PARAMS: SimulatorMasterParams = {
  tarifHvs70: 15700,
  tarifAp120: 17400,
  tarifAp150: 17400,
  tarifDesain: 30000,
  tarifAlmanakDesain: 30000,
  tarifRoyalty: 150,
  tarifPotongDasar: 2000,
  tarifLakbanRoll: 9600,
  tarifSpiralLubang: 150,
  tarifSpiralMin: 250000,
};

export interface SimulatorInput {
  modelKalender: string; // 'Eko Wulan (12 Lbr)' | 'Dwi Wulan (6 Lbr)' | 'Tri Wulan (4 Lbr)'
  bahan: string; // 'HVS 70' | 'Art Paper 120' | 'Art Paper 150'
  ukuran: string; // '32 x 48' | '38 x 54' | '46 x 64' | '48 x 64'
  oplah: number;
  pilihanMesin: 'Otomatis' | 'Oliver' | 'SM';
  marginPct: number; // e.g. 0.30
  negoDiskonPct: number; // e.g. 0.04
  customParams?: Partial<SimulatorMasterParams>;
}

export interface SimulatorBreakdownItem {
  name: string;
  amount: number;
  formula: string;
}

export interface SimulatorOutput {
  calculatedParams: {
    lembar: number;
    lebarCm: number;
    tinggiCm: number;
    mesinDigunakan: 'Oliver' | 'SM';
    tarifPerKg: number;
    gsm: number;
    planoUkuran: string;
    planoPotong: number;
    areaCetak: number;
    insheet: number;
    biayaPlatUnit: number;
    ongkosCetakDasar: number;
    tarifDrekOver: number;
    biayaTransport: number;
    ongkosColatorPerLbr: number;
  };
  breakdown: SimulatorBreakdownItem[];
  summary: {
    totalBiayaProduksi: number;
    hppPerPcs: number;
    hargaJualPerPcs: number;
    hargaNegoPerPcs: number;
    totalOmset: number;
    estimasiProfit: number;
    estimasiProfitNego: number;
    marginPct: number;
    negoDiskonPct: number;
  };
}

export function calculatePricelistSimulator(input: SimulatorInput): SimulatorOutput {
  const {
    modelKalender,
    bahan,
    ukuran,
    oplah,
    pilihanMesin,
    marginPct,
    negoDiskonPct,
    customParams = {},
  } = input;

  const params: SimulatorMasterParams = { ...DEFAULT_MASTER_PARAMS, ...customParams };

  // 1. Parameter terhitung
  let lembar = 12;
  if (modelKalender.includes('Dwi')) lembar = 6;
  else if (modelKalender.includes('Tri')) lembar = 4;

  const [lebarCmStr, tinggiCmStr] = ukuran.split('x').map((s) => s.trim());
  const lebarCm = parseFloat(lebarCmStr) || 32;
  const tinggiCm = parseFloat(tinggiCmStr) || 48;

  let mesin: 'Oliver' | 'SM' = 'Oliver';
  if (pilihanMesin === 'Oliver' || pilihanMesin === 'SM') {
    mesin = pilihanMesin;
  } else {
    mesin = oplah < 3000 ? 'Oliver' : 'SM';
  }

  let tarifPerKg = params.tarifAp150;
  let gsm = 150;
  if (bahan.includes('HVS') || bahan.includes('70')) {
    tarifPerKg = params.tarifHvs70;
    gsm = 70;
  } else if (bahan.includes('120')) {
    tarifPerKg = params.tarifAp120;
    gsm = 120;
  } else if (bahan.includes('150')) {
    tarifPerKg = params.tarifAp150;
    gsm = 150;
  }

  let planoLebar = 65;
  let planoPanjang = 100;
  if (ukuran === '38 x 54') {
    planoLebar = 79;
    planoPanjang = 109;
  }

  const planoPotong = ukuran === '32 x 48' || ukuran === '38 x 54' ? 4 : 2;

  let areaCetak = 2;
  if (mesin === 'Oliver') {
    areaCetak = ukuran === '32 x 48' ? 2 : 1;
  } else {
    areaCetak = ukuran === '32 x 48' ? 4 : 2;
  }

  const insheet = mesin === 'Oliver' ? 100 : 300;
  const biayaPlatUnit = mesin === 'Oliver' ? 45000 : 78000;
  const ongkosCetakDasar = mesin === 'Oliver' ? 90000 : 310000;
  const tarifDrekOver = mesin === 'Oliver' ? 40 : 100;
  const biayaTransport = mesin === 'Oliver' ? 100000 : 50000;
  const batasDrekMin = mesin === 'Oliver' ? 1000 : 3000;

  let ongkosColatorPerLbr = 40;
  if (ukuran === '38 x 54') ongkosColatorPerLbr = 55;
  else if (ukuran === '46 x 64') ongkosColatorPerLbr = 70;
  else if (ukuran === '48 x 64') ongkosColatorPerLbr = 75;

  // 2. Kalkulasi Rincian Biaya
  const safeOplah = Math.max(1, oplah);

  // 1. Biaya Bahan Kertas
  const beratRimKg = (planoLebar * planoPanjang * gsm) / 20000;
  const hargaPerPlano = (beratRimKg * (tarifPerKg * 1.05)) / 500;
  const totalPlanoDibutuhkan = ((safeOplah + insheet) * lembar) / planoPotong;
  const biayaKertas = hargaPerPlano * totalPlanoDibutuhkan;

  // 2. Biaya Plat CTP
  const jmlPlat = Math.ceil(lembar / areaCetak) * 4;
  const biayaPlat = jmlPlat * biayaPlatUnit;

  // 3. Ongkos Mesin Cetak
  const drekOver = Math.max(0, safeOplah + insheet - batasDrekMin);
  const ongkosCetakMesin = jmlPlat * ongkosCetakDasar + drekOver * tarifDrekOver * jmlPlat;

  // 4. Desain Kalender
  const biayaDesain = params.tarifDesain * lembar;

  // 5. Plat & Cetak Almanak
  const biayaAlmanak = params.tarifAlmanakDesain + biayaPlatUnit + ongkosCetakDasar + drekOver * tarifDrekOver;

  // 6. Royalty Kalender
  const biayaRoyalty = params.tarifRoyalty * safeOplah;

  // 7. Finishing Potong Dasar
  const biayaPotong =
    params.tarifPotongDasar * lembar +
    params.tarifPotongDasar * (lembar / (ukuran === '32 x 48' ? 4 : 2));

  // 8. Susun / Colator
  const biayaColator = lembar * ongkosColatorPerLbr * (safeOplah + insheet / 2);

  // 9. Spiral Kawat
  const biayaSpiral = Math.max(params.tarifSpiralMin, lebarCm * params.tarifSpiralLubang * (safeOplah + 5));

  // 10. Lakban & Packing
  const biayaLakban = Math.max(
    params.tarifLakbanRoll,
    (safeOplah / 50 / (8000 / 60)) * params.tarifLakbanRoll
  );

  // 11. Biaya Transportasi
  const biayaKirim = biayaTransport;

  const totalBiayaProduksi =
    biayaKertas +
    biayaPlat +
    ongkosCetakMesin +
    biayaDesain +
    biayaAlmanak +
    biayaRoyalty +
    biayaPotong +
    biayaColator +
    biayaSpiral +
    biayaLakban +
    biayaKirim;

  const hppPerPcs = totalBiayaProduksi / safeOplah;
  const hargaJualPerPcs = Math.ceil((hppPerPcs * (1 + marginPct)) / 100) * 100;
  const hargaNegoPerPcs = Math.ceil((hargaJualPerPcs * (1 - negoDiskonPct)) / 100) * 100;

  const totalOmset = hargaJualPerPcs * safeOplah;
  const estimasiProfit = (hargaJualPerPcs - hppPerPcs) * safeOplah;
  const estimasiProfitNego = (hargaNegoPerPcs - hppPerPcs) * safeOplah;

  const breakdown: SimulatorBreakdownItem[] = [
    {
      name: '1. Biaya Bahan Kertas (Isi)',
      amount: biayaKertas,
      formula: `[(L*P*GSM / 20.000 kg) * (Tarif/kg + 5% PPN) / 500 lbr] * [(Oplah+Insheet)*Lbr / Potong]`,
    },
    {
      name: '2. Biaya Plat Cetak (CTP)',
      amount: biayaPlat,
      formula: `Jumlah Plat (${jmlPlat} Plat) * Tarif Satuan (Rp ${biayaPlatUnit.toLocaleString('id-ID')})`,
    },
    {
      name: '3. Ongkos Mesin Cetak (Isi)',
      amount: ongkosCetakMesin,
      formula: `(Jml Plat * Min Order) + (Drek Over * Tarif Over * Jml Plat)`,
    },
    {
      name: '4. Desain Kalender',
      amount: biayaDesain,
      formula: `Tarif Desain (Rp ${params.tarifDesain.toLocaleString('id-ID')}) * ${lembar} Lembar`,
    },
    {
      name: '5. Plat & Cetak Almanak',
      amount: biayaAlmanak,
      formula: `Desain Almanak + Plat Almanak + Cetak Almanak (+ Over drek jika ada)`,
    },
    {
      name: '6. Royalty Kalender',
      amount: biayaRoyalty,
      formula: `Tarif Royalty (Rp ${params.tarifRoyalty.toLocaleString('id-ID')}) * ${safeOplah.toLocaleString('id-ID')} Pcs`,
    },
    {
      name: '7. Finishing Potong Dasar',
      amount: biayaPotong,
      formula: `(Tarif Potong * Lembar) + (Tarif Potong * (Lembar / Plano Potong))`,
    },
    {
      name: '8. Susun / Colator',
      amount: biayaColator,
      formula: `(${lembar} Lbr * Rp ${ongkosColatorPerLbr.toLocaleString('id-ID')}) * (${safeOplah.toLocaleString('id-ID')} + ${insheet / 2})`,
    },
    {
      name: '9. Spiral Kawat (Jilid)',
      amount: biayaSpiral,
      formula: `MAX(Min Rp ${params.tarifSpiralMin.toLocaleString('id-ID')}, (${lebarCm} cm * Rp ${params.tarifSpiralLubang}) * (${safeOplah.toLocaleString('id-ID')} + 5))`,
    },
    {
      name: '10. Lakban & Packing',
      amount: biayaLakban,
      formula: `MAX(Min 1 Roll Rp ${params.tarifLakbanRoll.toLocaleString('id-ID')}, ((${safeOplah.toLocaleString('id-ID')} / 50 pack) / 133.3) * Rp ${params.tarifLakbanRoll.toLocaleString('id-ID')})`,
    },
    {
      name: '11. Biaya Transportasi',
      amount: biayaKirim,
      formula: `Biaya Transportasi Mesin ${mesin} (Rp ${biayaTransport.toLocaleString('id-ID')})`,
    },
  ];

  return {
    calculatedParams: {
      lembar,
      lebarCm,
      tinggiCm,
      mesinDigunakan: mesin,
      tarifPerKg,
      gsm,
      planoUkuran: `${planoLebar} x ${planoPanjang}`,
      planoPotong,
      areaCetak,
      insheet,
      biayaPlatUnit,
      ongkosCetakDasar,
      tarifDrekOver,
      biayaTransport,
      ongkosColatorPerLbr,
    },
    breakdown,
    summary: {
      totalBiayaProduksi,
      hppPerPcs,
      hargaJualPerPcs,
      hargaNegoPerPcs,
      totalOmset,
      estimasiProfit,
      estimasiProfitNego,
      marginPct,
      negoDiskonPct,
    },
  };
}
