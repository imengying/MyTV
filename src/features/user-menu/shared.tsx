'use client';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { type ReactNode } from 'react';

interface CenteredPanelPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
  overlayClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
}

export const CenteredPanelPortal = ({
  isOpen,
  onClose,
  children,
  maxWidthClassName = 'max-w-md',
  overlayClassName = 'bg-black/50 backdrop-blur-xs',
  containerClassName = '',
  contentClassName = 'h-full p-6',
}: CenteredPanelPortalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-1000 ${overlayClassName}`}
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
      />

      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${maxWidthClassName} bg-white dark:bg-gray-900 rounded-xl shadow-xl z-1001 overflow-hidden ${containerClassName}`}
      >
        <div
          className={contentClassName}
          data-panel-content
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          style={{ touchAction: 'auto' }}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
};

interface PanelHeaderProps {
  title: string;
  onClose: () => void;
  action?: ReactNode;
}

export const PanelHeader = ({ title, onClose, action }: PanelHeaderProps) => {
  return (
    <div className='flex items-center justify-between mb-6'>
      <div className='flex items-center gap-3'>
        <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
          {title}
        </h3>
        {action}
      </div>
      <button
        onClick={onClose}
        className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
        aria-label='Close'
      >
        <X className='w-full h-full' />
      </button>
    </div>
  );
};
