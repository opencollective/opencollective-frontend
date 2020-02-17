import { clamp } from 'lodash';
import config from 'config';
import slackLib from '../lib/slack';

// Watched content. Please keep everything in there lowercase.
const ANALYZED_FIELDS: string[] = ['name', 'website', 'description', 'longDescription'];
const SPAM_KEYWORDS: string[] = ['keto', 'porn', 'pills', 'male enhancement'];
const BLACKLISTED_DOMAINS = [
  'supplementslove.com',
  'supplementspeak.com',
  'fitcareketo.com',
  'supplementgear.com',
  'totalketopills.com',
  'diets2try.com',
  'dragonsdenketo.com',
  'ketovatrudiet.info',
  'completefoods.co',
  'creativehealthcart.com',
  'onnitsupplements.com',
  'topcbdoilhub.com',
  'nutrifitweb.com',
  'healthygossips.com',
  'healthtalkrev.com',
  'allsupplementshop.com',
  'offer4cart.com',
  'hulkpills.com',
  'supplementgo.com',
  'fitnessmegamart.com',
  'healthyaustralia.com.au',
  'healthyslimdiet.com',
  'totaldiet4you.com',
  'trypurenutrition.com',
  'reviewsbox.org',
];

/** Return type when running a spam analysis */
type SpamAnalysisResult = {
  /** A score between 0 and 1. 0=NotSpam, 1=IsSpamForSure */
  score: number;
  /** Detected spam keywords */
  keywords: string[];
  /** Detected blacklisted domains */
  domains: string[];
};

/**
 * Returns suspicious keywords found in content
 */
const getSuspiciousKeywords = (content: string): string[] => {
  if (!content) {
    return [];
  }

  return SPAM_KEYWORDS.reduce((result, keyword) => {
    if (content.toLowerCase().includes(keyword)) {
      result.push(keyword);
    }
    return result;
  }, []);
};
/**
 *
 * Returns blacklisted domains found in content
 */
const getBlacklistedDomains = (content: string): string[] => {
  if (!content) {
    return [];
  }

  return BLACKLISTED_DOMAINS.reduce((result, domain) => {
    if (content.toLowerCase().includes(domain)) {
      result.push(domain);
    }
    return result;
  }, []);
};

/**
 * Checks the values for this collective to try to determinate if it's a spammy profile.
 */
export const collectiveSpamCheck = (collective: object): SpamAnalysisResult => {
  const result = { score: 0, keywords: new Set<string>(), domains: new Set<string>() };
  const scroreByField = 1.0 / ANALYZED_FIELDS.length;

  ANALYZED_FIELDS.forEach(field => {
    // Check each field for SPAM keywords
    const suspiciousKeywords = getSuspiciousKeywords(collective[field] || '');
    if (suspiciousKeywords.length) {
      suspiciousKeywords.forEach(keyword => result.keywords.add(keyword));
      result.score += scroreByField;
    }

    // Check for blacklisted domains
    const blacklitedDomains = getBlacklistedDomains(collective[field] || '');
    if (blacklitedDomains.length) {
      blacklitedDomains.forEach(domain => result.domains.add(domain));
      result.score = 1;
    }
  });

  return {
    score: clamp(result.score, 0, 1),
    keywords: Array.from(result.keywords),
    domains: Array.from(result.domains),
  };
};

const buildSlackAlertMessage = (collective: object, spamAnalysisResult: SpamAnalysisResult): string => {
  const { score, keywords, domains } = spamAnalysisResult;
  let message = `*Suspicious collective data was submitted for collective:* https://opencollective.com/${collective['slug']}`;
  const addLine = (line: string): string => (line ? `${message}\n${line}` : message);

  message = addLine(`Score: ${score}`);
  message = addLine(keywords.length > 0 && `Keywords: \`${keywords.toString()}\``);
  message = addLine(domains.length > 0 && `Domains: \`${domains.toString()}\``);
  return message;
};

/**
 * Post a message on Slack if the collective is suspicious
 */
export const notifyTeamAboutSuspiciousCollective = async (collective: object): Promise<void> => {
  const spamAnalysisResult = collectiveSpamCheck(collective);

  if (spamAnalysisResult.score > 0) {
    const message = buildSlackAlertMessage(collective, spamAnalysisResult);
    return slackLib.postMessage(message, config.slack.webhookUrl, {
      channel: config.slack.abuseChannel,
    });
  }
};
