import React, { useState } from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { TransactionsImport } from '../../../../lib/graphql/types/v2/graphql';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../ui/AlertDialog';
import { Button } from '../../../ui/Button';
import { Card, CardContent, CardFooter } from '../../../ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../ui/Dialog';
import { Input } from '../../../ui/Input';
import { Label } from '../../../ui/Label';
import { Separator } from '../../../ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/Tabs';

export default function TransactionsImportSettingsModal({
  transactionsImport,
  onOpenChange,
  isOpen,
}: {
  transactionsImport: TransactionsImport;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const intl = useIntl();
  const [sourceName, setSourceName] = useState(transactionsImport.source);
  const [importName, setImportName] = useState(transactionsImport.name);
  const isDirty = sourceName !== transactionsImport.source || importName !== transactionsImport.name;

  const handleSave = () => {
    // Implement save logic here
    console.log('Saving changes:', { sourceName, importName });
    onOpenChange(false);
  };

  const handleDisconnect = () => {
    // Implement disconnect logic here
    console.log('Disconnecting bank account');
    onOpenChange(false);
  };

  const handleDelete = () => {
    // Implement delete logic here
    console.log('Deleting import');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Transaction Import Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="px-1">
            <div className="space-y-1">
              <Label htmlFor="sourceName" className="text-sm font-medium">
                Source name
              </Label>
              <Input id="sourceName" value={sourceName} onChange={e => setSourceName(e.target.value)} />
            </div>
            <div className="mt-4 space-y-1">
              <Label htmlFor="importName" className="text-sm font-medium">
                Import name
              </Label>
              <Input id="importName" value={importName} onChange={e => setImportName(e.target.value)} />
            </div>
            <div className="mt-6 flex justify-between space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!isDirty}>
                Save Changes
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Disconnect Bank Account</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Stops future imports. Existing data remains intact.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Disconnect Bank Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Bank Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You'll need to reconnect to continue importing transactions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisconnect}>Disconnect</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-medium">Delete Import</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Permanently removes all associated data. Can't be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Delete Import
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Import?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the import and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
