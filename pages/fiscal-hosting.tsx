import React from 'react';
import { ArrowRight, InfoIcon } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

import Page from '../components/Page';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import I18nFormatters from '@/components/I18nFormatters';

// ─── Layout config ────────────────────────────────────────────────────────────

const ALTERNATE_IMAGE_POSITIONS = false;

// ─── Internal Components ──────────────────────────────────────────────────────

type SectionCardProps = {
  className?: string;
  index?: number;
  imgSrc: string;
  imgWidth: number;
  imgHeight: number;
  children: React.ReactNode;
};

const SectionCard = ({ className, index = 0, imgSrc, imgWidth, imgHeight, children }: SectionCardProps) => {
  const imageOnRight = ALTERNATE_IMAGE_POSITIONS && index % 2 !== 0;
  return (
    <section className={cn('!mx-auto !my-12 max-w-6xl rounded-3xl p-12', className)}>
      <div className="mx-auto max-w-5xl">
        <div
          className={cn('flex flex-col items-start gap-10 md:flex-row md:items-start md:gap-16', {
            'md:flex-row-reverse': imageOnRight,
          })}
        >
          <div className="w-full max-w-[260px] shrink-0">
            <Image
              src={imgSrc}
              width={imgWidth}
              height={imgHeight}
              alt=""
              className="w-full"
              style={{ height: undefined }}
            />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </section>
  );
};

const AccordionItems = ({
  items,
  defaultValue,
  className,
  style,
}: {
  items: { id: string; title: string; description: string }[];
  defaultValue?: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <Accordion
    type="single"
    collapsible
    defaultValue={defaultValue ?? items[0]?.id}
    className={cn('flex w-full flex-col', className)}
    style={style}
  >
    {items.map(item => (
      <AccordionItem key={item.id} value={item.id} className="border-0 py-2">
        <AccordionTrigger
          className={cn(
            'font-r w-full border-b py-2 text-left text-xl font-normal hover:no-underline',
            '[&[data-state=open]>div]:text-foreground',
            '[&[data-state=open]>div>div>div:first-child]:bg-primary',
            '[&>svg]:hidden',
          )}
        >
          <div className="flex items-center justify-between text-slate-600 transition-colors hover:text-foreground">
            <div className="flex items-center gap-2.5">
              <div className="size-2 shrink-0 bg-gray-400 transition-colors" />
              <div>{item.title}</div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-0">
          <p className="pt-4 pb-4 text-base">{item.description}</p>
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

const BulletList = ({ items }: { items: React.ReactElement[] }) => (
  <ul className="mb-4 list-disc space-y-2 pl-4 text-foreground">
    {items.map(item => (
      <li key={item.key}>{item}</li>
    ))}
  </ul>
);

// ─── Section data ──────────────────────────────────────────────────────────────

const howItWorksItems = [
  {
    id: 'find-a-host',
    title: defineMessage({ defaultMessage: 'Find a Host', id: 'fiscalHosting.howOperate.step1' }),
    description: defineMessage({
      defaultMessage:
        'Search for a fiscal host that aligns with your mission and your financial needs. Hosts usually specialize in specific locations (like the US or Europe) or specific causes (like climate action or tech), and they are only permitted to host projects whose missions align with their own legal charters.',
      id: 'fiscalHosting.howOperate.step1.description',
    }),
  },
  {
    id: 'apply-and-join',
    title: defineMessage({ defaultMessage: 'Apply & Join', id: 'fiscalHosting.howOperate.step2' }),
    description: defineMessage({
      defaultMessage:
        'Once accepted, you operate under their legal status. You get the benefits of being a "legal entity" without the overhead. Your funds are held and managed by the fiscal host, who reviews, approves, and executes financial activities on your behalf.',
      id: 'fiscalHosting.howOperate.step2.description',
    }),
  },
  {
    id: 'managed-finances',
    title: defineMessage({ defaultMessage: 'Managed Finances', id: 'fiscalHosting.howOperate.step3' }),
    description: defineMessage({
      defaultMessage:
        'The fiscal host takes responsibility for accounting, reporting, and legal compliance related to your funds. Your funds are held by the host. When you need to spend money, you submit a request; they review, approve, and execute the payment for you.',
      id: 'fiscalHosting.howOperate.step3.description',
    }),
  },
  {
    id: 'simple-fees',
    title: defineMessage({ defaultMessage: 'Simple Fees', id: 'fiscalHosting.howOperate.step4' }),
    description: defineMessage({
      defaultMessage:
        'In exchange for doing the heavy lifting (accounting, legal, and banking), hosts typically charge a small percentage of your income as a service fee.',
      id: 'fiscalHosting.howOperate.step4.description',
    }),
  },
];

const findHostItems = [
  {
    id: 'mission-alignment',
    title: defineMessage({ defaultMessage: 'Mission alignment', id: 'fiscalHosting.missionAlignment' }),
    description: defineMessage({
      defaultMessage:
        'Fiscal Hosts usually have specific topics or areas they are designed to serve. When it comes to the application process, their acceptance criteria will fit in that scope.',
      id: 'fiscalHosting.findHost.missionAlignment',
    }),
  },
  {
    id: 'location',
    title: defineMessage({ defaultMessage: 'Location', id: 'SectionLocation.Title' }),
    description: defineMessage({
      defaultMessage:
        'Which country a fiscal host is based in will determine the currency your money will be accounted in, and where you are located in a legal sense. For example, if you are applying for an EU grant, you might need a fiscal host based in the EU.',
      id: 'fiscalHosting.findHost.location',
    }),
  },
  {
    id: 'legal-structure',
    title: defineMessage({ defaultMessage: 'Legal structure', id: 'fiscalHosting.legalStructure' }),
    description: defineMessage({
      defaultMessage:
        'Do you want your host to be a charity, a company, a cooperative, or something else? For example, a charity structure can enable tax-deductible donations, but may also have more restrictions on allowed activities.',
      id: 'fiscalHosting.findHost.legalStructure',
    }),
  },
  {
    id: 'fees',
    title: defineMessage({ defaultMessage: 'Fees', id: 'fiscalHosting.fees' }),
    description: defineMessage({
      defaultMessage:
        "Fiscal Hosts often charge a fee for the service they provide. Some hosts keep fees low and offer a lightweight service, while others have higher fees and provide more support. Some fiscal hosts don't charge fees at all.",
      id: 'fiscalHosting.findHost.fees',
    }),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const FiscalHostingPage = () => {
  const intl = useIntl();

  return (
    <Page
      title="What Is Fiscal Hosting?"
      description="Learn how fiscal hosting works, what a fiscal host is, why you might need one, and how to find the right fit for your community."
    >
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="mt-16 px-4 pb-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="max-w-[320px]">
            <Image
              src="/static/images/fiscal-hosting/hero.png"
              width={639}
              height={619}
              alt=""
              style={{ height: undefined }}
            />
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-oc sm:text-5xl md:text-6xl">
            <FormattedMessage defaultMessage="Fiscal Hosting" id="editCollective.fiscalHosting" />
          </h1>

          <p className="mb-4 max-w-2xl text-lg leading-relaxed text-balance text-foreground">
            <FormattedMessage
              defaultMessage="You have a mission. Maybe it's a community garden, an open-source software project, or a local activist group. You're ready to change the world, but then you hit a wall: &ldquo;How do we actually handle the money?&rdquo;"
              id="fiscalHosting.hero.intro1"
            />
          </p>
          <p className="max-w-2xl text-lg leading-relaxed text-foreground">
            <FormattedMessage defaultMessage="That's where Fiscal Hosting comes in." id="fiscalHosting.hero.intro2" />
          </p>
        </div>
      </section>

      <div className="px-4 pb-20">
        {/* ── What is a fiscal host? ────────────────────────────────────────── */}
        <SectionCard
          index={0}
          className="bg-blue-50"
          imgSrc="/static/images/become-a-host/whoAreFiscalHost-illustration.png"
          imgWidth={676}
          imgHeight={432}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
            <FormattedMessage defaultMessage="What is a fiscal host?" id="fiscalHosting.whatIsFiscalHost" />
          </h2>
          <p className="mb-3 leading-relaxed font-medium text-foreground">
            <FormattedMessage
              defaultMessage="A fiscal host is a legally registered organization (usually a nonprofit) that can hold and manage money on behalf of projects and groups that aren't legally incorporated."
              id="fiscalHosting.whatIsFiscalHost.p1"
            />
          </p>
          <BulletList
            items={[
              <FormattedMessage
                key="1"
                defaultMessage="With established legal and financial status, a fiscal host can receive funds, issue invoices and receipts, and handle payments and reimbursements."
                id="fiscalHosting.whatIsFiscalHost.bullet1"
              />,
              <FormattedMessage
                key="2"
                defaultMessage="If your fiscal host is a nonprofit, they can provide tax-exemptions to your contributors."
                id="fiscalHosting.whatIsFiscalHost.bullet2"
              />,
              <FormattedMessage
                key="3"
                defaultMessage="The host takes care of accounting, reporting, and regulatory compliance, so projects can focus on their work instead of administration."
                id="fiscalHosting.whatIsFiscalHost.bullet3"
              />,
            ]}
          />
        </SectionCard>

        {/* ── Why would you need fiscal hosting? ───────────────────────────── */}
        <SectionCard
          index={1}
          className="bg-[hsl(54,91%,95%)]"
          imgSrc="/static/images/fiscal-hosting/legal.png"
          imgWidth={500}
          imgHeight={500}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
            <FormattedMessage defaultMessage="Why would you need fiscal hosting?" id="fiscalHosting.whyNeed.title" />
          </h2>
          <p className="mb-4 leading-relaxed font-medium text-foreground">
            <FormattedMessage
              defaultMessage="If you need to manage money and are not a legally registered entity, you can benefit from fiscal hosting. Most crowdfunding platforms, financial institutions, and grant-makers require a registered legal entity and a business bank account."
              id="fiscalHosting.whyNeed.intro"
            />
          </p>
          <p className="mb-3 leading-relaxed text-foreground">
            <FormattedMessage defaultMessage="With a fiscal host:" id="fiscalHosting.whyNeed.withHost" />
          </p>
          <BulletList
            items={[
              <FormattedMessage
                key="1"
                defaultMessage="You can <strong>raise money</strong> through donations, crowdfunding, or grants."
                id="fiscalHosting.whyNeed.bullet1"
                values={I18nFormatters}
              />,
              <FormattedMessage
                key="2"
                defaultMessage="You can <strong>pay</strong> for services, products, or reimburse people."
                id="fiscalHosting.whyNeed.bullet2"
                values={I18nFormatters}
              />,
              <FormattedMessage
                key="3"
                defaultMessage="You don't need your own bank account because your <strong>money is managed</strong> for you by your fiscal host using their bank accounts."
                id="fiscalHosting.whyNeed.bullet3"
                values={I18nFormatters}
              />,
              <FormattedMessage
                key="4"
                defaultMessage="You don't need to worry about <strong>taxes, accounting, or legal compliance</strong>. The fiscal host handles all these for you."
                id="fiscalHosting.whyNeed.bullet4"
                values={I18nFormatters}
              />,
            ]}
          />
        </SectionCard>

        {/* ── How does fiscal hosting operate? ─────────────────────────────── */}
        <SectionCard
          index={2}
          className="bg-[hsl(0,73%,97%)]"
          imgSrc="/static/images/fiscal-hosting/birds-nurturing.png"
          imgWidth={500}
          imgHeight={738}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
            <FormattedMessage defaultMessage="How does fiscal hosting operate?" id="fiscalHosting.howOperate.title" />
          </h2>
          <p className="mb-6 leading-relaxed font-medium text-foreground">
            <FormattedMessage
              defaultMessage="Fiscal hosting enables you and your group to accept donations, receive grants, and pay expenses without the overhead of setting up your own legal entity."
              id="fiscalHosting.howOperate.intro"
            />
          </p>
          <AccordionItems
            items={howItWorksItems.map(i => ({
              ...i,
              title: intl.formatMessage(i.title),
              description: intl.formatMessage(i.description),
            }))}
            style={{ '--primary': 'var(--color-red-600)' } as React.CSSProperties}
          />
        </SectionCard>

        {/* ── What is a Collective? ─────────────────────────────────────────── */}
        <SectionCard
          index={3}
          className="bg-[hsl(113,53%,97%)]"
          imgSrc="/static/images/fiscal-hosting/music.png"
          imgWidth={500}
          imgHeight={500}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
            <FormattedMessage defaultMessage="What is a Collective?" id="pricing.faq.collective.title" />
          </h2>
          <p className="mb-3 leading-relaxed text-foreground">
            <FormattedMessage
              defaultMessage='On the Open Collective platform, we use the term "Collective" to describe a group of people collaboratively managing money toward a common goal without being legally incorporated.'
              id="fiscalHosting.whatIsCollective.p1"
            />
          </p>
          <p className="mb-3 leading-relaxed text-foreground">
            <FormattedMessage
              defaultMessage='A "Collective" is your "mini organization" within the fiscal host. In it you will find the tools you need to collaboratively manage your money.'
              id="fiscalHosting.whatIsCollective.p2"
            />
          </p>
          <Alert className="mb-4 text-muted-foreground">
            <InfoIcon size={16} />
            <AlertDescription>
              <FormattedMessage
                defaultMessage="You can create a Collective at any time, however, to financially activate your Collective (enabling you to actually receive and spend money) you must connect with a fiscal host willing to provide you with their legal and financial infrastructure."
                id="fiscalHosting.whatIsCollective.p3"
              />
            </AlertDescription>
          </Alert>
        </SectionCard>

        {/* ── What are Certified Fiscal Hosts? ─────────────────────────────── */}
        <SectionCard
          index={4}
          className="bg-[hsl(264,100%,98%)]"
          imgSrc="/static/images/fiscal-hosting/certified.png"
          imgWidth={500}
          imgHeight={500}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
            <FormattedMessage
              defaultMessage="What are Certified Fiscal Hosts?"
              id="fiscalHosting.certifiedHosts.title"
            />
          </h2>
          <p className="mb-3 leading-relaxed font-medium text-foreground">
            <FormattedMessage
              defaultMessage="Certified fiscal hosts participate in the governance of the platform and are trustworthy fiscal hosting organizations."
              id="fiscalHosting.certifiedHosts.p1"
            />
          </p>
          <p className="mb-3 leading-relaxed text-foreground">
            <FormattedMessage
              defaultMessage="The Open Collective platform is owned by the non-profit organization {OficoLink} (OFiCo). OFiCo is governed by member organizations who use and rely on the platform for their day-to-day operations and want to ensure it continues to evolve in alignment with its mission."
              id="fiscalHosting.certifiedHosts.p2"
              values={{
                OficoLink: (
                  <Link href="https://oficonsortium.org" className="underline hover:text-foreground" target="_blank">
                    Open Finance Consortium
                  </Link>
                ),
              }}
            />
          </p>
          <p className="mb-3 leading-relaxed text-foreground">
            <FormattedMessage
              defaultMessage="Member organizations who are also Fiscal Hosts are trusted fiscal hosting partners. They share and follow best fiscal hosting practices in order to provide reliable governance and financial operations."
              id="fiscalHosting.certifiedHosts.p3"
            />
          </p>
          <p className="mb-3 leading-relaxed">
            <FormattedMessage
              defaultMessage="There are many fiscal hosts on the platform for you to choose from. Those that are also OFiCo members and trusted hosts have a yellow checkmark indicator next to their names."
              id="fiscalHosting.certifiedHosts.p4"
            />
          </p>
          <p className="leading-relaxed">
            <FormattedMessage
              defaultMessage="You can read more <DocsLink>about certification in the platform documentation</DocsLink>."
              id="fiscalHosting.certified.readMore"
              values={{
                DocsLink: parts => (
                  <Link
                    href="https://documentation.opencollective.com/fiscal-hosts/certified-member"
                    className="underline hover:text-foreground"
                    target="_blank"
                  >
                    {parts}
                  </Link>
                ),
              }}
            />
          </p>
        </SectionCard>

        {/* ── How to find a Fiscal Host? ────────────────────────────────────── */}
        <SectionCard
          index={5}
          className="bg-[hsla(34,89%,96%)]"
          imgSrc="/static/images/fiscal-hosting/find.png"
          imgWidth={500}
          imgHeight={500}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
            <FormattedMessage defaultMessage="How to find a Fiscal Host?" id="fiscalHosting.findHost.title" />
          </h2>
          <p className="mb-6 leading-relaxed font-medium text-foreground">
            <FormattedMessage
              defaultMessage="To find the right fit, you'll want to consider factors such as legal status, geographic coverage, supported currencies, fees, and the types of projects they are able to host."
              id="fiscalHosting.findHost.intro"
            />
          </p>
          <AccordionItems
            items={findHostItems.map(i => ({
              ...i,
              title: intl.formatMessage(i.title),
              description: intl.formatMessage(i.description),
            }))}
            style={{ '--primary': 'var(--color-yellow-600)' } as React.CSSProperties}
            className="mb-8"
          />
          <Button asChild variant="marketing" className="rounded-full whitespace-nowrap" size="lg">
            <Link href="/search?isHost=true" className="flex items-center gap-2">
              <FormattedMessage defaultMessage="Explore fiscal hosts on the platform" id="fiscalHosting.findHost.cta" />
              <ArrowRight size={16} />
            </Link>
          </Button>
        </SectionCard>
      </div>
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default FiscalHostingPage;
