'use client';

import { AdminModalShell, buttonStyles } from '@/features/admin/shared';

interface ResetConfigModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfigModal = ({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: ResetConfigModalProps) => {
  return (
    <AdminModalShell isOpen={isOpen} title='确认重置配置' onClose={onClose}>
      <div className='mb-6'>
        <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4'>
          <div className='flex items-center space-x-2 mb-2'>
            <svg
              className='w-5 h-5 text-yellow-600 dark:text-yellow-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span className='text-sm font-medium text-yellow-800 dark:text-yellow-300'>
              ⚠️ 危险操作警告
            </span>
          </div>
          <p className='text-sm text-yellow-700 dark:text-yellow-400'>
            此操作将重置用户封禁和管理员设置、自定义视频源，站点配置将重置为默认值，是否继续？
          </p>
        </div>
      </div>

      <div className='flex justify-end space-x-3'>
        <button
          onClick={onClose}
          className={`px-6 py-2.5 text-sm font-medium ${buttonStyles.secondary}`}
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-6 py-2.5 text-sm font-medium ${isLoading ? buttonStyles.disabled : buttonStyles.danger}`}
        >
          {isLoading ? '重置中...' : '确认重置'}
        </button>
      </div>
    </AdminModalShell>
  );
};
