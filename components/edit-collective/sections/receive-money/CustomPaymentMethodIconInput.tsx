import React, { useEffect, useState } from 'react';
import { startCase } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { UploadedFileKind } from '@/lib/graphql/types/v2/schema';
import { useGraphQLFileUploader } from '@/lib/hooks/useGraphQLFileUploader';
import { getImageDimensions } from '@/lib/image-utils';

import Dropzone, { DROPZONE_ACCEPT_IMAGES } from '../../../Dropzone';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/Popover';
import { useToast } from '../../../ui/useToast';

import { CUSTOM_PAYMEMENT_ICON_MAP } from './constants';

type CustomPaymentMethodIconInputProps = {
  icon?: string;
  iconUrl?: string;
  onIconChange: (icon: string) => void;
  onIconUrlChange: (iconUrl: string) => void;
};

export const CustomPaymentMethodIconInput = ({
  icon,
  iconUrl,
  onIconChange,
  onIconUrlChange,
}: CustomPaymentMethodIconInputProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [iconMode, setIconMode] = useState<'select' | 'upload'>(iconUrl ? 'upload' : 'select');
  const [uploadedIconUrl, setUploadedIconUrl] = useState<string | null>(iconUrl || null);

  // Sync uploadedIconUrl state with prop when it changes externally
  useEffect(() => {
    setUploadedIconUrl(iconUrl || null);
  }, [iconUrl]);

  const { isUploading: isUploadingIcon, uploadFile: uploadIconFile } = useGraphQLFileUploader({
    isMulti: false,
    accept: DROPZONE_ACCEPT_IMAGES,
    onSuccess: results => {
      if (results && results.length > 0 && results[0].file?.url) {
        const url = results[0].file.url;
        setUploadedIconUrl(url);
        onIconUrlChange(url);
      }
    },
    onReject: message => {
      toast({
        variant: 'error',
        message: typeof message === 'string' ? message : message.join(', '),
      });
    },
  });

  const handleIconModeChange = (mode: 'select' | 'upload') => {
    setIconMode(mode);
    if (mode === 'select') {
      onIconUrlChange('');
      setUploadedIconUrl(null);
    } else {
      onIconChange('');
    }
  };

  const handleFileDrop = async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];

    // Validate image dimensions
    const dimensions = await getImageDimensions(file);
    if (!dimensions) {
      toast({
        variant: 'error',
        message: intl.formatMessage({ defaultMessage: 'Invalid image file', id: 'InvalidImage' }),
      });
      return;
    }

    if (dimensions.width >= 256 || dimensions.height >= 256) {
      toast({
        variant: 'error',
        message: intl.formatMessage(
          {
            defaultMessage: 'Image dimensions must be less than 256x256px (actual: {width}x{height}px)',
            id: 'IconSizeError',
          },
          { width: dimensions.width, height: dimensions.height },
        ),
      });
      return;
    }

    // Upload the file if validation passes
    uploadIconFile({ file, kind: UploadedFileKind.ACCOUNT_AVATAR });
  };

  const IconComponent = CUSTOM_PAYMEMENT_ICON_MAP[icon || ''];

  return (
    <div>
      <Label className="block text-sm font-bold">
        <FormattedMessage defaultMessage="Icon" id="CustomPaymentMethod.Icon" />
      </Label>
      <p className="mt-1 mb-2 text-xs text-gray-600">
        <FormattedMessage defaultMessage="Optional" id="Optional" />
      </p>

      {iconMode === 'select' ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-start" data-cy="icon-selector-trigger">
              {IconComponent ? (
                <React.Fragment>
                  <IconComponent className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{startCase(icon)}</span>
                </React.Fragment>
              ) : (
                <FormattedMessage defaultMessage="Select icon" id="CustomPaymentMethod.SelectIcon" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CUSTOM_PAYMEMENT_ICON_MAP).map(([name, IconComp]) => {
                return (
                  <Button
                    key={name}
                    type="button"
                    variant={icon === name ? 'default' : 'ghost'}
                    size="sm"
                    className="h-auto flex-col gap-1 p-2"
                    onClick={() => onIconChange(name)}
                    data-cy={`icon-selector-${name}`}
                  >
                    <IconComp className="h-6 w-6" />
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Dropzone
            name="icon-upload"
            accept={DROPZONE_ACCEPT_IMAGES}
            minSize={0}
            maxSize={5 * 1024 * 1024} // 5MB
            isMulti={false}
            useGraphQL={false}
            collectFilesOnly={true}
            onSuccess={handleFileDrop}
            value={uploadedIconUrl}
            size={80}
            showInstructions={false}
            showIcon={false}
            isLoading={isUploadingIcon}
          />
          <p className="mt-2 text-xs text-gray-600">
            <FormattedMessage defaultMessage="Image must be less than 256x256px" id="IconSizeRequirement" />
          </p>
        </div>
      )}
    </div>
  );
};
