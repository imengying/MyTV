'use client';

import { useEffect, useState } from 'react';

interface RuntimeConfig {
  DOUBAN_PROXY_TYPE?: string;
  DOUBAN_PROXY?: string;
  DOUBAN_IMAGE_PROXY_TYPE?: string;
  DOUBAN_IMAGE_PROXY?: string;
  FLUID_SEARCH?: boolean;
}

interface RuntimeWindow extends Window {
  RUNTIME_CONFIG?: RuntimeConfig;
}

const normalizeImageProxyType = (type: string) =>
  type === 'direct' || type === 'img3' ? 'server' : type;

const normalizeDataProxyType = (type: string) =>
  type === 'cors-proxy-zwei' ? 'cmliussss-cdn-tencent' : type;

const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === 'undefined') return {};
  return (window as RuntimeWindow).RUNTIME_CONFIG || {};
};

export const useUserSettings = () => {
  const [defaultAggregateSearch, setDefaultAggregateSearch] = useState(true);
  const [doubanProxyUrl, setDoubanProxyUrl] = useState('');
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [fluidSearch, setFluidSearch] = useState(true);
  const [doubanDataSource, setDoubanDataSource] = useState(
    'cmliussss-cdn-tencent',
  );
  const [doubanImageProxyType, setDoubanImageProxyType] = useState(
    'cmliussss-cdn-tencent',
  );
  const [doubanImageProxyUrl, setDoubanImageProxyUrl] = useState('');
  const [isDoubanDropdownOpen, setIsDoubanDropdownOpen] = useState(false);
  const [isDoubanImageProxyDropdownOpen, setIsDoubanImageProxyDropdownOpen] =
    useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const runtimeConfig = getRuntimeConfig();
    const savedAggregateSearch = localStorage.getItem('defaultAggregateSearch');
    if (savedAggregateSearch !== null) {
      setDefaultAggregateSearch(JSON.parse(savedAggregateSearch));
    }

    const savedDoubanDataSource = localStorage.getItem('doubanDataSource');
    const defaultDoubanProxyType =
      runtimeConfig.DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent';
    if (savedDoubanDataSource !== null) {
      setDoubanDataSource(normalizeDataProxyType(savedDoubanDataSource));
    } else if (defaultDoubanProxyType) {
      setDoubanDataSource(normalizeDataProxyType(defaultDoubanProxyType));
    }

    const savedDoubanProxyUrl = localStorage.getItem('doubanProxyUrl');
    const defaultDoubanProxy = runtimeConfig.DOUBAN_PROXY || '';
    if (savedDoubanProxyUrl !== null) {
      setDoubanProxyUrl(savedDoubanProxyUrl);
    } else if (defaultDoubanProxy) {
      setDoubanProxyUrl(defaultDoubanProxy);
    }

    const savedDoubanImageProxyType = localStorage.getItem(
      'doubanImageProxyType',
    );
    const defaultDoubanImageProxyType =
      runtimeConfig.DOUBAN_IMAGE_PROXY_TYPE || 'cmliussss-cdn-tencent';
    if (savedDoubanImageProxyType !== null) {
      setDoubanImageProxyType(
        normalizeImageProxyType(savedDoubanImageProxyType),
      );
    } else if (defaultDoubanImageProxyType) {
      setDoubanImageProxyType(
        normalizeImageProxyType(defaultDoubanImageProxyType),
      );
    }

    const savedDoubanImageProxyUrl = localStorage.getItem(
      'doubanImageProxyUrl',
    );
    const defaultDoubanImageProxyUrl = runtimeConfig.DOUBAN_IMAGE_PROXY || '';
    if (savedDoubanImageProxyUrl !== null) {
      setDoubanImageProxyUrl(savedDoubanImageProxyUrl);
    } else if (defaultDoubanImageProxyUrl) {
      setDoubanImageProxyUrl(defaultDoubanImageProxyUrl);
    }

    const savedEnableOptimization = localStorage.getItem('enableOptimization');
    if (savedEnableOptimization !== null) {
      setEnableOptimization(JSON.parse(savedEnableOptimization));
    }

    const savedFluidSearch = localStorage.getItem('fluidSearch');
    const defaultFluidSearch = runtimeConfig.FLUID_SEARCH !== false;
    if (savedFluidSearch !== null) {
      setFluidSearch(JSON.parse(savedFluidSearch));
    } else {
      setFluidSearch(defaultFluidSearch);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDoubanDropdownOpen) return;
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="douban-datasource"]')) {
        setIsDoubanDropdownOpen(false);
      }
    };

    if (!isDoubanDropdownOpen) return;
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDoubanDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDoubanImageProxyDropdownOpen) return;
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="douban-image-proxy"]')) {
        setIsDoubanImageProxyDropdownOpen(false);
      }
    };

    if (!isDoubanImageProxyDropdownOpen) return;
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDoubanImageProxyDropdownOpen]);

  const handleAggregateToggle = (value: boolean) => {
    setDefaultAggregateSearch(value);
    localStorage.setItem('defaultAggregateSearch', JSON.stringify(value));
  };

  const handleDoubanProxyUrlChange = (value: string) => {
    setDoubanProxyUrl(value);
    localStorage.setItem('doubanProxyUrl', value);
  };

  const handleOptimizationToggle = (value: boolean) => {
    setEnableOptimization(value);
    localStorage.setItem('enableOptimization', JSON.stringify(value));
  };

  const handleFluidSearchToggle = (value: boolean) => {
    setFluidSearch(value);
    localStorage.setItem('fluidSearch', JSON.stringify(value));
  };

  const handleDoubanDataSourceChange = (value: string) => {
    const normalizedValue = normalizeDataProxyType(value);
    setDoubanDataSource(normalizedValue);
    localStorage.setItem('doubanDataSource', normalizedValue);
  };

  const handleDoubanImageProxyTypeChange = (value: string) => {
    setDoubanImageProxyType(value);
    localStorage.setItem('doubanImageProxyType', value);
  };

  const handleDoubanImageProxyUrlChange = (value: string) => {
    setDoubanImageProxyUrl(value);
    localStorage.setItem('doubanImageProxyUrl', value);
  };

  const handleResetSettings = () => {
    const runtimeConfig = getRuntimeConfig();
    const defaultDoubanProxyType = normalizeDataProxyType(
      runtimeConfig.DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent',
    );
    const defaultDoubanProxy = runtimeConfig.DOUBAN_PROXY || '';
    let defaultDoubanImageProxyType =
      runtimeConfig.DOUBAN_IMAGE_PROXY_TYPE || 'cmliussss-cdn-tencent';
    if (
      defaultDoubanImageProxyType === 'direct' ||
      defaultDoubanImageProxyType === 'img3'
    ) {
      defaultDoubanImageProxyType = 'server';
    }
    const defaultDoubanImageProxyUrl = runtimeConfig.DOUBAN_IMAGE_PROXY || '';
    const defaultFluidSearch = runtimeConfig.FLUID_SEARCH !== false;

    setDefaultAggregateSearch(true);
    setEnableOptimization(true);
    setFluidSearch(defaultFluidSearch);
    setDoubanProxyUrl(defaultDoubanProxy);
    setDoubanDataSource(defaultDoubanProxyType);
    setDoubanImageProxyType(defaultDoubanImageProxyType);
    setDoubanImageProxyUrl(defaultDoubanImageProxyUrl);

    localStorage.setItem('defaultAggregateSearch', JSON.stringify(true));
    localStorage.setItem('enableOptimization', JSON.stringify(true));
    localStorage.setItem('fluidSearch', JSON.stringify(defaultFluidSearch));
    localStorage.setItem('doubanProxyUrl', defaultDoubanProxy);
    localStorage.setItem('doubanDataSource', defaultDoubanProxyType);
    localStorage.setItem('doubanImageProxyType', defaultDoubanImageProxyType);
    localStorage.setItem('doubanImageProxyUrl', defaultDoubanImageProxyUrl);
  };

  return {
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
  };
};
