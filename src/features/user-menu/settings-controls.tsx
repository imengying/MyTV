'use client';

import { Check, ChevronDown, ExternalLink } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface ThanksInfo {
  text: string;
  url: string;
}

interface SettingsSectionHeaderProps {
  title: string;
  description: string;
}

export const SettingsSectionHeader = ({
  title,
  description,
}: SettingsSectionHeaderProps) => (
  <div>
    <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
      {title}
    </h4>
    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
      {description}
    </p>
  </div>
);

interface SettingsSelectProps {
  dropdownKey: string;
  title: string;
  description: string;
  value: string;
  options: SelectOption[];
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onChange: (value: string) => void;
  thanksInfo?: ThanksInfo | null;
}

export const SettingsSelect = ({
  dropdownKey,
  title,
  description,
  value,
  options,
  isOpen,
  setIsOpen,
  onChange,
  thanksInfo,
}: SettingsSelectProps) => (
  <div className='space-y-3'>
    <SettingsSectionHeader title={title} description={description} />

    <div className='relative' data-dropdown={dropdownKey}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xs hover:border-gray-400 dark:hover:border-gray-500 text-left'
      >
        {options.find((option) => option.value === value)?.label}
      </button>

      <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className='absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto'>
          {options.map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors duration-150 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${
                value === option.value
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              <span className='truncate'>{option.label}</span>
              {value === option.value && (
                <Check className='w-4 h-4 text-green-600 dark:text-green-400 shrink-0 ml-2' />
              )}
            </button>
          ))}
        </div>
      )}
    </div>

    {thanksInfo && (
      <div className='mt-3'>
        <button
          type='button'
          onClick={() => window.open(thanksInfo.url, '_blank')}
          className='flex items-center justify-center gap-1.5 w-full px-3 text-xs text-gray-500 dark:text-gray-400 cursor-pointer'
        >
          <span className='font-medium'>{thanksInfo.text}</span>
          <ExternalLink className='w-3.5 opacity-70' />
        </button>
      </div>
    )}
  </div>
);

interface SettingsTextInputProps {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const SettingsTextInput = ({
  title,
  description,
  placeholder,
  value,
  onChange,
}: SettingsTextInputProps) => (
  <div className='space-y-3'>
    <SettingsSectionHeader title={title} description={description} />
    <input
      type='text'
      className='w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-xs hover:border-gray-400 dark:hover:border-gray-500'
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

interface SettingsToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const SettingsToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: SettingsToggleRowProps) => (
  <div className='flex items-center justify-between'>
    <SettingsSectionHeader title={title} description={description} />
    <label className='flex items-center cursor-pointer'>
      <div className='relative'>
        <input
          type='checkbox'
          className='sr-only peer'
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600'></div>
        <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5'></div>
      </div>
    </label>
  </div>
);
