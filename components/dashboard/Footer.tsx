import React from 'react';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Github } from '@styled-icons/fa-brands/Github';
import { Mastodon } from '@styled-icons/fa-brands/Mastodon';
import { Slack } from '@styled-icons/fa-brands/Slack';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { Mail } from '@styled-icons/octicons/Mail';
import { truncate } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { space, SpaceProps } from 'styled-system';

import languages from '../../lib/constants/locales';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import Container from '../Container';
import { Flex, Grid } from '../Grid';
import TranslateIcon from '../icons/TranslateIcon';
import Image from '../Image';
import { useLocaleContext } from '../intl/IntlProvider';
import Link from '../Link';
import StyledLink from '../StyledLink';
import StyledSelect from '../StyledSelect';
import StyledTooltip from '../StyledTooltip';
import { P, Span } from '../Text';

const SocialLink = styled.a`
  align-items: center;
  border: 1px solid #dcdee0;
  border-radius: 50%;
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;
  color: #76777a;
  opacity: 1;

  &:hover,
  &:focus {
    opacity: 0.8;
  }
`;

const MenuLink = styled(Link)`
  color: ${props => props.theme.colors.black[700]};
  font-size: 13px;
  line-height: 16px;
  font-weight: 500;
  margin: 0;
  padding: 0;
`;

const FooterContainer = styled.footer.attrs({
  id: 'footer',
})<SpaceProps>`
  display: flex;
  justify-content: center;
  background: white;
  border-top: 1px solid #e8e9eb;
  min-height: 7.5rem;
  width: 100%;
  ${space}
`;

const generateLanguageOptions = () => {
  return Object.keys(languages).map(key => {
    const language = languages[key];
    return {
      value: key,
      label: `${truncate(`${language.name} - ${language.nativeName}`, { length: 23 })} (${language.completion})`,
    };
  });
};

const Footer = () => {
  const localeContext = useLocaleContext();
  const intl = useIntl();
  const languageOptions = React.useMemo(generateLanguageOptions, []);
  const defaultLanguage = languageOptions.find(language => language.value === intl.locale);
  const { LoggedInUser } = useLoggedInUser();
  const formatLanguageOptionLabel = ({ value, label }, { context }) => (
    <Span fontSize="12px" fontWeight={context === 'menu' && value === intl.locale ? 'bold' : 'normal'}>
      {label}
    </Span>
  );

  const useDashboard = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD);

  return (
    <FooterContainer padding={['40px 16px', null, '56px 40px']}>
      <Container
        display="flex"
        flexDirection={['column']}
        justifyContent="space-between"
        alignItems={['center', null, null, 'flex-start']}
        width="100%"
        maxWidth="1280px"
      >
        <Flex
          justifyContent="space-between"
          alignItems={['center', null, 'flex-start']}
          mx={['auto', 3]}
          flexDirection={['column', null, 'row']}
          gap="24px"
          width="100%"
        >
          <Container display="flex" alignItems={['center', null, 'flex-start']} flexDirection="column" maxWidth="300px">
            <Flex>
              <Link href={useDashboard ? '/home' : '/'}>
                <Image
                  src="/static/images/opencollectivelogo-footer-n.svg"
                  alt="Open Collective"
                  height={28}
                  width={167}
                />
              </Link>
            </Flex>
            <P
              mt="12px"
              textAlign={['center', 'left']}
              color="black.800"
              fontSize="12px"
              lineHeight="18px"
              letterSpacing="-0.04px"
            >
              <FormattedMessage id="footer.OC.description" defaultMessage="Make your community sustainable." />
            </P>
          </Container>
          <Container
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width={1}
            maxWidth="230px"
            flexWrap="wrap"
            alignSelf="center"
          >
            {/*
            <SocialLink href="https://blog.opencollective.com/" aria-label="Open Collective Blog link">
              <Blog size={16} />
            </SocialLink>
            */}
            <SocialLink href="https://twitter.com/opencollect" rel="me" aria-label="Open Collective Twitter link">
              <Twitter size={16} />
            </SocialLink>
            <SocialLink
              href="https://mastodon.opencollective.com/@opencollective"
              rel="me"
              aria-label="Open Collective Mastodon link"
            >
              <Mastodon size={16} />
            </SocialLink>
            <SocialLink href="https://github.com/opencollective" rel="me" aria-label="Open Collective Github link">
              <Github size={16} />
            </SocialLink>
            <SocialLink href="https://slack.opencollective.com" aria-label="Open Collective Slack link">
              <Slack size={16} />
            </SocialLink>
            <SocialLink as={Link} href="/contact" aria-label="Contact Open Collective">
              <Mail size={16} />
            </SocialLink>
          </Container>
          <Container textAlign={'left'}>
            <P as="div">
              <TranslateIcon />
              <Span
                mx={2}
                style={{ verticalAlign: 'middle' }}
                fontSize="10px"
                fontWeight="600"
                color="black.800"
                lineHeight="15px"
                letterSpacing="0.8px"
                textTransform="uppercase"
              >
                <FormattedMessage id="footer.changeLanguage" defaultMessage="change language" />
              </Span>
              <StyledTooltip
                content={() => (
                  <FormattedMessage
                    id="Footer.Languages.JoinEffort"
                    defaultMessage="No technical skill is required to contribute to translations. You can join the effort on {crowdinLink} 🌐"
                    values={{
                      crowdinLink: (
                        <StyledLink href="https://crowdin.com/project/opencollective" openInNewTab>
                          Crowdin
                        </StyledLink>
                      ),
                    }}
                  />
                )}
              >
                <InfoCircle size={16} />
              </StyledTooltip>
            </P>
            <Container width="230px" mt={2}>
              <StyledSelect
                inputId="language-options"
                options={languageOptions}
                onChange={({ value }) => localeContext.setLocale(value)}
                defaultValue={defaultLanguage}
                borderRadius="10px"
                menuPlacement="auto"
                width={1}
                formatOptionLabel={formatLanguageOptionLabel}
              />
            </Container>
          </Container>
        </Flex>

        <Grid
          alignSelf={[null, null, 'center']}
          justifyItems={[null, null, 'center']}
          mt={['48px', null, '56px']}
          gridGap={['32px 8px', null, '56px']}
          gridTemplateColumns={[`1fr 1fr`, null, 'repeat(6, 1fr)']}
        >
          <MenuLink href="/home">
            <FormattedMessage id="menu.homepage" defaultMessage="Homepage" />
          </MenuLink>
          <MenuLink href="https://docs.opencollective.com/help/about/introduction">
            <FormattedMessage id="collective.about.title" defaultMessage="About" />
          </MenuLink>
          <MenuLink href="https://blog.opencollective.com/">
            <FormattedMessage id="company.blog" defaultMessage="Blog" />
          </MenuLink>
          <MenuLink href="https://docs.opencollective.com/help/">
            <FormattedMessage id="menu.documentation" defaultMessage="Documentation" />
          </MenuLink>
          <MenuLink href="/privacypolicy">
            <FormattedMessage id="menu.privacyPolicy" defaultMessage="Privacy" />
          </MenuLink>
          <MenuLink href="/tos">
            <FormattedMessage id="menu.termsOfAgreement" defaultMessage="Terms" />
          </MenuLink>
        </Grid>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
