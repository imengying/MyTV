'use client';

import { KeyRound, LogOut, Settings, Shield } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AuthInfoLike {
  username?: string;
  role?: 'owner' | 'admin' | 'user';
}

interface UserMenuPanelProps {
  isOpen: boolean;
  authInfo: AuthInfoLike | null;
  currentVersion: string;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenAdminPanel: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  showAdminPanel: boolean;
  showChangePassword: boolean;
}

const getRoleText = (role?: string) => {
  switch (role) {
    case 'owner':
      return '站长';
    case 'admin':
      return '管理员';
    case 'user':
      return '用户';
    default:
      return '';
  }
};

export const UserMenuPanel = ({
  isOpen,
  authInfo,
  currentVersion,
  onClose,
  onOpenSettings,
  onOpenAdminPanel,
  onOpenChangePassword,
  onLogout,
  showAdminPanel,
  showChangePassword,
}: UserMenuPanelProps) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className='fixed inset-0 bg-transparent z-1000' onClick={onClose} />

      <div className='fixed top-14 right-4 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-1001 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden select-none'>
        <div className='px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50'>
          <div className='space-y-1'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                当前用户
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  (authInfo?.role || 'user') === 'owner'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : (authInfo?.role || 'user') === 'admin'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                {getRoleText(authInfo?.role || 'user')}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div className='font-semibold text-gray-900 dark:text-gray-100 text-sm truncate'>
                {authInfo?.username || 'default'}
              </div>
              <div className='text-[10px] text-gray-400 dark:text-gray-500'>
                数据同步：PostgreSQL
              </div>
            </div>
          </div>
        </div>

        <div className='py-1'>
          <button
            onClick={onOpenSettings}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
          >
            <Settings className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='font-medium'>设置</span>
          </button>

          {showAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
            >
              <Shield className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='font-medium'>管理面板</span>
            </button>
          )}

          {showChangePassword && (
            <button
              onClick={onOpenChangePassword}
              className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
            >
              <KeyRound className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='font-medium'>修改密码</span>
            </button>
          )}

          <div className='my-1 border-t border-gray-200 dark:border-gray-700'></div>

          <button
            onClick={onLogout}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm'
          >
            <LogOut className='w-4 h-4' />
            <span className='font-medium'>登出</span>
          </button>

          <div className='my-1 border-t border-gray-200 dark:border-gray-700'></div>

          <div className='w-full px-3 py-2 text-center text-gray-500 dark:text-gray-400 text-xs'>
            <span className='font-mono'>v{currentVersion}</span>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
