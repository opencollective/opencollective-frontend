import React from 'react';

import { Button } from '../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/Dialog';
import { toast } from '../components/ui/useToast';

/**
 * Minimal reproduction for the toast-dialog dismiss bug.
 *
 * Steps to reproduce:
 * 1. Click "Open Dialog" to open the dialog
 * 2. Click "Show Error Toast" to display an error toast
 * 3. Click the X button on the toast to dismiss it
 *
 * Expected: Only the toast should close
 * Actual (bug): Both the toast AND the dialog close
 */
export default function ToastDialogRepro() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const showErrorToast = () => {
    toast({
      variant: 'error',
      title: 'Error',
      message: 'This is an error toast. Click the X to dismiss it.',
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Toast + Dialog Bug Reproduction</h1>

      <div className="max-w-md rounded-lg border p-6 text-center">
        <h2 className="mb-4 font-semibold">Steps to reproduce:</h2>
        <ol className="mb-6 list-inside list-decimal text-left">
          <li>Click &quot;Open Dialog&quot; below</li>
          <li>Click &quot;Show Error Toast&quot; inside the dialog</li>
          <li>Click the X button on the toast to dismiss it</li>
        </ol>
        <p className="mb-2 text-sm">
          <strong>Expected:</strong> Only the toast closes
        </p>
        <p className="mb-6 text-sm">
          <strong>Bug:</strong> Both toast AND dialog close
        </p>

        <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>This dialog should stay open when you dismiss the toast.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <p>Click the button below to show an error toast, then try to dismiss it by clicking the X on the toast.</p>
            <Button variant="destructive" onClick={showErrorToast}>
              Show Error Toast
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
