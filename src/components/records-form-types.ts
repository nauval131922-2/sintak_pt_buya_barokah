export interface Employee {
  id: number;
  employee_no: string | null;
  name: string;
  position: string;
}

export interface Order {
  id: string;
  faktur: string;
  nama_prd: string;
}

export interface ItemData {
  nama_barang: string;
  kd_barang: string;
  faktur: string;
  harga: number; // For Bahan Baku -> HPP Digit, For Penerimaan Barang Hasil Produksi -> hp
  harga_jual?: number; // Only For Penerimaan Barang Hasil Produksi -> Harga yg dr orders
}
