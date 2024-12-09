import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import HTMLContent from '../../HTMLContent';
import MessageBox from '../../MessageBox';
import { Checkbox } from '../../ui/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/Collapsible';

type ExpensePolicyContainerProps = {
  title: React.ReactNode;
  policy: string;
  checked: boolean;
  onAcknowledgedChanged: (acknowledged: boolean) => void;
};

export function ExpensePolicyContainer(props: ExpensePolicyContainerProps) {
  const [isOpen, setIsOpen] = React.useState(!props.checked);

  React.useEffect(() => {
    if (!props.checked) {
      setIsOpen(true);
    }
  }, [props.checked]);

  return (
    <Collapsible
      asChild
      onOpenChange={open => {
        props.checked && setIsOpen(open);
      }}
      open={isOpen}
    >
      <div className="group rounded-md border border-[#DCDDE0] p-4">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center text-start text-sm font-bold">
            <div className="flex-grow">{props.title}</div>
            <div className="group-data-[state=open]:rotate-180">{props.checked && <ChevronDown size={16} />}</div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-4">
            <HTMLContent content={props.policy} />
            <div className="mt-4">
              <MessageBox type="warning">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-normal leading-normal">
                  <Checkbox
                    checked={props.checked}
                    onCheckedChange={v => {
                      props.onAcknowledgedChanged(v as boolean);
                      if (v) {
                        setIsOpen(false);
                      }
                    }}
                  />
                  <FormattedMessage
                    defaultMessage="I have read and understood the instructions and conditions"
                    id="3RrjeI"
                  />
                </label>
              </MessageBox>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
