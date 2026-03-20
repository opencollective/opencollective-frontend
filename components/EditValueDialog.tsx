import React from 'react';
import { DialogClose } from '@radix-ui/react-dialog';
import { Form } from 'formik';
import { Pencil } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { cn } from '@/lib/utils';

import { Button } from './ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/Dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { FormField } from './FormField';
import { FormikZod } from './FormikZod';

type EditValueDialogProps = {
  /** The title shown in the dialog header and tooltip */
  title: string;
  /** Optional description shown below the title in the dialog */
  description?: string;
  /** The label for the input field */
  fieldLabel: string;
  /** The current value to edit */
  value: string;
  /** Callback fired with the new value when the user saves. Should return a promise. */
  onSubmit: (value: string) => Promise<void>;
  /** Optional class name for the trigger button */
  triggerClassName?: string;
  /** Optional custom trigger element */
  trigger?: React.ReactNode;
  /** Optional class name for the dialog content */
  dialogContentClassName?: string;
  /** Optional data-cy attribute for the trigger button */
  dataCy?: string;
};

export default function EditValueDialog({
  title,
  description,
  fieldLabel,
  value,
  onSubmit,
  triggerClassName,
  trigger,
  dialogContentClassName,
  dataCy,
}: EditValueDialogProps) {
  const [open, setOpen] = React.useState(false);

  const schema = React.useMemo(
    () =>
      z.object({
        value: z.string().min(1),
      }),
    [],
  );

  const handleSubmit = React.useCallback(
    async (values: z.infer<typeof schema>) => {
      await onSubmit(values.value);
      setOpen(false);
    },
    [onSubmit],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild data-cy={dataCy}>
            {trigger || (
              <Button
                size="icon-xs"
                variant="ghost"
                className={cn('ml-1 inline-flex h-6 w-6 text-muted-foreground', triggerClassName)}
              >
                <Pencil size={16} />
              </Button>
            )}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>

      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <FormikZod schema={schema} initialValues={{ value }} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <FormField name="value" label={fieldLabel} />
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline">
                    <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                  </Button>
                </DialogClose>
                <Button type="submit" loading={isSubmitting}>
                  <FormattedMessage defaultMessage="Save" id="save" />
                </Button>
              </DialogFooter>
            </Form>
          )}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
}
