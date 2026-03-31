'use client';

import {
  SettingsSelect,
  SettingsTextInput,
} from '@/features/user-menu/settings-controls';

const doubanDataSourceOptions = [
  { value: 'direct', label: '直连（服务器直接请求豆瓣）' },
  { value: 'cors-proxy-zwei', label: 'Cors Proxy By Zwei' },
  {
    value: 'cmliussss-cdn-tencent',
    label: '豆瓣 CDN By CMLiussss（腾讯云）',
  },
  { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
  { value: 'custom', label: '自定义代理' },
];

const doubanImageProxyTypeOptions = [
  { value: 'server', label: '服务器代理（由服务器代理请求豆瓣）' },
  {
    value: 'cmliussss-cdn-tencent',
    label: '豆瓣 CDN By CMLiussss（腾讯云）',
  },
  { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
  { value: 'custom', label: '自定义代理' },
];

const getThanksInfo = (dataSource: string) => {
  switch (dataSource) {
    case 'cors-proxy-zwei':
      return {
        text: 'Thanks to @Zwei',
        url: 'https://github.com/bestzwei',
      };
    case 'cmliussss-cdn-tencent':
    case 'cmliussss-cdn-ali':
      return {
        text: 'Thanks to @CMLiussss',
        url: 'https://github.com/cmliu',
      };
    default:
      return null;
  }
};

interface DoubanDataProxySectionProps {
  value: string;
  proxyUrl: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onChange: (value: string) => void;
  onProxyUrlChange: (value: string) => void;
}

export const DoubanDataProxySection = ({
  value,
  proxyUrl,
  isOpen,
  setIsOpen,
  onChange,
  onProxyUrlChange,
}: DoubanDataProxySectionProps) => (
  <>
    <SettingsSelect
      dropdownKey='douban-datasource'
      title='豆瓣数据代理'
      description='选择获取豆瓣数据的方式'
      value={value}
      options={doubanDataSourceOptions}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onChange={onChange}
      thanksInfo={getThanksInfo(value)}
    />

    {value === 'custom' && (
      <SettingsTextInput
        title='豆瓣代理地址'
        description='自定义代理服务器地址'
        placeholder='例如: https://proxy.example.com/fetch?url='
        value={proxyUrl}
        onChange={onProxyUrlChange}
      />
    )}
  </>
);

interface DoubanImageProxySectionProps {
  value: string;
  proxyUrl: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onChange: (value: string) => void;
  onProxyUrlChange: (value: string) => void;
}

export const DoubanImageProxySection = ({
  value,
  proxyUrl,
  isOpen,
  setIsOpen,
  onChange,
  onProxyUrlChange,
}: DoubanImageProxySectionProps) => (
  <>
    <SettingsSelect
      dropdownKey='douban-image-proxy'
      title='豆瓣图片代理'
      description='选择获取豆瓣图片的方式'
      value={value}
      options={doubanImageProxyTypeOptions}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onChange={onChange}
      thanksInfo={getThanksInfo(value)}
    />

    {value === 'custom' && (
      <SettingsTextInput
        title='豆瓣图片代理地址'
        description='自定义图片代理服务器地址'
        placeholder='例如: https://proxy.example.com/fetch?url='
        value={proxyUrl}
        onChange={onProxyUrlChange}
      />
    )}
  </>
);
