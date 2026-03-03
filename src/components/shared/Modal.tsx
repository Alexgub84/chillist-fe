import { Fragment, type ReactNode } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  Transition,
  TransitionChild,
} from '@headlessui/react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  testId?: string;
  showCloseButton?: boolean;
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  testId,
  showCloseButton = false,
  children,
}: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                data-testid={testId}
                className="w-full sm:max-w-lg bg-white sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto rounded-t-xl"
              >
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                    {title && (
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        {title}
                      </DialogTitle>
                    )}
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                        data-testid="modal-close"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
