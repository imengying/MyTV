export interface ConfigSubscription {
  URL: string;
  AutoUpdate: boolean;
  LastCheck: string;
}

export const DEFAULT_CONFIG_SUBSCRIPTION: ConfigSubscription = {
  URL: '',
  AutoUpdate: false,
  LastCheck: '',
};

export interface AdminConfig {
  ConfigSubscription: ConfigSubscription;
  ConfigFile: string;
  SiteConfig: {
    SiteName: string;
    Announcement: string;
    SearchDownstreamMaxPage: number;
    SiteInterfaceCacheTime: number;
    DoubanProxyType: string;
    DoubanProxy: string;
    DoubanImageProxyType: string;
    DoubanImageProxy: string;
    DisableYellowFilter: boolean;
    FluidSearch: boolean;
  };
  UserConfig: {
    Users: {
      username: string;
      role: 'user' | 'admin' | 'owner';
      banned?: boolean;
      enabledApis?: string[]; // 优先级高于tags限制
      tags?: string[]; // 多 tags 取并集限制
    }[];
    Tags?: {
      name: string;
      enabledApis: string[];
    }[];
  };
  SourceConfig: {
    key: string;
    name: string;
    api: string;
    detail?: string;
    from: 'config' | 'custom';
    disabled?: boolean;
  }[];
}

export interface AdminConfigResult {
  Role: 'owner' | 'admin';
  Config: AdminConfig;
}
