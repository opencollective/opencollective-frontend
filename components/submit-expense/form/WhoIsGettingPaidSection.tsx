import React from 'react';
import { isEmpty } from 'lodash';
import { ChevronsUpDown, Lock } from 'lucide-react';

import { cn } from '../../../lib/utils';

import MessageBox from '../../MessageBox';
import { Button } from '../../ui/Button';
import { Command, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { RadioGroup, RadioGroupCard, RadioGroupItem } from '../../ui/RadioGroup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Step } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

import { ExistingUserOption } from './ExistingUserOption';
import { ExpenseAccountItem } from './ExpenseAccountItem';
import { InviteeOption, WhoIsGettingPaidOption } from './experiment';
import { FormSectionContainer } from './FormSectionContainer';
import { InviteUserOption } from './InviteUserOption';
import { Collapsible, CollapsibleContent } from '../../ui/Collapsible';
import CollectivePicker from '../../CollectivePicker';
import { Select, SelectTrigger } from '../../ui/Select';

type WhoIsGettingPaidSectionProps = {
  form: ExpenseForm;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function WhoIsGettingPaidSection(props: WhoIsGettingPaidSectionProps) {
  const [lastUsedProfile, setLastUsedProfile] = React.useState(null);
  const [isMyProfilesPickerOpen, setIsMyProfilesPickerOpen] = React.useState(false);

  const myProfiles = React.useMemo(() => props.form.options.payoutProfiles || [], [props.form.options.payoutProfiles]);
  const myProfileSlugs = myProfiles.map(m => m.slug);
  const recentExpensesToMyProfiles = props.form.options.recentlySubmittedExpenses?.nodes?.filter(e =>
    myProfileSlugs.includes(e.payee.slug),
  );
  const { setFieldValue } = props.form;
  React.useEffect(() => {
    const myProfileSlugs = myProfiles.map(m => m.slug);
    const recentExpensesToMyProfiles = props.form.options.recentlySubmittedExpenses?.nodes?.filter(e =>
      myProfileSlugs.includes(e.payee.slug),
    );

    if (recentExpensesToMyProfiles?.length > 0) {
      setLastUsedProfile(recentExpensesToMyProfiles.at(0).payee.slug);
    } else {
      setLastUsedProfile(null);
    }

    if (recentExpensesToMyProfiles?.length > 0 && !props.form.values.myProfilesExpensePayeePick) {
      setFieldValue('myProfilesExpensePayeePick', recentExpensesToMyProfiles.at(0).payee.slug);
    } else if (myProfiles.length > 0 && !props.form.values.myProfilesExpensePayeePick) {
      setFieldValue('myProfilesExpensePayeePick', myProfiles.at(0).slug);
    }
  }, [
    props.form.values.myProfilesExpensePayeePick,
    props.form.options.recentlySubmittedExpenses,
    myProfiles,
    setFieldValue,
  ]);

  const myProfileSelection = React.useMemo(
    () =>
      props.form.values.myProfilesExpensePayeePick
        ? myProfiles.find(p => p.slug === props.form.values.myProfilesExpensePayeePick)
        : null,
    [props.form.values.myProfilesExpensePayeePick, myProfiles],
  );
  console.log({ myProfileSelection });
  return (
    <FormSectionContainer
      id={Step.WHO_IS_GETTING_PAID}
      inViewChange={props.inViewChange}
      title={'Who is getting paid?'}
      subtitle={'Select the profile of the recipient who needs to be paid'}
    >
      <RadioGroup
        value={props.form.values.myProfilesExpensePayeePick}
        onValueChange={val => setFieldValue('myProfilesExpensePayeePick', val)}
      >
        {myProfiles
          .filter(a => a.slug === recentExpensesToMyProfiles.at(0).payee.slug)
          .map(a => (
            <RadioGroupCard
              key={a.slug}
              value={`${a.slug}`}
              subContent={
                <Collapsible open={myProfileSelection?.slug === a.slug && isEmpty(myProfileSelection.legalName)}>
                  <CollapsibleContent className="">
                    <div className="mt-4">
                      <MessageBox type="warning">
                        <div className="mb-2 font-bold">Legal name missing</div>
                        <div className="mb-4">
                          Your profile is missing a legal name. It is required for you to get paid. It is private
                          information that only collective and fiscal host administrators can see.
                        </div>
                        <Label className="mb-2 flex gap-2">
                          Enter legal name <Lock size={14} />
                        </Label>
                        <Input placeholder="E.g. Jogn Doe" className="mb-2" type="text" />
                        <Button variant="outline">Save legal name</Button>
                      </MessageBox>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              }
            >
              <ExpenseAccountItem slug={a.slug} />
            </RadioGroupCard>
          ))}
        <RadioGroupCard
          value={'administrated-account'}
          subContent={
            <Collapsible open={props.form.values.myProfilesExpensePayeePick === 'administrated-account'}>
              <CollapsibleContent>
                <Select>
                  <SelectTrigger className="mt-4">Find account</SelectTrigger>
                </Select>
              </CollapsibleContent>
            </Collapsible>
          }
        >
          An account I administer
        </RadioGroupCard>
        <RadioGroupCard value={'invite-someone'}>Invite someone</RadioGroupCard>
        <RadioGroupCard value={'a-vendor'}>A Vendor</RadioGroupCard>
      </RadioGroup>
      {/* <Tabs
        value={props.form.values.whoIsGettingPaidOption}
        onValueChange={newValue => setFieldValue('whoIsGettingPaidOption', newValue as WhoIsGettingPaidOption)}
      >
        <TabsList>
          <TabsTrigger value={WhoIsGettingPaidOption.MY_PROFILES}>My Profiles</TabsTrigger>
          <TabsTrigger value={WhoIsGettingPaidOption.INVITEE}>Invite Someone</TabsTrigger>
          <TabsTrigger disabled value={WhoIsGettingPaidOption.VENDOR}>
            Vendor
          </TabsTrigger>
        </TabsList>
        <TabsContent value={WhoIsGettingPaidOption.MY_PROFILES}>
          <Label className="mb-2">Choose a profile</Label>
          <Button
            variant="outline"
            size="sm"
            className={cn('w-full justify-between', {
              'rounded-b-none border-b-0': isMyProfilesPickerOpen,
            })}
            onClick={() => setIsMyProfilesPickerOpen(!isMyProfilesPickerOpen)}
          >
            {props.form.values.myProfilesExpensePayeePick ? (
              <ExpenseAccountItem slug={props.form.values.myProfilesExpensePayeePick} />
            ) : (
              'Pick'
            )}
            <ChevronsUpDown className="ml-2 opacity-50" size={16} />
          </Button>
          {!isMyProfilesPickerOpen &&
            props.form.values.myProfilesExpensePayeePick &&
            lastUsedProfile &&
            props.form.values.myProfilesExpensePayeePick === lastUsedProfile && (
              <span className="mt-2 text-sm text-muted-foreground">Last used profile</span>
            )}
          {!isMyProfilesPickerOpen && myProfileSelection && isEmpty(myProfileSelection.legalName) && (
            <div className="mt-2">
              <MessageBox type="warning">
                <div className="mb-2 font-bold">Legal name missing</div>
                <div className="mb-4">
                  Your profile is missing a legal name. It is required for you to get paid. It is private information
                  that only collective and fiscal host administrators can see.
                </div>
                <Label className="mb-2 flex gap-2">
                  Enter legal name <Lock size={14} />
                </Label>
                <Input placeholder="E.g. Jogn Doe" className="mb-2" type="text" />
                <Button variant="outline">Save legal name</Button>
              </MessageBox>
            </div>
          )}
          {isMyProfilesPickerOpen && (
            <div className="rounded-md rounded-t-none border border-gray-200">
              <Command>
                <CommandInput autoFocus />
                <CommandList>
                  {myProfiles.map(a => (
                    <CommandItem
                      key={a.slug}
                      value={`${a.slug}-${a.name}`}
                      onSelect={() => {
                        setFieldValue('myProfilesExpensePayeePick', a.slug);
                        setIsMyProfilesPickerOpen(false);
                      }}
                    >
                      <div className="flex-grow">
                        <ExpenseAccountItem slug={a.slug} />
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </div>
          )}
        </TabsContent>
        <TabsContent value={WhoIsGettingPaidOption.INVITEE}>
          <Label className="mb-2">Search for users</Label>
          <RadioGroup
            id="inviteeOption"
            value={props.form.values.inviteeOption}
            onValueChange={newValue => setFieldValue('inviteeOption', newValue as InviteeOption)}
          >
            <div className="flex space-x-2 rounded-md border border-gray-200 p-4">
              <RadioGroupItem value={InviteeOption.EXISTING} />
              <Label className="flex-grow" htmlFor={InviteeOption.EXISTING}>
                <ExistingUserOption form={props.form} />
              </Label>
            </div>
            <div className="flex space-x-2 rounded-md border border-gray-200 p-4">
              <RadioGroupItem value={InviteeOption.NEW_USER} />
              <Label className="flex-grow" htmlFor={InviteeOption.NEW_USER}>
                <InviteUserOption form={props.form} />
              </Label>
            </div>
          </RadioGroup>
        </TabsContent>
        <TabsContent value={WhoIsGettingPaidOption.VENDOR}>Vendor</TabsContent>
      </Tabs> */}
    </FormSectionContainer>
  );
}
