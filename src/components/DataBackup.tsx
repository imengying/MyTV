'use client';

import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { buttonStyles } from '@/features/admin/shared';

interface DataBackupProps {
  onRefreshConfig?: () => Promise<void>;
}

type NoticeState = {
  type: 'success' | 'error' | 'warning';
  text: string;
} | null;

export default function DataBackup({ onRefreshConfig }: DataBackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setNotice(null);

      const response = await fetch('/api/admin/backup/export');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `导出失败: ${response.status}`);
      }

      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'mytv-backup.json';

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setNotice({
        type: 'success',
        text: '备份导出成功，已下载 JSON 文件。',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : '导出失败',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const runImport = async (file: File) => {
    const confirmed = window.confirm(
      '导入会覆盖当前站点数据，确定继续吗？',
    );
    if (!confirmed) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsImporting(true);
      setNotice(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/backup/import', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || `导入失败: ${response.status}`);
      }

      setNotice({
        type: 'success',
        text: '备份导入成功，请刷新页面查看最新数据。',
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onRefreshConfig) {
        await onRefreshConfig();
      }
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : '导入失败',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportClick = () => {
    if (isImporting) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    await runImport(file);
  };

  const noticeClassName =
    notice?.type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200'
      : notice?.type === 'warning'
        ? 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
        : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200';

  return (
    <div className='space-y-4'>
      {notice && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${noticeClassName}`}>
          {notice.text}
        </div>
      )}

      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mb-2 text-base font-semibold text-gray-900 dark:text-gray-100'>
            导出备份
          </h3>
          <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
            导出管理员配置、用户、播放记录、收藏和搜索历史。
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`${isExporting ? buttonStyles.disabled : buttonStyles.success} inline-flex items-center gap-2`}
          >
            <Download className='h-4 w-4' />
            {isExporting ? '导出中…' : '导出 JSON'}
          </button>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mb-2 text-base font-semibold text-gray-900 dark:text-gray-100'>
            导入备份
          </h3>
          <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
            导入会覆盖当前数据，请先自行保留一份备份文件。
          </p>
          <input
            ref={fileInputRef}
            type='file'
            accept='application/json,.json'
            onChange={handleFileChange}
            className='hidden'
            disabled={isImporting}
          />
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className={`${isImporting ? buttonStyles.disabled : buttonStyles.primary} inline-flex items-center gap-2`}
          >
            <Upload className='h-4 w-4' />
            {isImporting ? '导入中…' : '导入 JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}
