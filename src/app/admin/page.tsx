'use client';

import { Database, FileText, Settings, Users, Video } from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { AdminConfig, AdminConfigResult } from '@/lib/admin.types';

import DataBackup from '@/components/DataBackup';
import PageLayout from '@/components/PageLayout';

import { ResetConfigModal } from '@/features/admin/reset-config-modal';
import {
  ConfigFileComponent,
  SiteConfigComponent,
} from '@/features/admin/settings-sections';
import {
  AlertModal,
  buttonStyles,
  CollapsibleTab,
  showError,
  showSuccess,
  useAlertModal,
  useLoadingState,
} from '@/features/admin/shared';
import { UserConfig } from '@/features/admin/user-config';
import { VideoSourceConfig } from '@/features/admin/video-source-config';

interface ErrorResponse {
  error?: string;
}

// 新增配置文件组件
function AdminPageClient() {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [showResetConfigModal, setShowResetConfigModal] = useState(false);
  const [expandedTabs, setExpandedTabs] = useState<{ [key: string]: boolean }>({
    userConfig: false,
    videoSource: false,
    siteConfig: false,
    configFile: false,
    dataBackup: false,
  });

  // 获取管理员配置
  // showLoading 用于控制是否在请求期间显示整体加载骨架。
  const fetchConfig = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await fetch(`/api/admin/config`);

        if (!response.ok) {
          const data = (await response.json()) as ErrorResponse;
          throw new Error(`获取配置失败: ${data.error}`);
        }

        const data = (await response.json()) as AdminConfigResult;
        setConfig(data.Config);
        setRole(data.Role);
        setCurrentUsername(data.CurrentUsername);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '获取配置失败';
        showError(msg, showAlert);
        setError(msg);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [showAlert],
  );

  useEffect(() => {
    // 首次加载时显示骨架
    fetchConfig(true);
  }, [fetchConfig]);

  // 切换标签展开状态
  const toggleTab = (tabKey: string) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [tabKey]: !prev[tabKey],
    }));
  };

  // 新增: 重置配置处理函数
  const handleResetConfig = () => {
    setShowResetConfigModal(true);
  };

  const handleConfirmResetConfig = async () => {
    await withLoading('resetConfig', async () => {
      try {
        const response = await fetch(`/api/admin/reset`);
        if (!response.ok) {
          throw new Error(`重置失败: ${response.status}`);
        }
        showSuccess('重置成功，请刷新页面！', showAlert);
        await fetchConfig();
        setShowResetConfigModal(false);
      } catch (err) {
        showError(err instanceof Error ? err.message : '重置失败', showAlert);
        throw err;
      }
    });
  };

  if (loading) {
    return (
      <PageLayout activePath='/admin'>
        <div className='px-2 sm:px-10 py-4 sm:py-8'>
          <div className='max-w-[95%] mx-auto'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8'>
              管理员设置
            </h1>
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className='h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse'
                />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    // 错误已通过弹窗展示，此处直接返回空
    return null;
  }

  return (
    <PageLayout activePath='/admin'>
      <div className='px-2 sm:px-10 py-4 sm:py-8'>
        <div className='max-w-[95%] mx-auto'>
          {/* 标题 + 重置配置按钮 */}
          <div className='flex items-center gap-2 mb-8'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              管理员设置
            </h1>
            {config && role === 'owner' && (
              <button
                onClick={handleResetConfig}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${buttonStyles.dangerSmall}`}
              >
                重置配置
              </button>
            )}
          </div>

          {/* 配置文件标签 - 仅站长可见 */}
          {role === 'owner' && (
            <CollapsibleTab
              title='配置文件'
              icon={
                <FileText
                  size={20}
                  className='text-gray-600 dark:text-gray-400'
                />
              }
              isExpanded={expandedTabs.configFile}
              onToggle={() => toggleTab('configFile')}
            >
              <ConfigFileComponent
                config={config}
                refreshConfig={fetchConfig}
              />
            </CollapsibleTab>
          )}

          {/* 站点配置标签 */}
          <CollapsibleTab
            title='站点配置'
            icon={
              <Settings
                size={20}
                className='text-gray-600 dark:text-gray-400'
              />
            }
            isExpanded={expandedTabs.siteConfig}
            onToggle={() => toggleTab('siteConfig')}
          >
            <SiteConfigComponent config={config} refreshConfig={fetchConfig} />
          </CollapsibleTab>

          <div className='space-y-4'>
            {/* 用户配置标签 */}
            <CollapsibleTab
              title='用户配置'
              icon={
                <Users size={20} className='text-gray-600 dark:text-gray-400' />
              }
              isExpanded={expandedTabs.userConfig}
              onToggle={() => toggleTab('userConfig')}
            >
              <UserConfig
                config={config}
                currentUsername={currentUsername}
                role={role}
                refreshConfig={fetchConfig}
              />
            </CollapsibleTab>

            {/* 视频源配置标签 */}
            <CollapsibleTab
              title='视频源配置'
              icon={
                <Video size={20} className='text-gray-600 dark:text-gray-400' />
              }
              isExpanded={expandedTabs.videoSource}
              onToggle={() => toggleTab('videoSource')}
            >
              <VideoSourceConfig config={config} refreshConfig={fetchConfig} />
            </CollapsibleTab>

            {role === 'owner' && (
              <CollapsibleTab
                title='数据备份'
                icon={
                  <Database
                    size={20}
                    className='text-gray-600 dark:text-gray-400'
                  />
                }
                isExpanded={expandedTabs.dataBackup}
                onToggle={() => toggleTab('dataBackup')}
              >
                <DataBackup onRefreshConfig={fetchConfig} />
              </CollapsibleTab>
            )}
          </div>
        </div>
      </div>

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />

      <ResetConfigModal
        isOpen={showResetConfigModal}
        isLoading={isLoading('resetConfig')}
        onClose={() => setShowResetConfigModal(false)}
        onConfirm={handleConfirmResetConfig}
      />
    </PageLayout>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageClient />
    </Suspense>
  );
}
