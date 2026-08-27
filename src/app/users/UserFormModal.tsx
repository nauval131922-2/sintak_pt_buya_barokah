'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Save, RefreshCw, AlertCircle, Search,
  User, ShieldCheck, UserCog, Lock, Eye, EyeOff, Check, ChevronDown,
} from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import { createUser, updateUser } from '@/lib/users';

interface UserData {
  id: number;
  username: string;
  name: string;
  roles: string[];
  role: string;
  is_active?: number;
  employee_id?: number | null;
}

interface UserFormModalProps {
  user: UserData | null;
  customRoles?: string[];
  currentUserId?: number;
  onClose: (refresh: boolean) => void;
}

export default function UserFormModal({ user, customRoles = [], currentUserId, onClose }: UserFormModalProps) {
  const isEditing = !!user;

  const [employees, setEmployees] = useState<Array<{ id: number; name: string; position: string; employee_no: string | null }>>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(user?.employee_id || null);

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  // selectedRoles: array role yang dipilih
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    if (user?.roles && user.roles.length > 0) return user.roles;
    if (user?.role) return [user.role];
    return [];
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(user?.is_active ?? 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees list for linkage
  useEffect(() => {
    fetch('/api/employees?all=true')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setEmployees(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Items & labels untuk SearchableDropdown tautkan karyawan
  const employeeItems = useMemo(() => {
    return employees.map(emp => String(emp.id));
  }, [employees]);

  const employeeItemLabels = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach(emp => {
      map[String(emp.id)] = `${emp.name}${emp.position ? ` (${emp.position})` : ''}${emp.employee_no ? ` • ID: ${emp.employee_no}` : ''}`;
    });
    return map;
  }, [employees]);

  // Role dropdown state
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => {
    setIsRoleDropdownOpen(false);
    setRoleSearchQuery('');
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!isRoleDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownPanelRef.current?.contains(target)
      ) return;
      closeDropdown();
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isRoleDropdownOpen, closeDropdown]);

  // Escape tutup dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRoleDropdownOpen) {
        closeDropdown();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRoleDropdownOpen, closeDropdown]);

  const toggleRole = useCallback((roleName: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      }
      return [...prev, roleName];
    });
  }, []);

  const filteredRoles = useMemo(
    () => customRoles.filter(r => r.toLowerCase().includes(roleSearchQuery.toLowerCase())),
    [customRoles, roleSearchQuery]
  );

  // Label tombol trigger
  const triggerLabel = useMemo(() => {
    if (selectedRoles.length === 0) return 'Pilih role...';
    if (selectedRoles.length === 1) return selectedRoles[0];
    return `${selectedRoles.length} role dipilih`;
  }, [selectedRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || (!isEditing && !password)) {
      setError('Harap lengkapi semua field wajib.');
      return;
    }
    if (selectedRoles.length === 0) {
      setError('Pilih minimal satu role.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isEditing) {
        res = await updateUser(user!.id, {
          name,
          username,
          roles: selectedRoles,
          password: password || undefined,
          is_active: isActive,
          employee_id: selectedEmployeeId,
        });
      } else {
        res = await createUser({
          name,
          username,
          roles: selectedRoles,
          password,
          employee_id: selectedEmployeeId,
        });
      }

      if (res.success) {
        onClose(true);
        localStorage.setItem('sintak_data_updated', Date.now().toString());
      } else {
        setError(res.message || 'Gagal menyimpan user.');
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-emerald-50 shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <UserCog size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">
                  {isEditing ? 'Edit Profil User' : 'Tambah Akun Baru'}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  {isEditing ? `Memperbarui data untuk @${user?.username}` : 'Isi detail akun pengguna baru'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in duration-200">
                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[12px] font-semibold text-rose-700">{error}</p>
              </div>
            )}

            {/* Pilih Karyawan */}
            <div>
              <label className="block text-[12px] font-bold text-gray-600 mb-2">
                Pilih Karyawan <span className="text-rose-400">*</span>
              </label>
              <SearchableDropdown
                id="user-employee-link"
                value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
                items={employeeItems}
                itemLabels={employeeItemLabels}
                allLabel="-- Pilih Karyawan --"
                placeholder="Pilih Karyawan..."
                searchPlaceholder="Cari nama karyawan / jabatan..."
                triggerWidth="w-full"
                panelWidth="w-full"
                usePortal={true}
                icon={<User size={14} className={selectedEmployeeId ? 'text-emerald-600' : 'text-gray-400'} />}
                onChange={(val) => {
                  const numVal = val ? Number(val) : null;
                  setSelectedEmployeeId(numVal);
                  if (numVal) {
                    const emp = employees.find(item => item.id === numVal);
                    if (emp) {
                      setName(emp.name);
                      if (!isEditing || !username) {
                        setUsername(emp.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }
                    }
                  } else {
                    if (!isEditing) {
                      setName('');
                      setUsername('');
                    }
                  }
                }}
              />
              {selectedEmployeeId && (
                <div className="mt-2 flex items-center justify-between text-[11.5px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <User size={14} className="shrink-0 text-emerald-600" />
                    <span className="truncate">
                      Nama Akun: <b>{employees.find(e => e.id === selectedEmployeeId)?.name}</b>
                    </span>
                  </div>
                  {employees.find(e => e.id === selectedEmployeeId)?.position && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-800 shrink-0">
                      {employees.find(e => e.id === selectedEmployeeId)?.position}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-[12px] font-bold text-gray-600 mb-2">
                Username <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="w-full pl-8 pr-3 py-2.5 text-[13px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none transition-all lowercase placeholder:text-gray-300 placeholder:normal-case"
                  placeholder="Contoh: budis"
                  required
                />
              </div>
            </div>

            {/* Peran Akses — Multi-select */}
            <div className="relative">
              <label className="block text-[12px] font-bold text-gray-600 mb-2">
                Peran Akses (Role) <span className="text-rose-400">*</span>
                <span className="ml-1.5 font-normal text-gray-400">— bisa lebih dari satu</span>
              </label>

              {/* Trigger button */}
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsRoleDropdownOpen(prev => !prev)}
                className={`w-full px-3.5 py-2.5 text-left bg-gray-50 border rounded-lg focus:outline-none transition-all text-[13px] font-medium flex items-center justify-between gap-2 ${
                  isRoleDropdownOpen ? 'border-emerald-400 bg-white ring-4 ring-emerald-500/5' : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <UserCog size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate text-gray-700">{triggerLabel}</span>
                </div>
                <ChevronDown
                  size={15}
                  className={`text-gray-400 shrink-0 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`}
                />
              </button>

              {/* Dropdown Role Menu Panel (Native Relative) */}
              {isRoleDropdownOpen && (
                <div
                  ref={dropdownPanelRef}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                >
                  {/* Search */}
                  <div className="p-2 border-b border-gray-50">
                    <div className="relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Cari role..."
                        value={roleSearchQuery}
                        onChange={e => setRoleSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-[12px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  {/* Hint */}
                  <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-100">
                    <p className="text-[11px] text-emerald-600 font-semibold">Klik untuk centang / hapus centang role</p>
                  </div>
                  {/* Options */}
                  <div className="max-h-[180px] overflow-y-auto p-1.5 custom-scrollbar">
                    {filteredRoles.length === 0 ? (
                      <p className="text-center text-[11px] text-gray-400 italic py-4">Tidak ada role ditemukan</p>
                    ) : (
                      filteredRoles.map(cr => {
                        const isChecked = selectedRoles.includes(cr);
                        return (
                          <button
                            type="button"
                            key={cr}
                            onClick={() => toggleRole(cr)}
                            className={`w-full text-left px-3 py-2.5 text-[12px] font-semibold rounded-lg transition-all flex items-center gap-2.5 border mb-1 ${
                              isChecked
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                            }`}
                          >
                            {/* Checkbox visual */}
                            <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isChecked ? 'bg-white/20 border-white/40' : 'border-gray-300 bg-white'
                            }`}>
                              {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                            </span>
                            <span className="flex-1 truncate">{cr}</span>
                            {cr === 'Super Admin' && (
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isChecked ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                                SA
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                  {/* Footer info jumlah terpilih */}
                  <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {selectedRoles.length} role dipilih
                    </span>
                    <button
                      type="button"
                      onClick={closeDropdown}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}

              {/* Badge role yang sudah dipilih */}
              {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedRoles.map(r => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-lg"
                    >
                      {r === 'Super Admin' && <ShieldCheck size={10} />}
                      {r}
                      <button
                        type="button"
                        onClick={() => toggleRole(r)}
                        className="ml-0.5 text-emerald-500 hover:text-rose-500 transition-colors"
                        aria-label={`Hapus role ${r}`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-bold text-gray-600 mb-2">
                {isEditing ? (
                  <>Password Baru <span className="text-gray-400 font-medium">(opsional)</span></>
                ) : (
                  <>Password <span className="text-rose-400">*</span></>
                )}
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-8 pr-10 py-2.5 text-[13px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-400 focus:outline-none transition-all placeholder:text-gray-300"
                  placeholder={isEditing ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                  required={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {!isEditing && password.length > 0 && password.length < 6 && (
                <p className="text-[11px] text-amber-500 font-semibold flex items-center gap-1.5 mt-1.5 ml-0.5">
                  <AlertCircle size={11} />
                  Password minimal 6 karakter
                </p>
              )}
            </div>

            {/* Status Aktif/Nonaktif */}
            {isEditing && (
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex flex-col gap-0.5 leading-tight">
                  <span className="text-[12px] font-bold text-gray-700">Status Akun</span>
                  <span className="text-[11px] text-gray-400 font-semibold">
                    Nonaktifkan user yang resign atau tidak aktif
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(prev => (prev === 1 ? 0 : 1))}
                  disabled={user.id === currentUserId}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
                    isActive === 1 ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                  title={user.id === currentUserId ? 'Anda tidak dapat menonaktifkan akun sendiri' : ''}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive === 1 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <><RefreshCw size={15} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={15} /> {isEditing ? 'Simpan Perubahan' : 'Buat Akun'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
