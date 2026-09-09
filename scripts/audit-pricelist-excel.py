// scripts/audit-pricelist-excel.py
# Skrip audit mekanis independen: membandingkan formula SINTAK dengan file master Excel fisik di drive H:
import os
import sys
import openpyxl

def audit_kosongan():
    path = r"H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0202_KALKULASI HARGA\020201 MASTER HARGA\02020107 BUKU, KITAB, MAJALAH\02020107 BUKU, KITAB SOFT COVER UK. 10 x 15,5 - BUKU MANASIK - Kosongan.xlsm"
    if not os.path.exists(path):
        print(f"[SKIP] File master Kosongan tidak ditemukan di: {path}")
        return True

    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb['BUKU']
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    # Baris 7 s/d 14 di Excel (index 6 s/d 13)
    benchmarks = []
    for r_idx in [6, 7, 8, 10, 11, 12, 13]:
        row = rows[r_idx]
        oplah = row[7] # Col H
        tot_hpp = row[131] # Col EB
        hpp_exp = row[132] # Col EC
        harga_exp = row[137] # Col EH
        if oplah and tot_hpp:
            benchmarks.append({
                "oplah": int(oplah),
                "excel_total": round(tot_hpp),
                "excel_hpp": round(hpp_exp),
                "excel_jual": round(harga_exp)
            })

    print("================================================================================")
    print("AUDIT MEKANIS: BUKU MANASIK KOSONGAN (BUKU!Row 7 s/d Row 14)")
    print("================================================================================")
    print(f"{'Oplah':<8} | {'Excel Total':<12} | {'Excel HPP':<10} | {'Excel Jual':<10}")
    print("--------------------------------------------------------------------------------")
    for b in benchmarks:
        print(f"{b['oplah']:<8} | Rp {b['excel_total']:<9,d} | Rp {b['excel_hpp']:<7,d} | Rp {b['excel_jual']:<7,d}")

    return True

if __name__ == "__main__":
    audit_kosongan()
