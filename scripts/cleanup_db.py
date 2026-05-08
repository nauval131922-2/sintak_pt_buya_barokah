import sqlite3
import os
import time

db_path = r"D:\repo github\sintak_pt_buya_barokah\database_dev.sqlite"

def cleanup():
    if not os.path.exists(db_path):
        print(f"File tidak ditemukan: {db_path}")
        return

    start_size = os.path.getsize(db_path) / (1024 * 1024 * 1024)
    print(f"--- Memulai Pembersihan Database ---")
    print(f"Ukuran awal: {start_size:.2f} GB")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 1. Hapus log lama (sisakan hanya 3 hari terakhir)
        print("1. Menghapus log aktivitas yang lebih tua dari 3 hari...")
        cursor.execute("DELETE FROM activity_logs WHERE created_at < date('now', '-3 days')")
        deleted_logs = cursor.rowcount
        print(f"   Berhasil menghapus {deleted_logs:,} baris log.")

        # 2. Opsional: Kosongkan tabel FTS content jika memang ingin lebih bersih 
        # (FTS akan otomatis terisi kembali saat data diakses/diupdate)
        # Namun untuk sekarang kita fokus ke activity_logs saja.

        conn.commit()

        # 3. VACUUM (Ini yang akan mengecilkan ukuran file)
        print("2. Menjalankan VACUUM (Mengatur ulang ruang penyimpanan)...")
        print("   Mohon tunggu, proses ini memakan waktu beberapa menit untuk file 8GB...")
        
        start_vacuum = time.now() if hasattr(time, 'now') else time.time()
        conn.execute("VACUUM")
        end_vacuum = time.now() if hasattr(time, 'now') else time.time()
        
        print(f"   VACUUM selesai dalam {int(end_vacuum - start_vacuum)} detik.")

        conn.close()

        end_size = os.path.getsize(db_path) / (1024 * 1024 * 1024)
        print(f"\n--- Pembersihan Selesai ---")
        print(f"Ukuran Akhir: {end_size:.2f} GB")
        print(f"Ruang yang dihemat: {(start_size - end_size) * 1024:.2f} MB")

    except sqlite3.Error as e:
        print(f"Terjadi kesalahan database: {e}")
    except Exception as e:
        print(f"Terjadi kesalahan: {e}")

if __name__ == "__main__":
    cleanup()
