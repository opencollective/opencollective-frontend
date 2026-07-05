import * as fs from 'fs';
import * as path from 'path';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LANG_DIR = path.resolve(__dirname, '../../lang');

/**
 * English message values that are intentionally identical in the locale (same word,
 * loanword, brand, etc.). Excludes them from the "still English" report. Match is
 * exact (full string equals English).
 */
const IGNORED: Record<string, readonly string[]> = {
  'pt-BR': [
    'Amount', // "{amount} {currencyCode}" - formato idêntico
    'Avatar', // "Avatar" - termo idêntico
    'Collective.Hero.Host', // "{FiscalHost}: {hostName}" - componente traduz o rótulo
    'company.blog', // "Blog" - identico
    'contributions.id', // "#" - identico
    'ContributeCard.BtnEvent', // "RSVP" - termo comum em eventos
    'editCollective.menu.webhooks', // "Webhooks" - termo técnico
    'Exports', // "Exports" - termo técnico comum
    'Fields.id', // "ID" - identico
    'Fields.slug', // "Slug" - termo técnico
    'KYC', // "KYC" - acrônimo
    'Q0lxqm', // "CVV/CVC" - identico
    'Stripe.PaymentMethod.Label.bancontact', // "Bancontact" - nome de marca
    'Stripe.PaymentMethod.Label.link', // "Link" - nome de marca
    'Stripe.PaymentMethod.Label.swish', // "Swish" - nome de marca
    'tax.gstShort', // "GST" - acrônimo
  ],
  fr: [
    'qMePPG',
    'LseLoM',
    'Logo',
    'profile.incognito',
    'Type', // key id equals "Type" in en
    'Timezone.Local',
    'tier.interval.flexible',
    '+U6ozc', // "Type" - même terme en français
    '0LK5eg', // "Contribution" - identique
    '1+ROfp', // "Transaction" - identique (finance)
    'AccountingCategory.code', // "Code" - identique
    'AddFundsModal.source', // "Source" - identique
    'AdminPanel.button', // "Admin" - libellé court conservé
    'Amount', // "{amount} {currencyCode}" - format identique
    'Avatar', // "Avatar" - terme identique
    'asqGnV', // "Solutions" - identique en français
    'collective.category.association', // "Association" - identique
    'collective.category.meetup', // "Meetup" - nom propre courant
    'CollectivePage.NavBar.ActionMenu.Actions', // "Actions" - identique
    'CollectivePage.NavBar.Participants', // "Participants" - identique
    'community.openSource', // "Open Source" - terme standard conservé
    'company.blog', // "Blog" - identique
    'Contact', // "Contact" - identique
    'Contact.Message', // "Message" - identique
    'Contributions', // "Contributions" - identique
    'contributions.id', // "#" - identique
    'ContributionType.Ticket', // "Ticket" - identique (billet)
    'conversations', // "Conversations" - identique
    'Email', // "Email" - identique
    'expense.incurredAt', // "Date" - identique
    'expense.notes', // "Notes" - identique
    'Expense.type', // "Type" - identique
    'expense.type', // "Type" - identique
    'event.sponsors.title', // "Sponsors" - identique
    'editCollective.menu.webhooks', // "Webhooks" - terme technique courant
    'E80WrK', // "Information" - identique
    'DZ2Koj', // "Direction" - identique
    'Exports', // "Exports" - identique
    'FAQ', // "FAQ" - acronyme identique
    'Fields.description', // "Description" - identique
    'Fields.id', // "ID" - identique
    'Fields.slug', // "Slug" - terme technique identique
    'Fields.type', // "Type" - identique
    'gegfoA', // "Conversation" - identique
    'giftCards.description', // "DESCRIPTION" - identique
    'GM/hd6', // "Invitation" - identique
    'goal.type.label', // "Type" - identique
    'header.options', // "Options" - identique
    'HostApplication.ProjectTypeSelect.code', // "Code" - identique
    'Hv0XJn', // "Suggestions" - identique
    'KYC', // "KYC" - acronyme identique
    'MJ2jZQ', // "Total" - identique
    'n7yYXG', // "Service" - identique
    'menu.documentation', // "Documentation" - identique
    'menu.transactions', // "Transactions" - identique
    'NewContributionFlow.CollectiveAndTier', // "{collective} - {tier}" - format identique
    'paymentMethods.labelCreditCard', // "{name} {expiration}" - format identique
    'paymentReceipt.transaction', // "Transaction(s)" - identique
    'Public', // "Public" - identique
    'Q0lxqm', // "CVV/CVC" - identique
    'r+dgiv', // "Taxes" - identique
    'section.budget.title', // "Budget" - identique
    'section.tickets.title', // "Tickets" - identique
    'Stripe.PaymentMethod.Label.bancontact', // "Bancontact" - nom de marque
    'Stripe.PaymentMethod.Label.link', // "Link" - nom de marque
    'Stripe.PaymentMethod.Label.swish', // "Swish" - nom de marque
    'Tags', // "Tags" - identique
    'Tags.OPEN_SOURCE', // "Open source" - terme standard
    'tax.gstShort', // "GST" - acronyme
    'tier.name.sponsor', // "sponsor" - terme courant
    'tier.Pro.title', // "Pro" - identique
    'tier.type.label', // "Type" - identique
    'Timezone.UTC', // "UTC" - identique
    'total', // "total" - identique
    'VirtualCards.CVV', // "CVV" - identique
    'Warning.Important', // "Important" - identique
    'X3AIiK', // "Europe" - identique
    'sV2v5L', // "Instructions" - identique
    'tZEZGT', // "{n, plural, one {1 contribution} other {{n} contributions}}" - identique
  ],
};

function loadJson(filePath: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as Record<string, string>;
}

type UntranslatedEntry = {
  id: string;
  english: string;
};

type TranslationStats = {
  total: number;
  translated: number;
  untranslated: number;
  completionPercent: number;
};

function isUntranslated(id: string, english: string, value: string | undefined, ignoredIds: Set<string>): boolean {
  return value !== undefined && value === english && !ignoredIds.has(id);
}

export function getUntranslatedEntries(
  en: Record<string, string>,
  translated: Record<string, string>,
  locale: string,
): UntranslatedEntry[] {
  const ignoredForLocale = new Set(IGNORED[locale] ?? []);
  const entries: UntranslatedEntry[] = [];

  for (const id of Object.keys(en)) {
    const english = en[id];
    const value = translated[id];
    if (isUntranslated(id, english, value, ignoredForLocale)) {
      entries.push({ id, english });
    }
  }

  return entries;
}

function getTranslationStats(en: Record<string, string>, translated: Record<string, string>): TranslationStats {
  const total = Object.keys(en).length;
  let untranslated = 0;

  for (const key of Object.keys(en)) {
    if (!(key in translated) || translated[key] === en[key]) {
      untranslated++;
    }
  }

  const translatedCount = total - untranslated;
  const completionPercent = total === 0 ? 100 : Math.round((translatedCount / total) * 100);

  return {
    total,
    translated: translatedCount,
    untranslated,
    completionPercent,
  };
}

export function loadEnglishMessages(): Record<string, string> {
  return loadJson(path.join(LANG_DIR, 'en.json'));
}

export function loadLocaleMessages(locale: string): Record<string, string> | null {
  const localePath = path.join(LANG_DIR, `${locale}.json`);
  if (!fs.existsSync(localePath)) {
    return null;
  }

  return loadJson(localePath);
}

export function getLocaleTranslationStats(locale: string): TranslationStats | null {
  const en = loadEnglishMessages();
  if (locale === 'en') {
    const total = Object.keys(en).length;
    return { total, translated: total, untranslated: 0, completionPercent: 100 };
  }

  const translated = loadLocaleMessages(locale);
  if (!translated) {
    return null;
  }

  return getTranslationStats(en, translated);
}
