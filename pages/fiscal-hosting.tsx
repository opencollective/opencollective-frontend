import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

import Image from '@/components/Image';
import Link from '@/components/Link';
import Page from '../components/Page';
import { Button } from '@/components/ui/Button';

// ─── Internal Components ──────────────────────────────────────────────────────

const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-oc-blue-tints-200 mb-3 inline-block rounded-full px-4 py-1 text-sm font-semibold tracking-wide text-oc-blue-tints-800 uppercase">
    {children}
  </span>
);

type OperatingModelItem = {
  title: string;
  description: string;
};

const ExpandableItem = ({ title, description }: OperatingModelItem) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        className="flex w-full items-center justify-between py-4 text-left text-base font-semibold text-foreground hover:text-oc"
        onClick={() => setOpen(v => !v)}
      >
        <span>{title}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && <p className="pb-4 leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const FiscalHostingPage = () => {
  return (
    <Page
      title="What Is Fiscal Hosting?"
      description="Learn how fiscal hosting works, what a fiscal host is, why you might need one, and how to find the right fit for your community."
    >
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="mt-16 px-4 pb-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6">
            <Image
              src="/static/images/fiscal-hosting/a-place-to-grow-illustration.png"
              width={280}
              height={280}
              alt=""
              style={{ height: undefined }}
            />
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-oc sm:text-5xl md:text-6xl">
            <FormattedMessage defaultMessage="What Is Fiscal Hosting?" id="fiscalHosting.hero.title" />
          </h1>

          <p className="mb-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            <FormattedMessage
              defaultMessage="You have a mission. Maybe it's a community project, an open-source software library, or a local event—but you don't want to set up your own legal entity just to handle money."
              id="fiscalHosting.hero.intro1"
            />
          </p>
          <p className="max-w-2xl text-lg leading-relaxed font-medium text-foreground">
            <FormattedMessage defaultMessage="That's where Fiscal Hosting comes in." id="fiscalHosting.hero.intro2" />
          </p>
        </div>
      </section>

      {/* ── What is a fiscal host? ────────────────────────────────────────── */}
      <section className="bg-[hsl(55,100%,96%)] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">
            <div className="w-full max-w-[260px] shrink-0">
              <Image
                src="/static/images/fiscal-hosting/what-is-a-fiscalhost-illustration.png"
                width={520}
                height={520}
                alt=""
                className="w-full"
                style={{ height: undefined }}
              />
            </div>
            <div className="flex-1">
              <SectionBadge>
                <FormattedMessage defaultMessage="Fundamentals" id="fiscalHosting.badge.fundamentals" />
              </SectionBadge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
                <FormattedMessage defaultMessage="What is a fiscal host?" id="fiscalHosting.whatIsFiscalHost" />
              </h2>
              <p className="mb-3 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="A fiscal host is a legally incorporated organization (typically non-profit) that can hold and manage money on behalf of a project or group that hasn't legally incorporated itself."
                  id="fiscalHosting.whatIsFiscalHost.p1"
                />
              </p>
              <ul className="mb-3 space-y-2 text-foreground">
                {[
                  <FormattedMessage
                    key="1"
                    defaultMessage="The fiscal host holds funds in its bank account on behalf of the project."
                    id="fiscalHosting.whatIsFiscalHost.bullet1"
                  />,
                  <FormattedMessage
                    key="2"
                    defaultMessage="It provides legal status so projects can fundraise, sign contracts, and pay contributors."
                    id="fiscalHosting.whatIsFiscalHost.bullet2"
                  />,
                  <FormattedMessage
                    key="3"
                    defaultMessage="It handles administrative tasks like accounting, taxes, and compliance."
                    id="fiscalHosting.whatIsFiscalHost.bullet3"
                  />,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-oc" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                <FormattedMessage
                  defaultMessage="*Fiscal hosting is also called fiscal sponsorship, fund-holding, or auspicing in different places around the world."
                  id="fiscalHosting.whatIsFiscalHost.note"
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why would you need fiscal hosting? ───────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-start md:gap-16">
            <div className="flex-1">
              <SectionBadge>
                <FormattedMessage defaultMessage="Motivation" id="fiscalHosting.badge.motivation" />
              </SectionBadge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
                <FormattedMessage
                  defaultMessage="Why would you need fiscal hosting?"
                  id="fiscalHosting.whyNeed.title"
                />
              </h2>
              <p className="mb-4 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="If you want to manage money but are not a legally registered entity, you can't just open a bank account in your project's name. That's exactly the problem fiscal hosting solves. Through a fiscal host, you'll be able to:"
                  id="fiscalHosting.whyNeed.intro"
                />
              </p>
              <ul className="mb-4 space-y-3 text-foreground">
                {[
                  <FormattedMessage
                    key="1"
                    defaultMessage="Accept donations, grants, and sponsorships without setting up a legal entity."
                    id="fiscalHosting.whyNeed.bullet1"
                  />,
                  <FormattedMessage
                    key="2"
                    defaultMessage="Pay contributors, reimburse expenses, and make purchases on behalf of your group."
                    id="fiscalHosting.whyNeed.bullet2"
                  />,
                  <FormattedMessage
                    key="3"
                    defaultMessage="Maintain full financial transparency with your community and funders."
                    id="fiscalHosting.whyNeed.bullet3"
                  />,
                  <FormattedMessage
                    key="4"
                    defaultMessage="Stay focused on your mission instead of administrative overhead."
                    id="fiscalHosting.whyNeed.bullet4"
                  />,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-oc" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="leading-relaxed text-muted-foreground">
                <FormattedMessage
                  defaultMessage="Essentially, fiscal hosting unlocks financial tools for groups that wouldn't otherwise have access to them."
                  id="fiscalHosting.whyNeed.conclusion"
                />
              </p>
            </div>
            <div className="w-full max-w-[260px] shrink-0 self-center">
              <Image
                src="/static/images/fiscal-hosting/who-is-fiscalHosting-illustration.png"
                width={448}
                height={288}
                alt=""
                className="w-full"
                style={{ height: undefined }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How does fiscal hosting operate? ─────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-start md:gap-16">
            <div className="w-full max-w-[240px] shrink-0 self-center">
              <Image
                src="/static/images/become-a-host/entity-illustration.png"
                width={480}
                height={480}
                alt=""
                className="w-full"
                style={{ height: undefined }}
              />
            </div>
            <div className="flex-1">
              <SectionBadge>
                <FormattedMessage defaultMessage="How It Works" id="fiscalHosting.badge.howItWorks" />
              </SectionBadge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
                <FormattedMessage
                  defaultMessage="How does fiscal hosting operate?"
                  id="fiscalHosting.howOperate.title"
                />
              </h2>
              <p className="mb-6 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="Fiscal hosting allows you and your group to accept contributions, pay expenses, and get operational right away. The host provides banking, accounting, and legal services under their own entity. There are different models depending on your needs:"
                  id="fiscalHosting.howOperate.intro"
                />
              </p>

              <div className="rounded-xl border border-slate-200 bg-white px-4">
                <ExpandableItem
                  title="Fiscal Host"
                  description="The most common model. The fiscal host is a fully separate legal entity from your project. Your funds are held by the host, they handle compliance and reporting, and you focus entirely on your mission."
                />
                <ExpandableItem
                  title="Managed Fiscal LLC"
                  description="A more integrated model where the fiscal host sets up a dedicated LLC for your project. This provides a greater degree of separation while still leveraging the host's infrastructure and expertise."
                />
                <ExpandableItem
                  title="Simple Trust"
                  description="A lightweight arrangement where the host holds funds on your behalf without complex legal structures. Ideal for smaller, time-limited projects that need a fast path to financial operations."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What is a Collective? ─────────────────────────────────────────── */}
      <section className="bg-[hsl(55,100%,96%)] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">
            <div className="w-full max-w-[240px] shrink-0">
              <Image
                src="/static/images/become-a-host/whoAreFiscalHost-illustration.png"
                width={480}
                height={480}
                alt=""
                className="w-full"
                style={{ height: undefined }}
              />
            </div>
            <div className="flex-1">
              <SectionBadge>
                <FormattedMessage defaultMessage="Terminology" id="fiscalHosting.badge.terminology" />
              </SectionBadge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
                <FormattedMessage defaultMessage="What is a Collective?" id="fiscalHosting.whatIsCollective.title" />
              </h2>
              <p className="mb-3 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage='On the Open Collective platform, we use the term "Collective" to describe a group of people collaboratively managing money around a common goal without being a legal entity.'
                  id="fiscalHosting.whatIsCollective.p1"
                />
              </p>
              <p className="mb-3 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage='A Collective is you "well organised" or "within the fiscal host" — if you find the tools you need to collectively manage and thrive.'
                  id="fiscalHosting.whatIsCollective.p2"
                />
              </p>
              <Button asChild variant="outline" className="mt-2 rounded-full whitespace-nowrap" size="lg">
                <Link href="/collectives" className="flex items-center gap-2">
                  <FormattedMessage
                    defaultMessage="Learn more about Collectives"
                    id="fiscalHosting.whatIsCollective.cta"
                  />
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── What are Certified Fiscal Hosts? ─────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-start md:gap-16">
            <div className="flex-1">
              <SectionBadge>
                <FormattedMessage defaultMessage="Trust & Safety" id="fiscalHosting.badge.trust" />
              </SectionBadge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
                <FormattedMessage
                  defaultMessage="What are Certified Fiscal Hosts?"
                  id="fiscalHosting.certifiedHosts.title"
                />
              </h2>
              <p className="mb-3 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="Certified Fiscal Hosts are pre-vetted by the governance of the platform and are trustworthy fiscal hosting organizations."
                  id="fiscalHosting.certifiedHosts.p1"
                />
              </p>
              <p className="mb-3 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="The certification process ensures that hosts are operating transparently and responsibly. Certified Fiscal Hosts have agreed to Open Collective's terms of service, maintain accurate financial records, and are accountable to the platform and their hosted Collectives."
                  id="fiscalHosting.certifiedHosts.p2"
                />
              </p>
              <p className="leading-relaxed text-muted-foreground">
                <FormattedMessage
                  defaultMessage="When browsing for a fiscal host on Open Collective, look for the Certified badge to identify vetted, reliable organizations that are ready to welcome your Collective."
                  id="fiscalHosting.certifiedHosts.p3"
                />
              </p>
            </div>
            <div className="w-full max-w-[240px] shrink-0 self-center">
              <Image
                src="/static/images/become-a-host/fiscalSponsorship-illustration.png"
                width={480}
                height={480}
                alt=""
                className="w-full"
                style={{ height: undefined }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How to find a Fiscal Host? ────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-start md:gap-16">
            <div className="w-full max-w-[200px] shrink-0 self-start pt-2">
              <Image
                src="/static/images/fiscal-hosting/mission-focus.png"
                width={400}
                height={400}
                alt=""
                className="w-full"
                style={{ height: undefined }}
              />
            </div>
            <div className="flex-1">
              <SectionBadge>
                <FormattedMessage defaultMessage="Getting Started" id="fiscalHosting.badge.gettingStarted" />
              </SectionBadge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-oc sm:text-4xl">
                <FormattedMessage defaultMessage="How to find a Fiscal Host?" id="fiscalHosting.findHost.title" />
              </h2>
              <p className="mb-6 leading-relaxed text-foreground">
                <FormattedMessage
                  defaultMessage="To find the right fit, it's useful to consider the key things you're looking for. Here are the most important criteria to evaluate:"
                  id="fiscalHosting.findHost.intro"
                />
              </p>

              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: <FormattedMessage defaultMessage="Mission alignment" id="fiscalHosting.missionAlignment" />,
                    description: (
                      <FormattedMessage
                        defaultMessage="Fiscal Hosts usually have specific topics or areas they are designed to serve. Look for a host whose mission closely aligns with yours."
                        id="fiscalHosting.findHost.missionAlignment"
                      />
                    ),
                  },
                  {
                    title: <FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />,
                    description: (
                      <FormattedMessage
                        defaultMessage="Which country a fiscal host is based in determines the currency and legal jurisdiction. If applying for an EU grant, for example, you may need an EU-based host."
                        id="fiscalHosting.findHost.location"
                      />
                    ),
                  },
                  {
                    title: <FormattedMessage defaultMessage="Legal structure" id="fiscalHosting.legalStructure" />,
                    description: (
                      <FormattedMessage
                        defaultMessage="A charity structure can enable tax-deductible donations but may restrict certain activities. Consider what structure best fits your project's needs."
                        id="fiscalHosting.findHost.legalStructure"
                      />
                    ),
                  },
                  {
                    title: <FormattedMessage defaultMessage="Fees" id="fiscalHosting.fees" />,
                    description: (
                      <FormattedMessage
                        defaultMessage="Fiscal Hosts often charge a fee for their services. Some keep fees low and offer lightweight service, while others charge more and provide hands-on support."
                        id="fiscalHosting.findHost.fees"
                      />
                    ),
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-1 font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>

              <Button asChild variant="marketing" className="rounded-full whitespace-nowrap" size="lg">
                <Link href="/search?isHost=true" className="flex items-center gap-2">
                  <FormattedMessage defaultMessage="Find a Fiscal Host" id="fiscalHosting.findHost.cta" />
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
};

// next.js export
// ts-unused-exports:disable-next-line
export default FiscalHostingPage;
