import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';

type ReceiptPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  info: string;
  embeddedImage: string;
};

const ReceiptPreviewDialog = ({ open, onOpenChange, title, info, embeddedImage }: ReceiptPreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl" hideCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Receipt Preview" id="F21ZZ6" />
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-500">
          <FormattedMessage
            defaultMessage="This is a preview of how your receipt will look."
            id="Receipt.Preview.Note"
          />
        </p>

        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6">
          {/* PDF Preview Container - A4 aspect ratio simulation, responsive */}
          <div className="w-full max-w-3xl bg-white shadow-lg" style={{ padding: '32px' }}>
            {/* Header Section */}
            <div className="mb-5 flex items-start justify-between">
              {/* Left: Host Info */}
              <div className="flex-1">
                <div className="mb-2 h-5 rounded bg-gray-300" style={{ width: '60%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '100%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '90%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '100%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '85%' }}></div>
              </div>

              {/* Right: Bill To */}
              <div className="ml-4 flex-1">
                <div className="mb-2 h-4 rounded bg-gray-300" style={{ width: '40%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '100%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '95%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '100%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '90%' }}></div>
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-3">
              <div className="text-sm font-bold">{title || 'Payment Receipt'}</div>
            </div>

            {/* Reference and Payment Info */}
            <div className="mb-4 space-y-1">
              <div className="h-3 rounded bg-gray-200" style={{ width: '70%' }}></div>
              <div className="h-3 rounded bg-gray-200" style={{ width: '55%' }}></div>
              <div className="h-3 rounded bg-gray-200" style={{ width: '80%' }}></div>
            </div>

            {/* Transactions Table */}
            <div className="mb-4">
              {/* Table Header */}
              <div className="flex rounded-t border border-gray-300 bg-blue-100">
                <div className="flex-1 border-r border-gray-300 px-2 py-2">
                  <div className="h-3 rounded bg-gray-400" style={{ width: '70%' }}></div>
                </div>
                <div className="flex-[2] border-r border-gray-300 px-2 py-2">
                  <div className="h-3 rounded bg-gray-400" style={{ width: '60%' }}></div>
                </div>
                <div className="w-16 border-r border-gray-300 px-2 py-2">
                  <div className="mx-auto h-3 rounded bg-gray-400" style={{ width: '60%' }}></div>
                </div>
                <div className="w-24 border-r border-gray-300 px-2 py-2">
                  <div className="mx-auto h-3 rounded bg-gray-400" style={{ width: '70%' }}></div>
                </div>
                <div className="w-20 border-r border-gray-300 px-2 py-2">
                  <div className="mx-auto h-3 rounded bg-gray-400" style={{ width: '65%' }}></div>
                </div>
                <div className="w-24 px-2 py-2 text-right">
                  <div className="ml-auto h-3 rounded bg-gray-400" style={{ width: '80%' }}></div>
                </div>
              </div>

              {/* Table Row */}
              <div className="flex border-x border-b border-gray-300">
                <div className="flex-1 border-r border-gray-300 px-2 py-2">
                  <div className="h-3 rounded bg-gray-200" style={{ width: '70%' }}></div>
                </div>
                <div className="flex-[2] border-r border-gray-300 px-2 py-2">
                  <div className="h-3 rounded bg-gray-200" style={{ width: '90%' }}></div>
                </div>
                <div className="w-16 border-r border-gray-300 px-2 py-2 text-center">
                  <div className="mx-auto h-3 rounded bg-gray-200" style={{ width: '50%' }}></div>
                </div>
                <div className="w-24 border-r border-gray-300 px-2 py-2 text-center">
                  <div className="mx-auto h-3 rounded bg-gray-200" style={{ width: '70%' }}></div>
                </div>
                <div className="w-20 border-r border-gray-300 px-2 py-2 text-center">
                  <div className="mx-auto h-3 rounded bg-gray-200" style={{ width: '60%' }}></div>
                </div>
                <div className="w-24 px-2 py-2 text-right">
                  <div className="ml-auto h-3 rounded bg-gray-200" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="mb-4 flex justify-end">
              <div className="border-t border-gray-400" style={{ width: '50%' }}>
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="h-4 rounded bg-gray-300" style={{ width: '40%' }}></div>
                  <div className="h-4 rounded bg-gray-300" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>

            {/* Custom Info Section */}
            <div className="mb-4 border-l-2 border-gray-300 py-2 pl-3 text-xs text-gray-600">
              {info && <div className="whitespace-pre-wrap">{info}</div>}
            </div>

            {/* Embedded Image Section */}
            {embeddedImage && (
              <div className="mb-4">
                <img src={embeddedImage} alt="Embedded in receipt" className="max-h-32 max-w-[50%] object-contain" />
              </div>
            )}

            {/* Footer Section */}
            <div className="mt-8 flex items-start">
              <div
                className="mr-4 rounded bg-gray-300"
                style={{ width: '8%', aspectRatio: '1', minWidth: '40px' }}
              ></div>
              <div className="flex-1">
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '40%' }}></div>
                <div className="mb-1 h-3 rounded bg-gray-200" style={{ width: '50%' }}></div>
                <div className="h-3 rounded bg-gray-200" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;
