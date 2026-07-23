'use client';

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Pencil, Trash2, Calendar, FileText, Printer, RefreshCw, FileSpreadsheet, Clock, ClipboardList, Loader2 } from 'lucide-react';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';

import ConfirmDialog, { DialogType } from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useInfractionsData, useInfractionsFilter } from './hooks';
import type { Infraction } from './types';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatDateToYYYYMMDD, formatIndoDateStr, parseLocalDate } from '@/lib/utils/date-formatters';
import { DataTable } from '@/components/ui/DataTable';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 50;

interface InfractionsTableProps {
  infractions: Infraction[];
  onEdit?: (inf: Infraction) => void;
  onPeriodChange?: (start: string, end: string) => void;
  onRefresh?: (period?: { start: string; end: string }) => Promise<void>;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function InfractionsTable({
  infractions,
  onEdit,
  onPeriodChange,
  onRefresh,
  initialStartDate,
  initialEndDate,
}: InfractionsTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // === HOOKS ===
  const {
    infractions: data,
    isRefreshing,
    visibleCount,
    setVisibleCount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchFilteredData,
    loadTime,
  } = useInfractionsData({
    initial: infractions,
    initialStartDate: initialStartDate ? parseLocalDate(initialStartDate) : undefined,
    initialEndDate: initialEndDate ? parseLocalDate(initialEndDate) : undefined,
    onPeriodChange,
  });

  const {
    query,
    setQuery,
    sortConfig,
    toggleSort: toggleSortFromHook,
    filtered,
  } = useInfractionsFilter({ infractions: data });

  const {
    selectedIds,
    setSelectedIds,
    handleRowClick,
    clearSelection,
  } = useTableSelection(filtered);

  // Pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedData = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Reset ke halaman 1 saat filter/query/data berubah
  useEffect(() => { setPage(1); }, [query, data]);

  // Column Widths for DataTable
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('infraction_columnWidths');
        if (saved) return JSON.parse(saved);
    }
    return {
        action: 140,
        faktur: 110,
        date: 140,
        employee_name: 200,
        description: 250,
        item: 220,
        order_name_display: 220,
        jumlah: 80,
        harga: 130,
        total: 140
    };
  });

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('infraction_columnWidths', JSON.stringify(widths));
  }, []);

  const isStaleRef = useRef(false);

  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        fetchFilteredData();
        router.refresh();
        isStaleRef.current = false;
      } else {
        isStaleRef.current = true;
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        handleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isStaleRef.current) {
        handleRefresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('sintak:data-updated', handleRefresh);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sintak:data-updated', handleRefresh);
    };
  }, [fetchFilteredData, router]);

  // Delete handlers
  const [isExporting, setIsExporting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const executeDelete = async () => {
    if (confirmDeleteId === null) return;
    const id = confirmDeleteId;
    
    setIsDeletingConfirm(true);
    try {
      const res = await fetch(`/api/infractions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.dispatchEvent(new Event('sintak:data-updated'));
        fetchFilteredData();
        startTransition(() => {
          router.refresh();
        });
        setConfirmDeleteId(null);
        setDialogConfig({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Data kesalahan berhasil dihapus secara permanen.'
        });
      } else {
        const err = await res.json();
        setConfirmDeleteId(null);
        setDialogConfig({
          isOpen: true,
          type: 'error',
          title: 'Gagal',
          message: 'Gagal menghapus data: ' + (err.error || 'Unknown error')
        });
      }
    } catch (err) {
      setConfirmDeleteId(null);
      setDialogConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan jaringan atau server.'
      });
    } finally {
      setIsDeletingConfirm(false);
    }
  };

  const closeConfirm = () => {
    setConfirmDeleteId(null);
    setIsDeletingConfirm(false);
  };

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setVisibleCount(PAGE_SIZE);
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const now = new Date();
    const printedOnStr = formatIndoDateStr(formatDateToYYYYMMDD(now));
    const printedTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const periodStr = `${formatIndoDateStr(formatDateToYYYYMMDD(startDate))} s/d ${formatIndoDateStr(formatDateToYYYYMMDD(endDate))}`;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PT. Buya Barokah', 15, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Div. Percetakan', 15, 24);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, 28, 282, 28);

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAP PENCATATAN KESALAHAN KARYAWAN', 148.5, 37, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${periodStr}`, 148.5, 43, { align: 'center' });

    // Table
    const tableData = filtered.map((inf, idx) => [
      idx + 1,
      inf.faktur || '-',
      formatIndoDateStr(inf.date),
      inf.employee_name || '-',
      inf.employee_position || '-',
      inf.description || '-',
      inf.nama_barang_display || inf.nama_barang || '-',
      inf.jenis_barang || '-',
      inf.order_name_display || inf.order_name || '-',
      inf.jumlah ?? 0,
      inf.harga ? `Rp ${inf.harga.toLocaleString('id-ID')}` : '-',
      inf.total ? `Rp ${inf.total.toLocaleString('id-ID')}` : '-',
    ]);

    autoTable(doc, {
      startY: 48,
      head: [['#', 'Faktur', 'Tanggal', 'Karyawan', 'Posisi', 'Deskripsi', 'Nama Barang', 'Kategori', 'No. Order', 'Qty', 'Harga', 'Total Beban']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 80, 50], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 18 },
        2: { cellWidth: 20 },
        3: { cellWidth: 26 },
        4: { cellWidth: 20 },
        5: { cellWidth: 40, overflow: 'linebreak' },
        6: { cellWidth: 30, overflow: 'linebreak' },
        7: { cellWidth: 20 },
        8: { cellWidth: 30, overflow: 'linebreak' },
        9: { cellWidth: 10, halign: 'right' },
        10: { cellWidth: 23, halign: 'right' },
        11: { cellWidth: 23, halign: 'right' },
      },
      margin: { left: 15, right: 15 },
    });

    // Row total beban
    const grandTotal = filtered.reduce((sum, inf) => sum + (inf.total || 0), 0);
    const afterTableY = (doc as any).lastAutoTable.finalY;
    autoTable(doc, {
      startY: afterTableY,
      head: [],
      body: [['', '', '', '', '', '', '', '', 'TOTAL BEBAN', '', '', `Rp ${grandTotal.toLocaleString('id-ID')}`]],
      theme: 'plain',
      bodyStyles: { fontSize: 7.5, fontStyle: 'bold', textColor: [30, 80, 50] },
      columnStyles: {
        0: { cellWidth: 7 },
        1: { cellWidth: 18 },
        2: { cellWidth: 20 },
        3: { cellWidth: 26 },
        4: { cellWidth: 20 },
        5: { cellWidth: 40 },
        6: { cellWidth: 30 },
        7: { cellWidth: 20 },
        8: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 10 },
        10: { cellWidth: 23 },
        11: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 15, right: 15 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Dicetak: ${printedOnStr}, ${printedTimeStr}  |  Hal ${i} dari ${pageCount}`, 15, doc.internal.pageSize.height - 8);
    }

    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  };

  const generateExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const startStr = formatDateToYYYYMMDD(startDate);
      const endStr   = formatDateToYYYYMMDD(endDate);
      const params = new URLSearchParams({
        startDate: startStr,
        endDate:   endStr,
      });
      const res = await fetch(`/api/export-infractions?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rekap-kesalahan_${startStr}_sd_${endStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error('Gagal export Excel: ' + (err.error || res.statusText));
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat export Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateSinglePDF = useCallback((inf: Infraction) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const docDate = formatIndoDateStr(inf.date);
    const now = new Date();
    const printedOnStr = formatIndoDateStr(formatDateToYYYYMMDD(now));
    const printedTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    // --- HEADER ---
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // black
    doc.setFont('helvetica', 'bold');
    doc.text('PT. Buya Barokah', 15, 18);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // black
    doc.setFont('helvetica', 'normal');
    doc.text('Div. Percetakan', 15, 24);
    
    doc.setDrawColor(0, 0, 0); // black
    doc.setLineWidth(0.5);
    doc.line(15, 28, 195, 28);

    // --- TITLE ---
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // black
    doc.setFont('helvetica', 'bold');
    doc.text('FORMULIR DETAIL KESALAHAN KARYAWAN', 105, 38, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // black
    doc.text(`No. Referensi: ${inf.faktur || '-'}`, 105, 44, { align: 'center' });

    // --- DATA KARYAWAN & WAKTU ---
    const startY = 55;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Tabel untuk data karyawan
    const employeeTableData = [
      ['Nama Karyawan', ':', inf.employee_name || '-'],
      ['Tanggal Kejadian', ':', docDate],
      ['Posisi / Bagian', ':', inf.employee_position || '-']
    ];

    autoTable(doc, {
      startY: startY,
      head: [],
      body: employeeTableData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold', halign: 'left', textColor: [0, 0, 0], cellPadding: { left: 0, right: 2, top: 2, bottom: 2 } },
        1: { cellWidth: 5, halign: 'center', textColor: [0, 0, 0] },
        2: { cellWidth: 140, halign: 'left', textColor: [0, 0, 0] }
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'top',
        lineColor: [255, 255, 255],
        lineWidth: 0
      },
      margin: { left: 15, right: 15 }
    });

    // --- RINCIAN PRODUKSI ---
    const detailY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // black
    doc.text('A. RINCIAN PRODUKSI & BARANG', 15, detailY);
    doc.setDrawColor(0, 0, 0); // black
    doc.setLineWidth(0.2);
    doc.line(15, detailY + 2, 195, detailY + 2);

    // Tabel untuk rincian produksi
    const detailTableData = [
      ['No. Order / SPK', ':', inf.order_name_display || inf.order_name || '-'],
      ['Nama Barang', ':', inf.nama_barang_display || inf.nama_barang || '-'],
      ['Kategori', ':', inf.jenis_barang || '-']
    ];

    autoTable(doc, {
      startY: detailY + 4,
      head: [],
      body: detailTableData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold', halign: 'left', textColor: [0, 0, 0] },
        1: { cellWidth: 5, halign: 'center', textColor: [0, 0, 0] },
        2: { cellWidth: 140, halign: 'left', textColor: [0, 0, 0], overflow: 'linebreak' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'top',
        lineColor: [255, 255, 255],
        lineWidth: 0
      },
      margin: { left: 15, right: 15 }
    });

    const orderExtraHeight = (doc as any).lastAutoTable.finalY - (detailY + 8);

    // --- DESKRIPSI KEJADIAN ---
    const descY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // black
    doc.text('B. DESKRIPSI KESALAHAN', 15, descY);
    doc.line(15, descY + 2, 195, descY + 2);

    // Tabel untuk deskripsi (1 kolom saja)
    const descTableData = [
      [inf.description || 'Tidak ada deskripsi rinci.']
    ];

    autoTable(doc, {
      startY: descY + 4,
      head: [],
      body: descTableData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 180, halign: 'left', textColor: [0, 0, 0], overflow: 'linebreak' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'top',
        lineColor: [255, 255, 255],
        lineWidth: 0
      },
      margin: { left: 15, right: 15 }
    });

    const descHeight = 0; // Not needed anymore since we use autoTable

    // --- DAMPAK FINANCIAL ---
    const finY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // black
    doc.text('C. DAMPAK BIAYA (BEBAN)', 15, finY);
    doc.line(15, finY + 2, 195, finY + 2);

    const totalStr = inf.total ? `Rp ${inf.total.toLocaleString('id-ID')}` : '-';
    const qtyStr = inf.jumlah ? `${inf.jumlah}` : '-';
    const hargaStr = inf.harga ? `Rp ${inf.harga.toLocaleString('id-ID')}` : '-';

    // Tabel untuk dampak biaya
    const financeTableData = [
      ['Kuantitas (Qty)', ':', qtyStr],
      ['Harga Satuan', ':', hargaStr],
      ['Total Beban', ':', totalStr]
    ];

    autoTable(doc, {
      startY: finY + 4,
      head: [],
      body: financeTableData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold', halign: 'left', textColor: [0, 0, 0] },
        1: { cellWidth: 5, halign: 'center', textColor: [0, 0, 0] },
        2: { cellWidth: 140, halign: 'left', textColor: [0, 0, 0] }
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'top',
        lineColor: [255, 255, 255],
        lineWidth: 0
      },
      margin: { left: 15, right: 15 }
    });

    // --- SIGNATURES ---
    const sigY = (doc as any).lastAutoTable.finalY + 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // black
    
    // Kiri: center di antara 15 dan 105 (60mm), Kanan: center di antara 105 dan 195 (150mm)
    doc.text('Mengetahui / Pencatat,', 60, sigY, { align: 'center' });
    doc.text('( _________________________ )', 60, sigY + 20, { align: 'center' });
    doc.text(inf.recorded_by_name || inf.recorded_by || 'Admin', 60, sigY + 25, { align: 'center' });

    doc.text('Karyawan Ybs,', 150, sigY, { align: 'center' });
    doc.text('( _________________________ )', 150, sigY + 20, { align: 'center' });
    doc.text(inf.employee_name || '-', 150, sigY + 25, { align: 'center' });

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // black
    doc.text(`Dicetak: ${printedOnStr}, ${printedTimeStr}`, 15, doc.internal.pageSize.height - 10);

    const pdfOutput = doc.output('bloburl');
    window.open(pdfOutput, '_blank');
  }, []);

  // DataTable Column Definitions
  const columns = useMemo(() => [
    {
        id: 'action',
        header: 'Action',
        size: 140,
        meta: { sticky: true, headerBg: '#f8fafc' },
        cell: (info: any) => {
            const inf = info.row.original as Infraction;
            return (
                <div className="flex items-center gap-2 opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); generateSinglePDF(inf); }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 px-3 py-1.5 rounded-lg transition-colors leading-noner"
                        title="Cetak PDF Faktur"
                    >
                        <FileText size={12} />
                        PDF
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(inf); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Data"
                    >
                        <Pencil size={15} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(inf.id); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus Data"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            );
        }
    },
    {
        accessorKey: 'faktur',
        header: 'Faktur',
        size: 110,
        cell: (info: any) => (
            <span className="text-[11px] font-bold text-gray-300 font-mono tracking-widest leading-none">
                {info.getValue() || '---'}
            </span>
        )
    },
    {
        accessorKey: 'date',
        header: 'Tanggal',
        size: 140,
        cell: (info: any) => {
            const isSelected = info.row.getIsSelected();
            return (
                <div className={`flex items-center gap-2 text-[13px] font-bold ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>
                    <Calendar size={14} className={isSelected ? 'text-emerald-500' : 'text-gray-300'} />
                    {formatIndoDateStr(info.getValue() as string)}
                </div>
            );
        }
    },
    {
        accessorKey: 'employee_name',
        header: 'Karyawan',
        size: 200,
        cell: (info: any) => (
            <div className="flex flex-col gap-0.5 leading-snug overflow-hidden">
                <span className="text-[13px] font-bold text-gray-800 line-clamp-1 tracking-tight" title={info.getValue() as string}>
                    {info.getValue() || 'Karyawan Dihapus'}
                </span>
                {info.row.original.employee_position && (
                    <span className="text-[11px] font-bold text-gray-400 line-clamp-1">
                        {info.row.original.employee_position}
                    </span>
                )}
            </div>
        )
    },
    {
        accessorKey: 'description',
        header: 'Deskripsi',
        size: 250,
        cell: (info: any) => (
            <span className="text-[12px] text-gray-400 line-clamp-2 block leading-snug whitespace-normal" title={info.getValue() as string}>
                {info.getValue() || '---'}
            </span>
        )
    },
    {
        id: 'item',
        header: 'Item Detail',
        size: 220,
        cell: (info: any) => {
            const inf = info.row.original as Infraction;
            return (
                <div className="flex flex-col gap-1 leading-snug overflow-hidden">
                    <span className="text-[12px] font-bold text-gray-700 line-clamp-1" title={inf.nama_barang_display || inf.nama_barang || '---'}>
                        {inf.nama_barang_display || inf.nama_barang || '---'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-lg border border-emerald-100 leading-none">
                        {inf.jenis_barang || 'UMUM'}
                    </span>
                </div>
            );
        }
    },
    {
        accessorKey: 'order_name_display',
        header: 'Order Produksi',
        size: 220,
        cell: (info: any) => {
            const val = info.getValue() as string;
            return val ? (
                <span className="inline-block px-3 py-1 rounded-lg bg-gray-50 text-gray-600 text-[11px] font-bold tracking-tight truncate max-w-full border border-gray-100" title={val}>
                    {val}
                </span>
            ) : <span className="text-gray-200">—</span>;
        }
    },
    {
        accessorKey: 'jumlah',
        header: 'Qty',
        size: 80,
        meta: { align: 'right' },
        cell: (info: any) => (
            <span className="font-mono font-bold text-gray-700 text-[13px]">
                {info.getValue() || 0}
            </span>
        )
    },
    {
        accessorKey: 'harga',
        header: 'Harga',
        size: 130,
        meta: { align: 'right' },
        cell: (info: any) => {
            const val = info.getValue() as number;
            if (!val) return <span className="text-gray-200">—</span>;
            const formatted = val.toLocaleString('id-ID', { minimumFractionDigits: 0 }).trim();
            return (
                <div className="flex items-center justify-between w-full font-mono font-bold text-gray-700 pr-1 text-[12px]">
                    <span className="text-[11px] text-gray-300">Rp</span>
                    <span>{formatted}</span>
                </div>
            );
        }
    },
    {
        accessorKey: 'total',
        header: 'Total Beban',
        size: 140,
        meta: { align: 'right' },
        cell: (info: any) => {
            const val = info.getValue() as number;
            if (!val) return <span className="text-gray-200">—</span>;
            const formatted = val.toLocaleString('id-ID', { minimumFractionDigits: 0 }).trim();
            return (
                <div className="flex items-center justify-between w-full font-mono font-bold text-gray-900 pr-1 text-[14px]">
                    <span className="text-[11px] text-gray-300">Rp</span>
                    <span className="font-extrabold">{formatted}</span>
                </div>
            );
        }
    }
  ], [onEdit, generateSinglePDF]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="flex gap-3 shrink-0">
        <div className="flex-1 bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-2.5 shadow-sm shadow-emerald-900/5 flex items-center justify-between gap-4 relative z-50 overflow-visible">
          <div className="flex items-center gap-3">
            <div className="w-[140px] relative group">
              <DatePicker name="startDate" value={startDate} onChange={setStartDate} />
            </div>
            <div className="w-4 h-0.5 bg-gray-200 rounded-full"></div>
            <div className="w-[140px] relative group">
              <DatePicker name="endDate" value={endDate} onChange={setEndDate} popupAlign="right" />
            </div>
            {isRefreshing && (
              <RefreshCw size={16} className="animate-spin text-emerald-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateExcel}
              disabled={isExporting}
              className="h-10 px-3 bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center gap-1.5 text-[12px] disabled:opacity-60"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              <span>{isExporting ? '...' : 'Excel'}</span>
            </button>
            <button
              onClick={generatePDF}
              className="h-10 px-3 bg-red-50 text-red-600 border border-red-100 font-semibold rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center gap-1.5 text-[12px]"
            >
              <Printer size={14} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden relative min-h-0">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <div className="flex items-center gap-5">
              <div className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <ClipboardList size={16} />
                </div>
                <span>Riwayat Kesalahan Karyawan</span>
              </div>
            </div>
            {isRefreshing && data.length > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse tracking-tight leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
            )}
          </div>

          <SearchAndReload
            searchQuery={query}
            setSearchQuery={(v) => { setQuery(v); setVisibleCount(PAGE_SIZE); }}
            onReload={fetchFilteredData}
            loading={isRefreshing}
            placeholder="Cari nama karyawan, deskripsi, faktur..."
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden relative">
          <DataTable
              data={paginatedData}
              columns={columns}
              columnWidths={columnWidths}
              onColumnWidthChange={handleResize}
              isLoading={isRefreshing && data.length === 0}
              selectedIds={selectedIds}
              onRowClick={handleRowClick}
              onRowDoubleClick={(id) => {
                  const inf = paginatedData.find(d => d.id === id);
                  if (inf && onEdit) onEdit(inf);
              }}
              rowHeight="h-14"
          />
        </div>
        <TableFooter
          totalCount={filtered.length}
          currentCount={paginatedData.length}
          label="Rekaman Kesalahan"
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          loadTime={loadTime}
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => { setPage(p); clearSelection(); }}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        type="danger"
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus data kesalahan ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isLoading={isDeletingConfirm}
        onConfirm={executeDelete}
        onCancel={closeConfirm}
      />

      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={closeDialog}
      />
    </div>
  );
}

















