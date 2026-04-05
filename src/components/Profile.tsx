import React, { useState, useRef } from 'react';
import { UserCircle, Save, Loader2, Camera, Upload } from 'lucide-react';
import { AdminUserRecord } from '../types';
import { apiService } from '../services/api';

interface ProfileProps {
  admin: AdminUserRecord;
  onUpdateProfile: (newName: string, profileImage?: string) => Promise<void>;
}

export function Profile({ admin, onUpdateProfile }: ProfileProps) {
  const [name, setName] = useState(admin.userName);
  const [profileImage, setProfileImage] = useState(admin.profileImage);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const imageUrl = await apiService.uploadProfileImage(admin.rowId, base64, file.name, file.type);
          setProfileImage(imageUrl);
        } catch (err) {
          console.error('Upload failed:', err);
          alert('ছবি আপলোড করতে ব্যর্থ হয়েছে!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateProfile(name, profileImage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-200">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400">
                  <UserCircle size={48} />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Camera size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">User Profile</h2>
            <p className="text-slate-500">Manage your personal information.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">User ID (Email)</label>
            <input
              type="text"
              value={admin.userId}
              disabled
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">User Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
            <input
              type="text"
              value={admin.role}
              disabled
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || (name === admin.userName && profileImage === admin.profileImage)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
