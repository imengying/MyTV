'use client';

import {
  DoubanDataProxySection,
  DoubanImageProxySection,
} from '@/features/user-menu/proxy-settings';
import { SettingsToggleRow } from '@/features/user-menu/settings-controls';
import { CenteredPanelPortal, PanelHeader } from '@/features/user-menu/shared';

interface UserSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSettings: () => void;
  defaultAggregateSearch: boolean;
  enableOptimization: boolean;
  fluidSearch: boolean;
  doubanDataSource: string;
  doubanProxyUrl: string;
  doubanImageProxyType: string;
  doubanImageProxyUrl: string;
  isDoubanDropdownOpen: boolean;
  isDoubanImageProxyDropdownOpen: boolean;
  setIsDoubanDropdownOpen: (value: boolean) => void;
  setIsDoubanImageProxyDropdownOpen: (value: boolean) => void;
  onAggregateToggle: (value: boolean) => void;
  onOptimizationToggle: (value: boolean) => void;
  onFluidSearchToggle: (value: boolean) => void;
  onDoubanDataSourceChange: (value: string) => void;
  onDoubanProxyUrlChange: (value: string) => void;
  onDoubanImageProxyTypeChange: (value: string) => void;
  onDoubanImageProxyUrlChange: (value: string) => void;
}

export const UserSettingsPanel = ({
  isOpen,
  onClose,
  onResetSettings,
  defaultAggregateSearch,
  enableOptimization,
  fluidSearch,
  doubanDataSource,
  doubanProxyUrl,
  doubanImageProxyType,
  doubanImageProxyUrl,
  isDoubanDropdownOpen,
  isDoubanImageProxyDropdownOpen,
  setIsDoubanDropdownOpen,
  setIsDoubanImageProxyDropdownOpen,
  onAggregateToggle,
  onOptimizationToggle,
  onFluidSearchToggle,
  onDoubanDataSourceChange,
  onDoubanProxyUrlChange,
  onDoubanImageProxyTypeChange,
  onDoubanImageProxyUrlChange,
}: UserSettingsPanelProps) => {
  return (
    <CenteredPanelPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName='max-w-xl max-h-[90vh]'
      containerClassName='flex flex-col'
      contentClassName='flex-1 p-6 overflow-y-auto'
    >
      <PanelHeader
        title='本地设置'
        onClose={onClose}
        action={
          <button
            onClick={onResetSettings}
            className='px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors'
            title='重置为默认设置'
          >
            恢复默认
          </button>
        }
      />

      <div className='space-y-6'>
        <DoubanDataProxySection
          value={doubanDataSource}
          proxyUrl={doubanProxyUrl}
          isOpen={isDoubanDropdownOpen}
          setIsOpen={setIsDoubanDropdownOpen}
          onChange={onDoubanDataSourceChange}
          onProxyUrlChange={onDoubanProxyUrlChange}
        />

        <div className='border-t border-gray-200 dark:border-gray-700'></div>

        <DoubanImageProxySection
          value={doubanImageProxyType}
          proxyUrl={doubanImageProxyUrl}
          isOpen={isDoubanImageProxyDropdownOpen}
          setIsOpen={setIsDoubanImageProxyDropdownOpen}
          onChange={onDoubanImageProxyTypeChange}
          onProxyUrlChange={onDoubanImageProxyUrlChange}
        />

        <div className='border-t border-gray-200 dark:border-gray-700'></div>

        <SettingsToggleRow
          title='默认聚合搜索结果'
          description='搜索时默认按标题和年份聚合显示结果'
          checked={defaultAggregateSearch}
          onChange={onAggregateToggle}
        />

        <SettingsToggleRow
          title='优选和测速'
          description='如出现播放器劫持问题可关闭'
          checked={enableOptimization}
          onChange={onOptimizationToggle}
        />

        <SettingsToggleRow
          title='流式搜索输出'
          description='启用搜索结果实时流式输出，关闭后使用传统一次性搜索'
          checked={fluidSearch}
          onChange={onFluidSearchToggle}
        />
      </div>

      <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
        <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
          这些设置保存在本地浏览器中
        </p>
      </div>
    </CenteredPanelPortal>
  );
};
