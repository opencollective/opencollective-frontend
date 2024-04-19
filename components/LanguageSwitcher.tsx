import React from 'react';
import { ExternalLink, LanguagesIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import languages from '../lib/constants/locales';

import { useLocaleContext } from './intl/IntlProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

const generateLanguageOptions = () => {
  return Object.keys(languages).map(key => {
    const language = languages[key];
    const languageLabel =
      language.name === language.nativeName ? language.name : `${language.name} - ${language.nativeName}`;
    return {
      value: key,
      label: languageLabel,
      completion: language.completion,
    };
  });
};

export function LanguageSwitcher() {
  const localeContext = useLocaleContext();
  const intl = useIntl();
  const languageOptions = React.useMemo(generateLanguageOptions, []);
  const defaultLanguage = languageOptions.find(language => language.value === intl.locale) || languageOptions[0];
  return (
    <div className="relative max-w-full">
      <Select onValueChange={value => localeContext.setLocale(value)} defaultValue={defaultLanguage.value}>
        <Tooltip>
          <label className="sr-only" htmlFor="language-options">
            <FormattedMessage id="footer.changeLanguage" defaultMessage="Change language" />
          </label>
          <TooltipTrigger asChild>
            <SelectTrigger data-cy="language-switcher">
              <div className="flex items-center gap-2 overflow-hidden">
                <LanguagesIcon className="flex-shrink-0" size={16} />
                <span className="truncate">
                  <SelectValue
                    aria-label={defaultLanguage.label}
                    placeholder={intl.formatMessage({ defaultMessage: 'Select language', id: 'eVlu1R' })}
                  />
                </span>
              </div>
            </SelectTrigger>
          </TooltipTrigger>

          <SelectContent className="relative max-h-80 max-w-full">
            {languageOptions.map(option => (
              <SelectItem key={option.value} value={option.value} data-cy="language-option">
                <div className="flex max-w-[--radix-popper-anchor-width]  items-center gap-1">
                  <span className="truncate">{option.label}</span>
                  <span>({option.completion})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
          <TooltipContent side="left" sideOffset={8}>
            <FormattedMessage
              id="Footer.Languages.ContributeTranslations"
              defaultMessage="Contribute to translations on {crowdinLink}"
              values={{
                crowdinLink: (
                  <a
                    className="underline"
                    href="https://crowdin.com/project/opencollective"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Crowdin <ExternalLink className="inline-block" size={12} />
                  </a>
                ),
              }}
            />
          </TooltipContent>
        </Tooltip>
      </Select>
    </div>
  );
}
