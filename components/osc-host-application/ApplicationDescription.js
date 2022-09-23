import React from 'react';
import { FormattedMessage } from 'react-intl';

import { getI18nLink } from '../I18nFormatters';
import { H5, P } from '../Text';
import StyledLink from '../StyledLink';

const ApplicationDescription = () => (
  <React.Fragment>
    <P mb={3} fontSize="15px" lineHeight="22px">
      <FormattedMessage
        id="createcollective.opensource.p1"
        defaultMessage="You're creating software. You don't want to worry about creating a legal entity or bank account, taxes, invoices, and a bunch of other admin. Let us take care of all that, so you can stay focused on your project."
      />
    </P>
    <P mb={3} fontSize="15px" lineHeight="22px">
      <FormattedMessage
        id="createcollective.opensource.p2"
        defaultMessage="We have created the {osclink}, a non-profit umbrella organization, to serve the open source community. To join, you need at least 100 stars on GitHub or to meet our {criterialink}."
        values={{
          osclink: (
            <StyledLink href="https://opencollective.com/opensource" openInNewTab color="purple.500">
              Open Source Collective
            </StyledLink>
          ),
          criterialink: (
            <StyledLink href="https://www.oscollective.org/#criteria" openInNewTab color="purple.500">
              <FormattedMessage
                id="alternativeVerificationCriteria"
                defaultMessage="alternative verification criteria"
              />
            </StyledLink>
          ),
        }}
      />
    </P>
    <P mb={3} fontWeight={700} fontSize="15px" lineHeight="22px">
      <FormattedMessage id="createcollective.opensource.p3" defaultMessage="Fees: 10% of funds raised." />
    </P>
    <P mb={3} fontSize="15px" lineHeight="22px">
      <FormattedMessage
        id="createcollective.opensource.p4"
        defaultMessage="Our fees cover operating costs like accounting, payments, tax reporting, invoices, legal liability, use of the Open Collective Platform, and providing support. We also run a range of initiatives to support a sustainable and healthy open source ecosystem. Join us!"
      />
    </P>
  </React.Fragment>
);

export default ApplicationDescription;
