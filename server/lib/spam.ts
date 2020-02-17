import slackLib from '../lib/slack';
import activities from '../constants/activities';

interface Collective {
  id: string;
}

const collectiveCheckList: string[] = ['name', 'website', 'description', 'longDescription'];
const blackList: string[] = ['keto', 'porn', 'pills'];

/**
 * Returns SuspiciousKeywords
 * @param {String} content
 */
const getSuspiciousKeywords = (content: string): string[] => {
  const suspiciousWords = [];
  blackList.forEach(keyword => {
    if (content.includes(keyword)) {
      suspiciousWords.push(keyword);
    }
  });
  return suspiciousWords;
}

export const collectiveSpamCheck = (collective: Collective): null => {
  const result = {
    collective,
    warnings: {},
  };
  collectiveCheckList.forEach(prop => {
    const suspiciousKeywords = getSuspiciousKeywords(collective[prop] || '');
    if (suspiciousKeywords.length) {
      result.warnings[prop] = suspiciousKeywords;
    }
  });

  // Send Notification on Slack
  // TODO: Add WEBHOOK
  if (Object.keys(result).length) {
      slackLib.postActivityOnPublicChannel(
        {
          type: activities.COLLECTIVE_BADWORD_DETECTED,
          data: result,
        },
        'WEBHOOK',
      );
  }
  return null;
}
