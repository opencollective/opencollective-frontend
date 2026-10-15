import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Image from '../Image';

const msg = defineMessages({
  code: {
    id: 'HostApplication.ProjectTypeSelect.code',
    defaultMessage: 'Code',
  },
  codeDescription: {
    id: 'HostApplication.ProjectTypeSelect.codeDescription',
    defaultMessage: 'My project is primarily concerned with the development and maintenance of a specific codebase.',
  },
  community: {
    id: 'community',
    defaultMessage: 'Community',
  },
  communityDescription: {
    id: 'HostApplication.ProjectTypeSelect.communityDescription',
    defaultMessage: 'My project is not strongly associated with a specific codebase.',
  },
});

const ProjectTypeOption = ({ name, value, label, description, isChecked, onChange, iconSrc }) => {
  return (
    <label className="flex flex-1 cursor-pointer items-baseline rounded-lg border border-border p-4 ring-offset-background transition-[color,box-shadow] duration-300 has-checked:border-transparent has-checked:text-primary has-checked:ring-2 has-checked:ring-primary">
      <input
        type="radio"
        name={name}
        value={value}
        checked={isChecked}
        onChange={onChange}
        className="mr-1 self-center"
      />
      <Image src={iconSrc} width={48} height={48} className="mr-3 self-center" />
      <div>
        <p className="mb-2 text-base font-bold">{label}</p>
        <p className="text-xs leading-normal font-normal text-muted-foreground">{description}</p>
      </div>
    </label>
  );
};

const ProjectTypeSelect = ({ name, value, onChange, error }) => {
  const intl = useIntl();
  return (
    <React.Fragment>
      <div className="">
        <fieldset onChange={onChange} className="p-0">
          <div className="flex flex-col gap-2 sm:flex-row">
            <ProjectTypeOption
              name={name}
              value="CODE"
              label={intl.formatMessage(msg.code)}
              description={intl.formatMessage(msg.codeDescription)}
              isChecked={value === 'CODE'}
              onChange={onChange}
              iconSrc="/static/images/night-sky.png"
            />
            <ProjectTypeOption
              name={name}
              value="COMMUNITY"
              label={intl.formatMessage(msg.community)}
              description={intl.formatMessage(msg.communityDescription)}
              isChecked={value === 'COMMUNITY'}
              onChange={onChange}
              iconSrc="/static/images/community.png"
            />
          </div>
        </fieldset>
      </div>
      {error}
    </React.Fragment>
  );
};

export default React.memo(ProjectTypeSelect);
