/* eslint-disable no-console */

'use client';

import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';
import { ChangePasswordPanel } from '@/features/user-menu/change-password-panel';
import { UserMenuPanel } from '@/features/user-menu/menu-panel';
import { UserSettingsPanel } from '@/features/user-menu/settings-panel';
import { useUserMenuMeta } from '@/features/user-menu/use-user-menu-meta';
import { useUserSettings } from '@/features/user-menu/use-user-settings';

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Body 滚动锁定 - 使用 overflow 方式避免布局问题
  useEffect(() => {
    if (isSettingsOpen || isChangePasswordOpen) {
      const body = document.body;
      const html = document.documentElement;

      // 保存原始样式
      const originalBodyOverflow = body.style.overflow;
      const originalHtmlOverflow = html.style.overflow;

      // 只设置 overflow 来阻止滚动
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';

      return () => {
        // 恢复所有原始样式
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isSettingsOpen, isChangePasswordOpen]);

  // 修改密码相关状态
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { authInfo, mounted } = useUserMenuMeta();
  const {
    defaultAggregateSearch,
    doubanProxyUrl,
    enableOptimization,
    fluidSearch,
    doubanDataSource,
    doubanImageProxyType,
    doubanImageProxyUrl,
    isDoubanDropdownOpen,
    isDoubanImageProxyDropdownOpen,
    setIsDoubanDropdownOpen,
    setIsDoubanImageProxyDropdownOpen,
    handleAggregateToggle,
    handleDoubanProxyUrlChange,
    handleOptimizationToggle,
    handleFluidSearchToggle,
    handleDoubanDataSourceChange,
    handleDoubanImageProxyTypeChange,
    handleDoubanImageProxyUrlChange,
    handleResetSettings,
  } = useUserSettings();

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('注销请求失败:', error);
    }
    window.location.href = '/';
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    setIsChangePasswordOpen(true);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleCloseChangePassword = () => {
    setIsChangePasswordOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleSubmitChangePassword = async () => {
    setPasswordError('');

    // 验证密码
    if (!newPassword) {
      setPasswordError('新密码不得为空');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || '修改密码失败');
        return;
      }

      // 修改成功，关闭弹窗并登出
      setIsChangePasswordOpen(false);
      await handleLogout();
    } catch {
      setPasswordError('网络错误，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  // 检查是否显示管理面板按钮
  const showAdminPanel =
    authInfo?.role === 'owner' || authInfo?.role === 'admin';

  // 检查是否显示修改密码按钮
  const showChangePassword = authInfo?.role !== 'owner';

  return (
    <>
      <div className='relative'>
        <button
          onClick={handleMenuClick}
          className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors'
          aria-label='User Menu'
        >
          <User className='w-full h-full' />
        </button>
      </div>

      {mounted && (
        <UserMenuPanel
          isOpen={isOpen}
          authInfo={authInfo}
          currentVersion={CURRENT_VERSION}
          onClose={handleCloseMenu}
          onOpenSettings={handleSettings}
          onOpenAdminPanel={handleAdminPanel}
          onOpenChangePassword={handleChangePassword}
          onLogout={handleLogout}
          showAdminPanel={showAdminPanel}
          showChangePassword={showChangePassword}
        />
      )}

      {mounted && (
        <UserSettingsPanel
          isOpen={isSettingsOpen}
          onClose={handleCloseSettings}
          onResetSettings={handleResetSettings}
          defaultAggregateSearch={defaultAggregateSearch}
          enableOptimization={enableOptimization}
          fluidSearch={fluidSearch}
          doubanDataSource={doubanDataSource}
          doubanProxyUrl={doubanProxyUrl}
          doubanImageProxyType={doubanImageProxyType}
          doubanImageProxyUrl={doubanImageProxyUrl}
          isDoubanDropdownOpen={isDoubanDropdownOpen}
          isDoubanImageProxyDropdownOpen={isDoubanImageProxyDropdownOpen}
          setIsDoubanDropdownOpen={setIsDoubanDropdownOpen}
          setIsDoubanImageProxyDropdownOpen={setIsDoubanImageProxyDropdownOpen}
          onAggregateToggle={handleAggregateToggle}
          onOptimizationToggle={handleOptimizationToggle}
          onFluidSearchToggle={handleFluidSearchToggle}
          onDoubanDataSourceChange={handleDoubanDataSourceChange}
          onDoubanProxyUrlChange={handleDoubanProxyUrlChange}
          onDoubanImageProxyTypeChange={handleDoubanImageProxyTypeChange}
          onDoubanImageProxyUrlChange={handleDoubanImageProxyUrlChange}
        />
      )}

      {mounted && (
        <ChangePasswordPanel
          isOpen={isChangePasswordOpen}
          onClose={handleCloseChangePassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordLoading={passwordLoading}
          passwordError={passwordError}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleSubmitChangePassword}
        />
      )}
    </>
  );
};
