import React, { useEffect, useState } from 'react';
import { Upload, FileCode, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Button } from './ui/Button';

export const FileView: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.listFiles();
      setFiles(res.files || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple validation (e.g. max 5MB)
    if (file.size > 50 * 1024 * 1024) {
		alert('File too large (Max 5MB)');
		e.target.value = ''; // 立即重置
		return;
	}

    setUploading(true);
    try {
      await api.uploadFile(file);
      await fetchFiles();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`Delete ${fileName}?`)) return;
    try {
      await api.deleteFile({ file_name: fileName });
      setFiles(prev => prev.filter(f => f !== fileName));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Script Repository</h1>
          <p className="text-slate-500 mt-1">Upload and manage shell scripts for your tasks.</p>
        </div>
        <div className="flex space-x-2">
            <Button variant="secondary" onClick={fetchFiles} title="Refresh">
                <RefreshCw size={18} />
            </Button>
            <div className="relative">
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                />
                <Button 
                    isLoading={uploading}
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Script
                </Button>
            </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="mx-auto h-12 w-12 text-slate-400 mb-4">
            <Upload />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No scripts uploaded</h3>
          <p className="text-slate-500 mt-1 mb-4">Upload .sh files to use in your tasks.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-slate-100">
                {files.map((file, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <FileCode size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">{file}</h4>
                                <span className="text-xs text-slate-500">Shell Script</span>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            className="text-slate-400 hover:text-red-600"
                            onClick={() => handleDelete(file)}
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
