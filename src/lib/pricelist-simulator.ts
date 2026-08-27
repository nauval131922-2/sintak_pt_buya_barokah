// ponytail: simulator & kalkulator kalender dinding spiral 2027 logic

export interface SimulatorMasterParams {
  // 1. Kertas
  tarifHvs70: number;
  tarifAp120: number;
  tarifAp150: number;
  ppnMarginKertas: number; // legacy global PPN
  ppnHvs70: number; // 1.03
  ppnAp120: number; // 1.00
  ppnAp150: number; // 1.00

  // 2. Mesin Oliver
  oliverMinOngkos: number; // 90000
  oliverInsheet: number; // 100
  oliverPlatUnit: number; // 45000
  oliverDrekOver: number; // 40
  oliverTransport: number; // 100000
  oliverBatasDrek: number; // 1000

  // Mesin SM
  smMinOngkos: number; // 310000
  smInsheet: number; // 300
  smPlatUnit: number; // 78000
  smDrekOver: number; // 100
  smTransport: number; // 50000
  smBatasDrek: number; // 3000

  // 3. Jasa & Finishing
  tarifDesain: number;
  tarifAlmanakDesain: number;
  tarifRoyalty: number;
  tarifPotongDasar: number;
  tarifLakbanRoll: number;
  tarifSpiralLubang: number;
  tarifSpiralMin: number;
  // Tarif Klem Seng per pcs per ukuran
  klem32x48: number; // 350
  klem38x54: number; // 350
  klem46x64: number; // 480
  klem48x64: number; // 490
  colator32x48: number; // 40
  colator38x54: number; // 55
  colator46x64: number; // 70
  colator48x64: number; // 75

  // 4. Standar Plano & Konstanta
  potong32x48: number; // 4
  potong38x54: number; // 4
  potong46x64: number; // 2
  potong48x64: number; // 2
  konstantaBeratRim: number; // 20000
  lembarPerRim: number; // 500
  kapasitasLakbanRoll: number; // 133.33
}

export const DEFAULT_MASTER_PARAMS: SimulatorMasterParams = {
  // 1. Kertas
  tarifHvs70: 15700,
  tarifAp120: 17400,
  tarifAp150: 17400,
  ppnMarginKertas: 1.05,
  ppnHvs70: 1.05, // Default Spiral: global 5%
  ppnAp120: 1.05,
  ppnAp150: 1.05,

  // 2. Mesin Oliver
  oliverMinOngkos: 90000,
  oliverInsheet: 100,
  oliverPlatUnit: 45000,
  oliverDrekOver: 40,
  oliverTransport: 100000,
  oliverBatasDrek: 1000,

  // Mesin SM
  smMinOngkos: 310000,
  smInsheet: 300,
  smPlatUnit: 78000,
  smDrekOver: 100,
  smTransport: 50000,
  smBatasDrek: 3000,

  // 3. Jasa & Finishing
  tarifDesain: 30000,
  tarifAlmanakDesain: 30000,
  tarifRoyalty: 150,
  tarifPotongDasar: 2000,
  tarifLakbanRoll: 9600,
  tarifSpiralLubang: 150,
  tarifSpiralMin: 250000,
  klem32x48: 350,
  klem38x54: 350,
  klem46x64: 480,
  klem48x64: 490,
  colator32x48: 40,
  colator38x54: 55,
  colator46x64: 70,
  colator48x64: 75,

  // 4. Standar Plano & Konstanta
  potong32x48: 4,
  potong38x54: 4,
  potong46x64: 2,
  potong48x64: 2,
  konstantaBeratRim: 20000,
  lembarPerRim: 500,
  kapasitasLakbanRoll: 133.33,
};

export const DEFAULT_MASTER_PARAMS_KLEM: SimulatorMasterParams = {
  ...DEFAULT_MASTER_PARAMS,
  // Profil acuan file master Klem Agustus 2027 (Folder 30 Source/*.xlsm)
  tarifHvs70: 16500, // Sekarang memakai tarif dasar murni murni seperti di Excel (PPN diisi di parameter baru)
  ppnHvs70: 1.03, // PPN HVS 3%
  ppnAp120: 1.00, // PPN AP 0%
  ppnAp150: 1.00, // PPN AP 0%
  ppnMarginKertas: 1.0,
  oliverInsheet: 150,
  oliverTransport: 150000,
};

export interface SimulatorInput {
  modelKalender: string; // 'Eko Wulan (12 Lbr)' | 'Dwi Wulan (6 Lbr)' | 'Tri Wulan (4 Lbr)'
  bahan: string; // 'HVS 70' | 'Art Paper 120' | 'Art Paper 150'
  ukuran: string; // '32 x 48' | '38 x 54' | '46 x 64' | '48 x 64'
  finishingJilid?: 'Spiral' | 'Klem'; // default: 'Spiral'
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
    finishingJilid: 'Spiral' | 'Klem';
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
    tarifKlemUnit: number;
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
    finishingJilid = 'Spiral',
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
  let ppnMultiplier = params.ppnAp150 ?? 1.0;
  if (bahan.includes('HVS') || bahan.includes('70')) {
    tarifPerKg = params.tarifHvs70;
    gsm = 70;
    ppnMultiplier = params.ppnHvs70 ?? 1.0;
  } else if (bahan.includes('120')) {
    tarifPerKg = params.tarifAp120;
    gsm = 120;
    ppnMultiplier = params.ppnAp120 ?? 1.0;
  } else if (bahan.includes('150')) {
    tarifPerKg = params.tarifAp150;
    gsm = 150;
    ppnMultiplier = params.ppnAp150 ?? 1.0;
  }

  let planoLebar = 65;
  let planoPanjang = 100;
  if (ukuran === '38 x 54') {
    planoLebar = 79;
    planoPanjang = 109;
  }

  let planoPotong = params.potong32x48;
  if (ukuran === '38 x 54') planoPotong = params.potong38x54;
  else if (ukuran === '46 x 64') planoPotong = params.potong46x64;
  else if (ukuran === '48 x 64') planoPotong = params.potong48x64;

  let areaCetak = 2;
  if (mesin === 'Oliver') {
    areaCetak = ukuran === '32 x 48' ? 2 : 1;
  } else {
    areaCetak = ukuran === '32 x 48' ? 4 : 2;
  }

  const insheet = mesin === 'Oliver' ? params.oliverInsheet : params.smInsheet;
  const biayaPlatUnit = mesin === 'Oliver' ? params.oliverPlatUnit : params.smPlatUnit;
  const ongkosCetakDasar = mesin === 'Oliver' ? params.oliverMinOngkos : params.smMinOngkos;
  const tarifDrekOver = mesin === 'Oliver' ? params.oliverDrekOver : params.smDrekOver;
  const biayaTransport = mesin === 'Oliver' ? params.oliverTransport : params.smTransport;
  const batasDrekMin = mesin === 'Oliver' ? params.oliverBatasDrek : params.smBatasDrek;

  let ongkosColatorPerLbr = params.colator32x48;
  if (ukuran === '38 x 54') ongkosColatorPerLbr = params.colator38x54;
  else if (ukuran === '46 x 64') ongkosColatorPerLbr = params.colator46x64;
  else if (ukuran === '48 x 64') ongkosColatorPerLbr = params.colator48x64;

  let tarifKlemUnit = params.klem32x48;
  if (ukuran === '38 x 54') tarifKlemUnit = params.klem38x54;
  else if (ukuran === '46 x 64') tarifKlemUnit = params.klem46x64;
  else if (ukuran === '48 x 64') tarifKlemUnit = params.klem48x64;

  // 2. Kalkulasi Rincian Biaya
  const safeOplah = Math.max(1, oplah);

  // 1. Biaya Bahan Kertas
  const beratRimKg = (planoLebar * planoPanjang * gsm) / (params.konstantaBeratRim || 20000);
  const hargaPerPlano = (beratRimKg * (tarifPerKg * ppnMultiplier)) / (params.lembarPerRim || 500);
  const totalPlanoDibutuhkan = ((safeOplah + insheet) * lembar) / (planoPotong || 1);
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

  // 9. Jilid (Spiral Kawat vs Klem Seng)
  const isKlem = finishingJilid === 'Klem';
  const biayaSpiral = isKlem ? 0 : Math.max(params.tarifSpiralMin, lebarCm * params.tarifSpiralLubang * (safeOplah + 5));
  const biayaKlem = isKlem ? (safeOplah + 5) * tarifKlemUnit : 0;
  const biayaJilid = isKlem ? biayaKlem : biayaSpiral;

  // 10. Lakban & Packing
  const lakbanKapasitas = params.kapasitasLakbanRoll || 133.33;
  const biayaLakban = Math.max(
    params.tarifLakbanRoll,
    (safeOplah / 50 / lakbanKapasitas) * params.tarifLakbanRoll
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
    biayaJilid +
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
      name: 'Biaya Bahan Kertas (Isi)',
      amount: biayaKertas,
      formula: `[(L*P*GSM / 20.000 kg) * (Tarif/kg + PPN) / 500 lbr] * [(Oplah+Insheet)*Lbr / Potong]`,
    },
    {
      name: 'Biaya Plat Cetak (CTP)',
      amount: biayaPlat,
      formula: `Jumlah Plat (${jmlPlat} Plat) * Tarif Satuan (Rp ${biayaPlatUnit.toLocaleString('id-ID')})`,
    },
    {
      name: 'Ongkos Mesin Cetak (Isi)',
      amount: ongkosCetakMesin,
      formula: `(Jml Plat * Min Order) + (Drek Over * Tarif Over * Jml Plat)`,
    },
    {
      name: 'Desain Kalender',
      amount: biayaDesain,
      formula: `Tarif Desain (Rp ${params.tarifDesain.toLocaleString('id-ID')}) * ${lembar} Lembar`,
    },
    {
      name: 'Plat & Cetak Almanak',
      amount: biayaAlmanak,
      formula: `Desain Almanak + Plat Almanak + Cetak Almanak (+ Over drek jika ada)`,
    },
    {
      name: 'Royalty Kalender',
      amount: biayaRoyalty,
      formula: `Tarif Royalty (Rp ${params.tarifRoyalty.toLocaleString('id-ID')}) * ${safeOplah.toLocaleString('id-ID')} Pcs`,
    },
    {
      name: 'Finishing Potong Dasar',
      amount: biayaPotong,
      formula: `(Tarif Potong * Lembar) + (Tarif Potong * (Lembar / Plano Potong))`,
    },
    {
      name: 'Susun / Colator',
      amount: biayaColator,
      formula: `(${lembar} Lbr * Rp ${ongkosColatorPerLbr.toLocaleString('id-ID')}) * (${safeOplah.toLocaleString('id-ID')} + ${insheet / 2})`,
    },
    {
      name: isKlem ? 'Finishing Klem Seng (Jepit)' : 'Spiral Kawat (Jilid)',
      amount: biayaJilid,
      formula: isKlem
        ? `(${safeOplah.toLocaleString('id-ID')} + 5 pcs) * Rp ${tarifKlemUnit.toLocaleString('id-ID')}/pcs`
        : `MAX(Min Rp ${params.tarifSpiralMin.toLocaleString('id-ID')}, (${lebarCm} cm * Rp ${params.tarifSpiralLubang}) * (${safeOplah.toLocaleString('id-ID')} + 5))`,
    },
    {
      name: 'Lakban & Packing',
      amount: biayaLakban,
      formula: `MAX(Min 1 Roll Rp ${params.tarifLakbanRoll.toLocaleString('id-ID')}, ((${safeOplah.toLocaleString('id-ID')} / 50 pack) / 133.3) * Rp ${params.tarifLakbanRoll.toLocaleString('id-ID')})`,
    },
    {
      name: 'Biaya Transportasi',
      amount: biayaKirim,
      formula: `Biaya Transportasi Mesin ${mesin} (Rp ${biayaTransport.toLocaleString('id-ID')})`,
    },
  ];

  return {
    calculatedParams: {
      lembar,
      lebarCm,
      tinggiCm,
      finishingJilid,
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
      tarifKlemUnit,
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
