import os
import sys
import subprocess
import json

# Pastikan openpyxl terinstall
try:
    import openpyxl
except ImportError:
    print("[ERROR] openpyxl tidak ditemukan. Harap install dengan: pip install openpyxl")
    sys.exit(1)

EXCEL_FILES = {
    "manasik_kosongan": r"H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0202_KALKULASI HARGA\020201 MASTER HARGA\02020107 BUKU, KITAB, MAJALAH\02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Kosongan.xlsm",
    "manasik_custom": r"H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0202_KALKULASI HARGA\020201 MASTER HARGA\02020107 BUKU, KITAB, MAJALAH\02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Custom Cover 2026.xlsm",
    "yasin_hc": r"H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0203_SURAT PENAWARAN HARGA (SPH) out\020326 2026 SURAT PENAWARAN HARGA (SPH) out\Pricelist Juli 2026\02. Pricelist Surat Yasin\01. Pricelist Surat Yasin 2026\Surat Yasin Hardcover 175 Eks.xlsm",
    "nota": r"H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0203_SURAT PENAWARAN HARGA (SPH) out\020326 2026 SURAT PENAWARAN HARGA (SPH) out\Pricelist Juli 2026\03. Pricelist Nota 1 Warna\PENDUKUNG\02020102 NOTA 2 PLY FOLIO 2 WARNA.xlsx",
    "brosur": r"H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0203_SURAT PENAWARAN HARGA (SPH) out\020326 2026 SURAT PENAWARAN HARGA (SPH) out\Pricelist Juli 2026\04. Pricelist Brosur 2026\Source\Pricelist Brosur Juni 2026 10,5 x 21 2 muka oliver.xlsm",
    "label_khq": r"H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0203_SURAT PENAWARAN HARGA (SPH) out\020326 2026 SURAT PENAWARAN HARGA (SPH) out\Pricelist Juli 2026\05. Pricelist Label KHQ\Source\Label KHQ 330 ml 167 - 184 kardus.xlsm",
}

def extract_benchmarks():
    data = {}
    
    # 1. Manasik Kosongan
    p_mk = EXCEL_FILES["manasik_kosongan"]
    if os.path.exists(p_mk):
        wb = openpyxl.load_workbook(p_mk, data_only=True, read_only=True)
        ws = wb['BUKU']
        rows = list(ws.iter_rows(values_only=True))
        wb.close()
        
        bench = []
        for r_idx in [6, 7, 8, 10, 11, 12, 13]: # Baris 7, 8, 9, 11, 12, 13, 14
            row = rows[r_idx]
            oplah = row[7] # Col H
            tot_hpp = row[131] # Col EB
            hpp_exp = row[132] # Col EC
            harga_exp = row[137] # Col EH
            if oplah and tot_hpp:
                bench.append({
                    "oplah": int(oplah),
                    "total_hpp": round(tot_hpp),
                    "hpp_pcs": round(hpp_exp),
                    "harga_jual": round(harga_exp)
                })
        data["manasik_kosongan"] = bench
        
    # 2. Manasik Custom Cover 500 eks
    p_mc = EXCEL_FILES["manasik_custom"]
    if os.path.exists(p_mc):
        wb = openpyxl.load_workbook(p_mc, data_only=True, read_only=True)
        ws = wb['BUKU']
        rows = list(ws.iter_rows(values_only=True))
        wb.close()
        # Row 19 (oplah 500):
        # Col 8 (oplah=500), Col 131 (EB=tot_hpp), Col 132 (EC=hpp_pcs), Col 134 (DE=harga_jual)
        row19 = rows[18]
        data["manasik_custom"] = {
            "oplah": 500,
            "total_hpp": round(row19[131]),
            "hpp_pcs": round(row19[132]),
            "harga_jual": 8350 # Sheet BUKU cell DE19
        }

    # 3. Label KHQ 167 Dus
    p_khq = EXCEL_FILES["label_khq"]
    if os.path.exists(p_khq):
        wb = openpyxl.load_workbook(p_khq, data_only=True, read_only=True)
        ws = wb['BUKU']
        rows = list(ws.iter_rows(values_only=True))
        wb.close()
        row7 = rows[6]
        data["label_khq"] = {
            "varian": "KHQ 330 ml",
            "kardus": 167,
            "lbr": 4008,
            "total_hpp": round(row7[55]), # Col BD
            "hpp_lbr": round(row7[56], 2), # Col BE
            "harga_jual": round(row7[61]) # Col BJ
        }
        
    return data

if __name__ == "__main__":
    extracted = extract_benchmarks()
    # Output sebagai JSON ke stdout untuk dikonsumsi harness TypeScript
    print(json.dumps(extracted))
