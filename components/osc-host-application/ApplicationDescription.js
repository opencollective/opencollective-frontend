import React from 'react';
import { FormattedMessage } from 'react-intl';

import Link from '../Link';

const ApplicationDescription = () => (
  <React.Fragment>
    <p className="text-sm leading-6 text-muted-foreground">
      <FormattedMessage
        id="createcollective.opensource.p1"
        defaultMessage="You're creating software. You don't want to worry about creating a legal entity or bank account, taxes, invoices, and a bunch of other admin. Let us take care of all that, so you can stay focused on your project."
      />
    </p>
    <p className="text-sm leading-6 text-muted-foreground">
      <FormattedMessage
        id="createcollective.opensource.p2"
        defaultMessage="We have created the {osclink}, a non-profit umbrella organization, to serve the open source community. To join, you need to meet our {criterialink}."
        values={{
          osclink: (
            <Link
              href="https://opencollective.com/opensource"
              openInNewTab
              className="text-primary underline-offset-4 hover:underline"
            >
              Open Source Collective
            </Link>
          ),
          criterialink: (
            <Link
              href="https://docs.oscollective.org/interested-in-joining-osc/acceptance-criteria"
              openInNewTab
              className="text-primary underline-offset-4 hover:underline"
            >
              <FormattedMessage id="verificationCriteria" defaultMessage="verification criteria" />
            </Link>
          ),
        }}
      />
    </p>
    <p className="text-sm leading-6 font-bold text-foreground">
      <FormattedMessage id="createcollective.opensource.p3" defaultMessage="Fees: 10% of funds raised." />
    </p>
    <p className="text-sm leading-6 text-muted-foreground">
      <FormattedMessage
        id="createcollective.opensource.p4"
        defaultMessage="Our fees cover operating costs like accounting, payments, tax reporting, invoices, legal liability, use of the Open Collective Platform, and providing support. We also run a range of initiatives to support a sustainable and healthy open source ecosystem. Join us!"
      />
    </p>
  </React.Fragment>
);

export default ApplicationDescription;
