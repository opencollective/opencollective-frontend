import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';

import { Button } from '../ui/Button';
import { DefaultSelect } from '../ui/Select';

interface SelectOwnFiscalHostProps {
  administratedHosts: GraphQLV1Collective[];
  collective: GraphQLV1Collective;
  onSubmit: (host: GraphQLV1Collective) => void;
}

const SelectOwnFiscalHost = ({ administratedHosts, onSubmit }: SelectOwnFiscalHostProps) => {
  const intl = useIntl();
  const [selectedHostId, setSelectedHostId] = useState<string>('');

  const selectedHost = administratedHosts.find(host => String(host.id) === selectedHostId);

  const handleSubmit = () => {
    if (selectedHost) {
      onSubmit(selectedHost);
    }
  };

  const options = administratedHosts.map(host => ({
    value: String(host.id),
    label: host.name,
  }));

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="host-select" className="text-sm font-medium">
          <FormattedMessage id="collective.edit.host.selectHost" defaultMessage="Select Host" />
        </label>
        <DefaultSelect
          name="host-select"
          placeholder={intl.formatMessage({ id: 'Select.Placeholder', defaultMessage: 'No selection' })}
          value={selectedHostId}
          setValue={setSelectedHostId}
          options={options}
        />
      </div>
      {selectedHost && (
        <Button onClick={handleSubmit} className="w-fit">
          <FormattedMessage
            id="collective.edit.host.useHost"
            defaultMessage="Use {name} as the Fiscal Host"
            values={{ name: <span className="font-bold italic">{selectedHost.name}</span> }}
          />
        </Button>
      )}
    </div>
  );
};

export default SelectOwnFiscalHost;
