'use client';

import { CenteredPanelPortal, PanelHeader } from '@/features/user-menu/shared';

interface ChangePasswordPanelProps {
  isOpen: boolean;
  onClose: () => void;
  newPassword: string;
  confirmPassword: string;
  passwordLoading: boolean;
  passwordError: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export const ChangePasswordPanel = ({
  isOpen,
  onClose,
  newPassword,
  confirmPassword,
  passwordLoading,
  passwordError,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: ChangePasswordPanelProps) => {
  return (
    <CenteredPanelPortal isOpen={isOpen} onClose={onClose} maxWidthClassName='max-w-md'>
      <PanelHeader title='修改密码' onClose={onClose} />

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            新密码
          </label>
          <input
            type='password'
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
            placeholder='请输入新密码'
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            disabled={passwordLoading}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            确认密码
          </label>
          <input
            type='password'
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
            placeholder='请再次输入新密码'
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            disabled={passwordLoading}
          />
        </div>

        {passwordError && (
          <div className='text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800'>
            {passwordError}
          </div>
        )}
      </div>

      <div className='flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
        <button
          onClick={onClose}
          className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors'
          disabled={passwordLoading}
        >
          取消
        </button>
        <button
          onClick={onSubmit}
          className='flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={passwordLoading || !newPassword || !confirmPassword}
        >
          {passwordLoading ? '修改中...' : '确认修改'}
        </button>
      </div>

      <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
        <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
          修改密码后需要重新登录
        </p>
      </div>
    </CenteredPanelPortal>
  );
};
