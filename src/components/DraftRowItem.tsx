'use client';

import { memo, useState, useCallback } from 'react';
import { PencilLine, Trash2, Plus, Copy, Check } from 'lucide-react';
import InlineDropdown from './InlineDropdown';

interface DraftRow {
  _draftId: string;
  _alasan?: string;
  _sourceType?: 'pola_historis' | 'order_aktif' | 'fallback';
  posisi: number;
  absensi: number;
  shift: string;
  nama_karyawan: string;
  no_order: string;
  nama_order: string;
  jenis_pekerjaan: string;
  keterangan: string;
  target: number | null;
  bagian: string;
  is_manual_input: number;
  nama_order_manual: string;
  nama_order_manual_2: string;
}

interface DraftRowItemProps {
  row: DraftRow;
  index: number;
  shiftOptions: { label: string; value: string; key: string }[];
  karyawanOptions: { label: string; value: string; key: string }[];
  bagianOptions: { label: string; value: string; key: string }[];
  orderOptions: { label: string; value: string; key: string; meta?: { nama_order?: string } }[];
  pekerjaanOptions: { label: string; value: string; key: string }[];
  onUpdate: (draftId: string, field: string, value: any) => void;
  onRemove: () => void;
  onInsert: () => void;
}

function renderExpandableCell(
  text: string,
  isExpanded: boolean,
  onToggle: () => void,
  emptyLabel = '—'
) {
  if (!text) return <span className="text-gray-300">{emptyLabel}</span>;
  return (
    <button type="button" onClick={onToggle} className="text-left w-full">
      <span className={`block ${isExpanded ? 'whitespace-normal break-words' : 'truncate max-w-[150px]'}`}>
        {text}
      </span>
    </button>
  );
}

const DraftRowItem = memo(function DraftRowItem({
  row, index,
  shiftOptions, karyawanOptions, bagianOptions, orderOptions, pekerjaanOptions,
  onUpdate, onRemove, onInsert,
}: DraftRowItemProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [alasanExpanded, setAlasanExpanded] = useState(false);
  const [namaOrderCopied, setNamaOrderCopied] = useState(false);

  const handleCopyNamaOrder = useCallback(() => {
    if (!row.nama_order) return;
    navigator.clipboard.writeText(row.nama_order).then(() => {
      setNamaOrderCopied(true);
      setTimeout(() => setNamaOrderCopied(false), 1500);
    });
  }, [row.nama_order]);

  const toggleFeedback = useCallback(() => {
    setFeedbackOpen(prev => !prev);
  }, []);

  const handleFeedbackChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setFeedbackReason(val);
    onUpdate(row._draftId, '_feedbackReason', val);
  }, [row._draftId, onUpdate]);

  const isEven = index % 2 === 0;

  return (
    <>
      <tr style={{ background: isEven ? '#ffffff' : '#f9fafb' }}>
        {/* No */}
        <td className="border border-gray-200 py-1.5 px-2 text-center font-bold text-gray-400 text-[12px]">
          {index + 1}
        </td>

        {/* Bagian */}
        <td className="border border-gray-200 py-1.5 px-2">
          <InlineDropdown
            value={row.bagian}
            options={bagianOptions}
            onChange={v => onUpdate(row._draftId, 'bagian', v)}
            placeholder="-"
            searchable
            className="w-full max-w-[120px]"
          />
        </td>

        {/* Shift */}
        <td className="border border-gray-200 py-1.5 px-2 text-center">
          <InlineDropdown
            value={row.shift}
            options={shiftOptions}
            onChange={v => onUpdate(row._draftId, 'shift', v)}
            placeholder="-"
            className="w-14 justify-center"
          />
        </td>

        {/* Nama Karyawan */}
        <td className="border border-gray-200 py-1.5 px-2">
          <InlineDropdown
            value={row.nama_karyawan}
            options={karyawanOptions}
            onChange={v => onUpdate(row._draftId, 'nama_karyawan', v)}
            placeholder="Nama karyawan"
            searchable
            freeInput
            className="w-full max-w-[160px]"
          />
        </td>

        {/* No Order */}
        <td className="border border-gray-200 py-1.5 px-2">
          <InlineDropdown
            value={row.no_order}
            options={orderOptions}
            onChange={(v, opt) => {
              onUpdate(row._draftId, 'no_order', v);
              const namaOrder = (opt as any)?.meta?.nama_order ?? '';
              onUpdate(row._draftId, 'nama_order', namaOrder);
            }}
            placeholder="No order"
            searchable
            freeInput
            className="w-full max-w-[140px]"
          />
        </td>

        {/* Nama Order */}
        <td className="border border-gray-200 py-1.5 px-2 text-[11px] font-medium text-gray-600 max-w-[150px]">
          {row.nama_order ? (
            <div className="flex items-start gap-1 group">
              <span className="break-words min-w-0 flex-1">{row.nama_order}</span>
              <button
                type="button"
                onClick={handleCopyNamaOrder}
                title="Salin nama order"
                className="shrink-0 p-0.5 rounded text-gray-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                {namaOrderCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </td>

        {/* Jenis Pekerjaan */}
        <td className="border border-gray-200 py-1.5 px-2">
          <InlineDropdown
            value={row.jenis_pekerjaan}
            options={pekerjaanOptions}
            onChange={v => onUpdate(row._draftId, 'jenis_pekerjaan', v)}
            placeholder="Jenis pekerjaan"
            searchable
            freeInput
            className="w-full max-w-[150px]"
          />
        </td>

        {/* Keterangan */}
        <td className="border border-gray-200 py-1.5 px-2">
          <input
            value={row.keterangan}
            onChange={e => onUpdate(row._draftId, 'keterangan', e.target.value)}
            className="w-full px-2 py-1 text-[11px] font-bold border border-gray-200 rounded-lg bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
            placeholder="Keterangan"
          />
        </td>

        {/* Target */}
        <td className="border border-gray-200 py-1.5 px-2 text-right">
          <input
            type="number"
            value={row.target ?? ''}
            onChange={e => onUpdate(row._draftId, 'target', e.target.value === '' ? null : Number(e.target.value))}
            className="w-20 px-2 py-1 text-[11px] font-black text-right border border-gray-200 rounded-lg bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none"
            placeholder="0"
          />
        </td>

        {/* Alasan */}
        <td className="border border-gray-200 py-1.5 px-2 text-[11px] text-gray-400 max-w-[180px]">
          {row._sourceType && (
            <span className={`inline-block mb-0.5 px-1.5 py-0.5 rounded text-[11px] font-black mr-1 ${
              row._sourceType === 'order_aktif'
                ? 'bg-emerald-50 text-emerald-700'
                : row._sourceType === 'pola_historis'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {row._sourceType === 'order_aktif' ? 'Order Aktif' : row._sourceType === 'pola_historis' ? 'Pola' : 'Fallback'}
            </span>
          )}
          {renderExpandableCell(row._alasan || '', alasanExpanded, () => setAlasanExpanded(p => !p))}
        </td>

        {/* Tombol aksi: sisipkan + hapus + feedback */}
        <td className="border border-gray-200 py-1.5 px-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onInsert}
              className="p-1.5 rounded-lg transition-all hover:bg-emerald-50 text-gray-300 hover:text-emerald-600"
              title="Sisipkan baris baru di bawah"
              type="button"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg transition-all hover:bg-rose-50 text-gray-300 hover:text-rose-500"
              title="Hapus baris"
              type="button"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={toggleFeedback}
              className={`p-1.5 rounded-lg transition-all ${
                feedbackOpen
                  ? 'bg-amber-100 text-amber-600'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-amber-500'
              }`}
              title="Beri alasan koreksi"
              type="button"
            >
              <PencilLine size={14} />
            </button>
          </div>
        </td>
      </tr>

      {/* Feedback sub-row */}
      {feedbackOpen && (
        <tr className="bg-amber-50/50">
          <td className="border border-gray-200 py-2 px-2" colSpan={11}>
            <div className="flex items-start gap-3 px-2">
              <PencilLine size={14} className="text-amber-500 mt-1 shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-amber-700 mb-1">
                  {row.nama_karyawan || '(nama kosong)'}
                </p>
                <textarea
                  value={feedbackReason}
                  onChange={handleFeedbackChange}
                  className="w-full px-3 py-2 text-[12px] font-bold border border-amber-200 rounded-lg bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none resize-y min-h-[60px]"
                  placeholder="Jelaskan mengapa data ini perlu dikoreksi (opsional)..."
                  autoFocus
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

export default DraftRowItem;
