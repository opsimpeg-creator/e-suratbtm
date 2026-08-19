import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { hashPassword, isSha256 } from '../../services/hashUtils';
import { Users, Plus, ShieldCheck, UserCheck, Trash2, X, Key, Eye, EyeOff, Lock, Check, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
  onRefresh: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onRefresh }) => {
  const [usersList, setUsersList] = useState<User[]>(() => StorageService.getUsers());

  useEffect(() => {
    setUsersList(StorageService.getUsers());
  }, []);

  const refreshUsers = () => {
    const updatedUsers = StorageService.getUsers();
    setUsersList(updatedUsers);
    onRefresh();
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('admin_tu');

  // Reset Password State
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Delete User State Modal
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name || !password) return;

    const hashedPassword = await hashPassword(password.trim());

    const newUser: User = {
      id: 'u-' + Date.now(),
      username: username.trim(),
      password: hashedPassword,
      name,
      email,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const currentList = StorageService.getUsers();
    currentList.push(newUser);
    StorageService.saveUsers(currentList);
    StorageService.addAuditLog(currentUser.username, 'TAMBAH_USER', `Menambahkan akun baru: ${username} (${role})`);
    refreshUsers();
    setModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      setUserToDelete(null);
      return;
    }

    StorageService.deleteUser(userToDelete.id);
    setUserToDelete(null);
    refreshUsers();
  };

  const handleToggleStatus = (targetUser: User) => {
    if (targetUser.id === currentUser.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }
    StorageService.toggleUserStatus(targetUser.id);
    refreshUsers();
  };

  const handleOpenResetPassword = (userToReset: User) => {
    setResetUser(userToReset);
    setNewPassword('');
    setShowNewPassword(false);
    setResetSuccess(false);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword.trim()) return;

    const hashedPassword = await hashPassword(newPassword.trim());
    StorageService.updateUserPassword(resetUser.id, hashedPassword);
    setResetSuccess(true);
    setTimeout(() => {
      setResetUser(null);
      setResetSuccess(false);
      refreshUsers();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Akses Pengguna & Role</span>
          <h2 className="text-xl font-extrabold text-slate-900">Manajemen Pengguna Internal</h2>
          <p className="text-xs text-slate-500">
            Atur perizinan hak akses dan kelola password login untuk Super Admin, Admin Tata Usaha, dan Operator Loket.
          </p>
        </div>

        <button
          onClick={() => {
            setUsername('');
            setPassword('admin123');
            setShowPassword(false);
            setName('');
            setEmail('');
            setRole('admin_tu');
            setModalOpen(true);
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Staf Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usersList.map((u) => (
          <div key={u.id} className={`bg-white p-6 rounded-3xl border ${u.status === 'inactive' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'} shadow-xs space-y-4 flex flex-col justify-between hover:border-blue-300 transition-all`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={u.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{u.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                      {u.status === 'inactive' ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Non-Aktif
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Aktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Email:</span>
                  <span className="font-medium text-slate-700">{u.email || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Keamanan Password:</span>
                  {isSha256(u.password) ? (
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Terenkripsi (SHA-256)
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                      Teks Biasa (Belum Dihash)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenResetPassword(u)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1 transition-all text-xs"
                  title="Reset / Ubah Password User"
                >
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reset</span>
                </button>

                {u.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                      u.status === 'inactive'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                    title={u.status === 'inactive' ? 'Aktifkan Akun' : 'Non-Aktifkan Akun'}
                  >
                    {u.status === 'inactive' ? <ToggleRight className="w-4 h-4 text-emerald-700" /> : <ToggleLeft className="w-4 h-4 text-amber-700" />}
                    <span>{u.status === 'inactive' ? 'Aktifkan' : 'Non-Aktif'}</span>
                  </button>
                )}
              </div>

              {u.id !== currentUser.id ? (
                <button
                  type="button"
                  onClick={() => setUserToDelete(u)}
                  className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-all font-bold"
                  title="Hapus Akun Pengguna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Akun Anda</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Akun Pengguna */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Tambah Akun Pengguna</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                  placeholder="Contoh: budi_tu"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password Login *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 font-mono font-bold text-blue-700"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default password disaranan: admin123</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Staf *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                  placeholder="Contoh: Budi Santoso, S.Kom"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Staf</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  placeholder="staf@smkn1batumandi.sch.id"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Hak Akses *</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                  <option value="admin_tu">Admin Tata Usaha (Kelola Surat)</option>
                  <option value="operator">Operator Loket (Proses Surat)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold shadow-md">
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset / Change Password */}
      {resetUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Reset Password Login</h3>
                  <p className="text-[11px] text-slate-500">{resetUser.name} (@{resetUser.username})</p>
                </div>
              </div>
              <button onClick={() => setResetUser(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-bold text-xs animate-fade-in">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password berhasil diperbarui & disinkronkan ke Google Spreadsheet!</span>
              </div>
            ) : (
              <form onSubmit={handleSaveResetPassword} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password Baru *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-blue-700 text-sm"
                      placeholder="Masukkan password baru"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Password baru ini akan langsung berlaku untuk login pengguna ini.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetUser(null)}
                    className="px-4 py-2 rounded-xl border text-slate-700 font-bold"
                  >
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md">
                    Simpan Password Baru
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Akun */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-4 text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Hapus Akun Pengguna?</h3>
                  <p className="text-[11px] text-slate-500">Konfirmasi Penghapusan Akun Staf</p>
                </div>
              </div>
              <button onClick={() => setUserToDelete(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 text-xs leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong className="text-slate-900">{userToDelete.name}</strong> (<span className="font-mono text-blue-700">@{userToDelete.username}</span>)?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Peringatan Dampak Penghapusan:
                </p>
                <ul className="list-disc list-inside text-[10px] space-y-0.5 text-amber-700">
                  <li>Pengguna tidak akan bisa login lagi ke sistem.</li>
                  <li>Data akun akan dihapus dari penyimpanan lokal dan disinkronkan ke Google Spreadsheet.</li>
                  <li>Sebagai alternatif, Anda juga dapat memilih opsi <strong>"Non-Aktif"</strong> untuk menangguhkan akses sementara tanpa menghapus akun.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

