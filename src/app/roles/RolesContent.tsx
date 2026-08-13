'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, XCircle,
  Loader2, ChevronRight, UserCog, Plus, Pencil, Save, Trash2,
  AlertCircle, X
} from 'lucide-react';
import { saveRolePermissions, addRole, updateRole, deleteRole } from '@/lib/permissions-actions';
import { MODULE_REGISTRY } from '@/lib/permissions-constants';
import type { PermissionMap } from '@/lib/permissions-constants';
import PageHeader from '@/components/PageHeader';

export interface CustomRole {
  name: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}

interface RolesContentProps {
  allPermissions: Record<string, PermissionMap>;
  customRoles: CustomRole[];
}

const GROUP_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  'Dashboard':                        { text: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  'Data Digit':                       { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit - Pembelian':           { text: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  'Data Digit - Produksi':            { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Data Digit - Penjualan':           { text: 'text-indigo-700',  bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  'Sistem':                           { text: 'text-slate-700',   bg: 'bg-slate-50',   dot: 'bg-slate-500' },
  'Sistem - Umum':                    { text: 'text-slate-700',   bg: 'bg-slate-50',   dot: 'bg-slate-500' },
  'Sistem - HRD':                     { text: 'text-rose-700',    bg: 'bg-rose-50',    dot: 'bg-rose-500' },
  'Sistem - Kalkulasi':               { text: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500' },
  'Sistem - Produksi':                { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  'Sistem - Penjualan':               { text: 'text-indigo-700',  bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  'Sistem - User':                    { text: 'text-slate-700',   bg: 'bg-slate-50',   dot: 'bg-slate-500' },
  'Sistem - Settings':                { text: 'text-violet-700',  bg: 'bg-violet-50',  dot: 'bg-violet-500' },
};

export default function RolesContent({ allPermissions, customRoles }: RolesContentProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, PermissionMap>>(() =>
    JSON.parse(JSON.stringify(allPermissions))
  );

  useEffect(() => {
    setPermissions(JSON.parse(JSON.stringify(allPermissions)));
    setSelectedRole(prev => {
      if (!prev) return '';
      if (prev === 'Super Admin') return prev;
      if (!customRoles.some(r => r.name === prev)) return '';
      return prev;
    });
  }, [allPermissions, customRoles]);

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, Record<string, boolean>>>({});

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingRole) {
      editFormRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [editingRole]);

  // Confirm delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sintak_roles_collapsed');
      if (stored) setCollapsedGroups(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleCollapse = (group: string, currentIsCollapsed: boolean) => {
    if (!selectedRole) return;
    setCollapsedGroups(prev => {
      const roleCollapsed = prev[selectedRole] || {};
      const next = { ...prev, [selectedRole]: { ...roleCollapsed, [group]: !currentIsCollapsed } };
      try { localStorage.setItem('sintak_roles_collapsed', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const showResult = (type: 'success' | 'error', msg: string) => {
    setResult({ type, msg });
    setTimeout(() => setResult(null), 3000);
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    const res = await addRole(newRoleName, newRoleDesc);
    setSaving(false);
    if (res.success) {
      showResult('success', 'Role ditambahkan');
      setIsAddingRole(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedRole(newRoleName.trim());
      router.refresh();
    } else {
      showResult('error', res.message || 'Gagal menambah role');
    }
  };

  const handleUpdateRole = async () => {
    if (!editRoleName.trim() || !editingRole) return;
    setSaving(true);
    const res = await updateRole(editingRole, editRoleName, editRoleDesc);
    setSaving(false);
    if (res.success) {
      showResult('success', 'Role diperbarui');
      if (selectedRole === editingRole) setSelectedRole(editRoleName.trim());
      setEditingRole(null);
      router.refresh();
    } else {
      showResult('error', res.message || 'Gagal mengubah role');
    }
  };

  const handleDeleteRole = async (role: string) => {
    setSaving(true);
    const res = await deleteRole(role);
    setSaving(false);
    if (res.success) {
      showResult('success', 'Role dihapus');
      if (selectedRole === role) {
        const next = customRoles.find(r => r.name !== role)?.name || '';
        setSelectedRole(next);
      }
      router.refresh();
    } else {
      showResult('error', res.message || 'Gagal menghapus role');
    }
    setDeleteConfirm(null);
  };

  const currentRoleMeta = customRoles.find(r => r.name === selectedRole) || {
    name: selectedRole, description: '', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200'
  };

  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof MODULE_REGISTRY[number][]> = {};
    for (const m of MODULE_REGISTRY) {
      let g: string = m.group;
      if (g.startsWith('Data Digit - ')) g = 'Data Digit';
      if (g.startsWith('Sistem - ')) g = 'Sistem';
      if (!groups[g]) groups[g] = [];
      groups[g].push(m);
    }
    return groups;
  }, []);

  const currentRoleCollapsed = collapsedGroups[selectedRole] || {};

  const togglePermission = async (moduleKey: string) => {
    const newValue = !(permissions[selectedRole]?.[moduleKey] ?? false);
    const updatedRolePerms = { ...permissions[selectedRole], [moduleKey]: newValue };
    setPermissions(prev => ({ ...prev, [selectedRole]: updatedRolePerms }));
    setSaving(true);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);
    if (!res.success) {
      showResult('error', res.message || 'Gagal menyimpan.');
      setPermissions(permissions);
    } else {
      showResult('success', 'Tersimpan');
    }
  };

  const toggleKeysList = async (keys: string[], value: boolean) => {
    const updatedRolePerms = { ...permissions[selectedRole] };
    for (const k of keys) updatedRolePerms[k] = value;
    setPermissions(prev => ({ ...prev, [selectedRole]: updatedRolePerms }));
    setSaving(true);
    const res = await saveRolePermissions(selectedRole, updatedRolePerms);
    setSaving(false);
    if (!res.success) {
      showResult('error', res.message || 'Gagal menyimpan.');
      setPermissions(permissions);
    } else {
      showResult('success', 'Tersimpan');
    }
  };

  const toggleGroup = (group: string, value: boolean) => {
    const keys = (groupedModules[group] || []).map(m => m.key);
    toggleKeysList(keys, value);
  };

  const getGroupStats = (role: string, group: string) => {
    const keys = (groupedModules[group] || []).map(m => m.key);
    return { enabled: keys.filter(k => permissions[role]?.[k]).length, total: keys.length };
  };

  const getTotalStats = (role: string) => {
    const total = MODULE_REGISTRY.length;
    const enabled = MODULE_REGISTRY.filter(m => permissions[role]?.[m.key]).length;
    return { enabled, total };
  };

  const collectKeys = (items: any[]): string[] =>
    items.flatMap(item => item.type === 'leaf' ? [item.key] : collectKeys(item.children));

  // ─── Tree data definitions ────────────────────────────────────────────────
  const ddTree: any[] = [
    { type: 'leaf', key: 'sync', label: 'Sinkronisasi All Data' },
    { type: 'node', label: 'Pembelian', colorKey: 'Data Digit - Pembelian', children: [
      { type: 'leaf', key: 'pembelian_pr', label: 'Purchase Request (PR)' },
      { type: 'leaf', key: 'pembelian_spph', label: 'SPPH Keluar' },
      { type: 'leaf', key: 'pembelian_sph_in', label: 'SPH Masuk' },
      { type: 'leaf', key: 'pembelian_po', label: 'Purchase Order (PO)' },
      { type: 'leaf', key: 'pembelian_penerimaan', label: 'Penerimaan Barang' },
      { type: 'leaf', key: 'pembelian_rekap', label: 'Rekap Pembelian Barang' },
      { type: 'leaf', key: 'pembelian_hutang', label: 'Pelunasan Hutang' },
    ]},
    { type: 'node', label: 'Produksi', colorKey: 'Data Digit - Produksi', children: [
      { type: 'leaf', key: 'produksi_bom', label: 'BOM Produksi' },
      { type: 'leaf', key: 'produksi_orders', label: 'Order Produksi' },
      { type: 'leaf', key: 'produksi_bahan_baku', label: 'BBB Produksi' },
      { type: 'leaf', key: 'produksi_barang_jadi', label: 'Penerimaan Barang Hasil Produksi' },
    ]},
    { type: 'node', label: 'Penjualan', colorKey: 'Data Digit - Penjualan', children: [
      { type: 'leaf', key: 'penjualan_sph_out', label: 'SPH Keluar (Penjualan)' },
      { type: 'leaf', key: 'penjualan_so', label: 'Sales Order Barang' },
      { type: 'leaf', key: 'penjualan_laporan', label: 'Laporan Penjualan' },
      { type: 'leaf', key: 'penjualan_piutang', label: 'Pelunasan Piutang' },
      { type: 'leaf', key: 'penjualan_pengiriman', label: 'Pengiriman (SJ)' },
    ]},
    { type: 'node', label: 'Akuntansi & Keuangan', colorKey: 'Data Digit - Akuntansi', children: [
      { type: 'leaf', key: 'akt_mrek', label: 'Rek Akuntansi' },
      { type: 'leaf', key: 'akt_jurnal_umum', label: 'Jurnal Umum' },
    ]},
    { type: 'node', label: 'Stok', colorKey: 'Data Digit - Stok', children: [
      { type: 'leaf', key: 'stok_master_barang', label: 'Master Barang' },
    ]},
  ];

  const sistemTree: any[] = [
    { type: 'node', label: 'Umum', colorKey: 'Sistem - Umum', children: [
      { type: 'leaf', key: 'karyawan', label: 'Karyawan' },
      { type: 'leaf', key: 'tracking_manufaktur', label: 'Tracking Manufaktur' },
    ]},
    { type: 'node', label: 'HRD', colorKey: 'Sistem - HRD', children: [
      { type: 'leaf', key: 'catat_kesalahan', label: 'Catat Kesalahan' },
    ]},
    { type: 'node', label: 'Kalkulasi', colorKey: 'Sistem - Kalkulasi', children: [
      { type: 'leaf', key: 'hpp_kalkulasi', label: 'HPP Kalkulasi' },
    ]},
    { type: 'node', label: 'Produksi', colorKey: 'Sistem - Produksi', children: [
      { type: 'leaf', key: 'produksi_hasil', label: 'Hasil Produksi' },
      { type: 'leaf', key: 'produksi_laporan_pekerjaan', label: 'Laporan Pekerjaan' },
      { type: 'node', label: 'Jurnal Harian Produksi', children: [
        { type: 'leaf', key: 'produksi_jhp', label: 'Jurnal Harian Produksi' },
        { type: 'leaf', key: 'produksi_jhp_penjadwalan', label: 'Input Target (Penjadwalan)' },
        { type: 'leaf', key: 'produksi_jhp_realisasi', label: 'Input Realisasi' },
        { type: 'leaf', key: 'produksi_jhp_target', label: 'Target Harian' },
        { type: 'leaf', key: 'produksi_jhp_sopd', label: 'SOPd' },
        { type: 'leaf', key: 'produksi_jhp_master_pekerjaan', label: 'Master Pekerjaan' },
        { type: 'leaf', key: 'produksi_jhp_master_pekerjaan_jurnal_produksi', label: 'Master Pekerjaan Jurnal Produksi' },
      ]},
    ]},
    { type: 'node', label: 'Penjualan', colorKey: 'Sistem - Penjualan', children: [
      { type: 'leaf', key: 'kalkulasi_rekap_so', label: 'Rekap Sales Order Barang' },
    ]},
    { type: 'node', label: 'User', colorKey: 'Sistem - User', children: [
      { type: 'leaf', key: 'hak_akses', label: 'Hak Akses' },
      { type: 'leaf', key: 'kelola_user', label: 'Kelola User' },
    ]},
    { type: 'node', label: 'Settings', colorKey: 'Sistem - Settings', children: [
      { type: 'leaf', key: 'settings_konversi_data_hpp', label: 'Konversi Data - HPP Kalkulasi' },
      { type: 'leaf', key: 'settings_konversi_data', label: 'Konversi Data - JHP' },
    ]},
  ];

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderToggle = (isEnabled: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${isEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  );

  const renderLeaf = (item: any, depth: number) => {
    const isEnabled = permissions[selectedRole]?.[item.key] ?? false;
    return (
      <div
        key={item.key}
        onClick={() => togglePermission(item.key)}
        className="group/row flex items-center justify-between py-2.5 pr-5 cursor-pointer hover:bg-emerald-50/40 transition-colors border-t border-gray-50"
        style={{ paddingLeft: `${20 + depth * 20}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-1 h-1 rounded-full shrink-0 ${isEnabled ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          <span className={`text-[12.5px] truncate transition-colors ${isEnabled ? 'text-gray-700 font-semibold' : 'text-gray-400 font-medium'}`}>
            {item.label}
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          <span className={`text-[11px] font-bold w-8 text-right transition-colors ${isEnabled ? 'text-emerald-600' : 'text-gray-300'}`}>
            {isEnabled ? 'ON' : 'OFF'}
          </span>
          {renderToggle(isEnabled, () => togglePermission(item.key))}
        </div>
      </div>
    );
  };

  const renderNode = (item: any, depth: number): React.ReactNode => {
    const nodeKeys = collectKeys(item.children);
    const nodeEnabled = nodeKeys.filter(k => permissions[selectedRole]?.[k]).length;
    const collapseKey = `node-${item.label.replace(/\s+/g, '-').toLowerCase()}-${depth}`;
    const isCollapsed = currentRoleCollapsed[collapseKey] ?? (nodeEnabled === 0);
    const isTop = depth === 0;

    return (
      <div key={collapseKey} className="border-t border-gray-100">
        <div
          className={`flex items-center justify-between pr-5 cursor-pointer select-none transition-colors ${isTop ? 'py-3 bg-gray-50/60 hover:bg-gray-100/60' : 'py-2 hover:bg-gray-50/60'}`}
          style={{ paddingLeft: `${20 + depth * 20}px` }}
          onClick={() => toggleCollapse(collapseKey, isCollapsed)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChevronRight size={14} className={`text-gray-400 shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
            <span className={`truncate transition-colors ${isTop ? 'text-[12.5px] font-bold text-gray-700' : 'text-[12px] font-semibold text-gray-600'}`}>
              {item.label}
            </span>
            <span className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${nodeEnabled > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
              {nodeEnabled}/{nodeKeys.length}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, true); }}
              className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-all"
            >On</button>
            <span className="text-gray-200 text-[11px]">|</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleKeysList(nodeKeys, false); }}
              className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
            >Off</button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="animate-in slide-in-from-top-1 fade-in duration-200">
            {item.children.map((child: any) =>
              child.type === 'leaf' ? renderLeaf(child, depth + 1) : renderNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTopGroup = (label: string, tree: any[], groupKey: string) => {
    const allKeys = Array.from(new Set(collectKeys(tree)));
    const allEnabled = allKeys.filter(k => permissions[selectedRole]?.[k]).length;
    const isCollapsed = currentRoleCollapsed[groupKey] ?? (allEnabled === 0);

    return (
      <div key={groupKey} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Group Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-gray-100 cursor-pointer select-none hover:from-emerald-100/60 hover:to-emerald-100/60 transition-colors"
          onClick={() => toggleCollapse(groupKey, isCollapsed)}
        >
          <div className="flex items-center gap-2.5">
            <ChevronRight size={15} className={`text-emerald-600 shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
            <span className="text-[13px] font-bold text-gray-800">{label}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${allEnabled > 0 ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-gray-400 bg-white border-gray-200'}`}>
              {allEnabled}/{allKeys.length} aktif
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={e => { e.stopPropagation(); toggleKeysList(allKeys, true); }} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all">On All</button>
            <span className="w-px h-3 bg-gray-200" />
            <button type="button" onClick={e => { e.stopPropagation(); toggleKeysList(allKeys, false); }} className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Off All</button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            {tree.map(item => item.type === 'leaf' ? renderLeaf(item, 0) : renderNode(item, 0))}
          </div>
        )}
      </div>
    );
  };

  const renderDashboardGroup = () => {
    const dashModules = groupedModules['Dashboard'] || [];
    const { enabled, total } = getGroupStats(selectedRole, 'Dashboard');
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-bold text-gray-800">Dashboard</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${enabled > 0 ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-gray-400 bg-white border-gray-200'}`}>
              {enabled}/{total} aktif
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => toggleGroup('Dashboard', true)} className="text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all">On All</button>
            <span className="w-px h-3 bg-gray-200" />
            <button type="button" onClick={() => toggleGroup('Dashboard', false)} className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Off All</button>
          </div>
        </div>
        {dashModules.map(m => renderLeaf({ type: 'leaf', key: m.key, label: m.label }, 0))}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden h-[calc(100vh-130px)]">
      <PageHeader
        title="Hak Akses & Role"
        description="Konfigurasi izin penggunaan setiap modul operasional SINTAK."
      />

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 overflow-hidden">

        {/* ── LEFT PANEL: ROLES ─────────────────────────────────────────── */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 h-full min-h-0 overflow-hidden">

          {/* Super Admin card */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden shrink-0">
            <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50/50">
              <span className="text-[11px] font-bold text-gray-400">Sistem</span>
            </div>
            <div className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <ShieldCheck size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">Super Admin</p>
                <p className="text-[11px] text-emerald-600 font-semibold">Akses Penuh</p>
              </div>
            </div>
          </div>

          {/* Configurable roles */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-bold text-gray-400">Role</span>
              <button
                onClick={() => { setIsAddingRole(v => !v); setEditingRole(null); }}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
              >
                {isAddingRole ? <X size={12} /> : <Plus size={12} />}
              </button>
            </div>

            {/* Add role form */}
            {isAddingRole && (
              <div className="p-3.5 border-b border-gray-100 bg-emerald-50/30 animate-in slide-in-from-top-2 duration-200 shrink-0">
                <input
                  type="text"
                  placeholder="Nama role..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-semibold focus:outline-none focus:border-emerald-400 mb-2 placeholder:text-gray-300 placeholder:font-normal"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                />
                <input
                  type="text"
                  placeholder="Deskripsi (opsional)..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-medium focus:outline-none focus:border-emerald-400 mb-3 placeholder:text-gray-300 placeholder:font-normal"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingRole(false)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1">Batal</button>
                  <button
                    onClick={handleAddRole}
                    disabled={saving || !newRoleName.trim()}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50 transition-all"
                  >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* Role list */}
            <div className="flex flex-col divide-y divide-gray-50 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {customRoles.length === 0 && (
                <p className="text-[11px] text-gray-400 text-center py-6 italic">Belum ada role</p>
              )}
              {customRoles.map(m => {
                const role = m.name;
                const isActive = selectedRole === role;
                const { enabled, total } = getTotalStats(role);

                if (editingRole === role) {
                  return (
                    <div key={`edit-${role}`} ref={editFormRef} className="p-3.5 bg-emerald-50/30 animate-in slide-in-from-top-1 duration-200">
                      <input
                        type="text"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-semibold focus:outline-none focus:border-emerald-400 mb-2"
                        value={editRoleName}
                        onChange={e => setEditRoleName(e.target.value)}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleUpdateRole()}
                      />
                      <input
                        type="text"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-medium focus:outline-none focus:border-emerald-400 mb-3"
                        value={editRoleDesc}
                        onChange={e => setEditRoleDesc(e.target.value)}
                        placeholder="Deskripsi..."
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingRole(null)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1">Batal</button>
                        <button
                          onClick={handleUpdateRole}
                          disabled={saving}
                          className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Update
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={role} className="group relative">
                    <button
                      onClick={() => { setSelectedRole(role); setEditingRole(null); setIsAddingRole(false); }}
                      className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors ${
                        isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <UserCog size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12.5px] font-bold truncate ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{role}</p>
                        <p className={`text-[11px] font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{enabled}/{total} modul</p>
                      </div>
                      {isActive && <ChevronRight size={14} className="text-emerald-500 shrink-0" />}
                    </button>
                    {/* Edit/Delete — visible on hover */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingRole(role); setEditRoleName(role); setEditRoleDesc(m.description || ''); setIsAddingRole(false); }}
                        className="p-1.5 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 transition-all"
                      ><Pencil size={12} /></button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(role); }}
                        className="p-1.5 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400 hover:text-red-500 transition-all"
                      ><Trash2 size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: PERMISSIONS ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">

          {!selectedRole ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-700 mb-1.5">Pilih Role</h3>
              <p className="text-[12px] text-gray-400 text-center max-w-xs">
                Pilih role di sebelah kiri untuk mengkonfigurasi hak akses modul.
              </p>
            </div>
          ) : (
            <>
              {/* Role header bar */}
              <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <UserCog size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-gray-800 truncate">{selectedRole}</p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                      {currentRoleMeta.description || 'Pengaturan Hak Akses'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {saving && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[11px] font-bold text-gray-400">
                      <Loader2 size={12} className="animate-spin text-emerald-500" />
                      Menyimpan...
                    </div>
                  )}
                  {result && !saving && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold animate-in fade-in duration-200 ${
                      result.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {result.type === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {result.msg}
                    </div>
                  )}
                </div>
              </div>

              {/* Permission tree */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pb-10 pr-0.5">
                {renderDashboardGroup()}
                {renderTopGroup('Data Digit', ddTree, 'Data Digit')}
                {renderTopGroup('Sistem', sistemTree, 'Sistem')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRM DIALOG ─────────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-red-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-800">Hapus Role</p>
                  <p className="text-[11px] text-gray-500 font-medium">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/80 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] font-semibold text-amber-700">
                  User yang memiliki role <b>&quot;{deleteConfirm}&quot;</b> tidak akan bisa login sampai Super Admin menugaskan role baru.
                </p>
              </div>
              <p className="text-[12px] text-gray-600 font-medium">
                Yakin ingin menghapus role <span className="font-bold text-gray-800">&quot;{deleteConfirm}&quot;</span>?
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
              >Batal</button>
              <button
                onClick={() => handleDeleteRole(deleteConfirm)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-[12px] font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-xl shadow-sm transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Hapus Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
