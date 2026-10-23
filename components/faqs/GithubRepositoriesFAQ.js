import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Link from '../Link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { Button } from '../ui/Button';

/**
 * FAQ associated to the `GithubRepositories` component.
 */
const GithubRepositoriesFAQ = ({ className }) => (
  <div className={className}>
    <div className="rounded-lg border border-border px-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="host" className="last:border-b-0">
          <AccordionTrigger className="text-left text-sm">
            <FormattedMessage
              id="GithubRepositories.faq.host.title"
              defaultMessage="Who will hold money for my Collective?"
            />
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <FormattedMessage
              id="GithubRepositories.faq.host.content"
              defaultMessage="Open Source Collective 501(c)(6) is a US non-profit that was created to serve as Fiscal Host (aka fiscal sponsor) to open source projects using Open Collective. Learn more about OSC at https://oscollective.org."
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="cost" className="last:border-b-0">
          <AccordionTrigger className="text-left text-sm">
            <FormattedMessage id="GithubRepositories.faq.cost.title" defaultMessage="What is the cost?" />
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <FormattedMessage
              id="GithubRepositories.faq.cost.content"
              defaultMessage="The fee is 10% of funds raised. This fee covers overheads like accounting, banking, legal, admin, and liability, so you don't have to set up your own foundation or take risk on personally."
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
    <Button asChild variant="outline" size="sm" className="mt-3">
      <Link href="https://docs.oscollective.org" openInNewTab>
        <FormattedMessage id="moreInfo" defaultMessage="More info" />
        <ArrowRight size={14} />
      </Link>
    </Button>
  </div>
);

export default GithubRepositoriesFAQ;
