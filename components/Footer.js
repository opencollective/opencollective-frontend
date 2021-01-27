import React from 'react';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Github } from '@styled-icons/fa-brands/Github';
import { Slack } from '@styled-icons/fa-brands/Slack';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { Blog } from '@styled-icons/icomoon/Blog';
import { Mail } from '@styled-icons/octicons/Mail';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import languages from '../lib/constants/locales';

import TranslateIcon from './icons/TranslateIcon';
import Container from './Container';
import { Box, Flex } from './Grid';
import Link from './Link';
import ListItem from './ListItem';
import StyledLink from './StyledLink';
import StyledSelect from './StyledSelect';
import StyledTooltip from './StyledTooltip';
import { P, Span } from './Text';

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

const MenuLink = styled(StyledLink)`
  color: #4e5052;
  display: block;
  font-size: 14px;
  line-height: 17px;
  font-weight: 500;
  letter-spacing: -0.1px;
  margin: 0;
  padding: 0;
`;

const FlexList = styled.ul([], ...Box.componentStyle.rules, ...Flex.componentStyle.rules);

const messages = defineMessages({
  platform: {
    id: 'platform',
    defaultMessage: 'Platform',
  },
  'platform.explainerVideo': {
    id: 'platform.explainerVideo',
    defaultMessage: 'Explainer video',
  },
  'platform.howItWorks': {
    id: 'platform.howItWorks',
    defaultMessage: 'How it works',
  },
  'platform.useCases': {
    id: 'platform.useCases',
    defaultMessage: 'Use Cases',
  },
  'platform.signup': {
    id: 'platform.signup',
    defaultMessage: 'Sign up',
  },
  'platform.login': {
    id: 'platform.login',
    defaultMessage: 'Login',
  },
  join: {
    id: 'join',
    defaultMessage: 'Join',
  },
  'join.createACollective': {
    id: 'home.create',
    defaultMessage: 'Create a Collective',
  },
  'join.discover': {
    id: 'menu.discover',
    defaultMessage: 'Discover',
  },
  'join.findAFiscalHost': {
    id: 'join.findAFiscalHost',
    defaultMessage: 'Find a fiscal host',
  },
  'join.becomeASponsor': {
    id: 'join.becomeASponsor',
    defaultMessage: 'Become a sponsor',
  },
  'join.becomeAHost': {
    id: 'join.becomeAHost',
    defaultMessage: 'Become a host',
  },
  community: {
    id: 'community',
    defaultMessage: 'Community',
  },
  'community.openSource': {
    id: 'community.openSource',
    defaultMessage: 'Open Source',
  },
  'community.docsAndHelp': {
    id: 'menu.docs',
    defaultMessage: 'Docs & Help',
  },
  'community.support': {
    id: 'community.support',
    defaultMessage: 'Support',
  },
  company: {
    id: 'company',
    defaultMessage: 'Company',
  },
  'company.about': {
    id: 'collective.about.title',
    defaultMessage: 'About',
  },
  'company.blog': {
    id: 'company.blog',
    defaultMessage: 'Blog',
  },
  'company.hiring': {
    id: 'company.hiring',
    defaultMessage: 'Hiring',
  },
  'company.termsOfService': {
    id: 'company.termsOfService',
    defaultMessage: 'Terms of service',
  },
  'company.privacyPolicy': {
    id: 'company.privacyPolicy',
    defaultMessage: 'Privacy Policy',
  },
});

const navigation = {
  platform: {
    explainerVideo: 'https://www.youtube.com/watch?v=IBU5fSILAe8',
    howItWorks: '/how-it-works',
    useCases: 'https://blog.opencollective.com/tag/case-studies/',
    signup: '/create-account',
    login: '/signin',
  },
  join: {
    createACollective: '/create',
    discover: '/discover',
    findAFiscalHost: '/hosts',
    becomeASponsor: '/become-a-sponsor',
    becomeAHost: '/become-a-host',
  },
  community: {
    openSource: 'https://github.com/opencollective/opencollective/issues',
    Slack: 'https://slack.opencollective.com',
    docsAndHelp: 'https://docs.opencollective.com',
    support: '/support',
  },
  company: {
    about: 'https://docs.opencollective.com/help/about/introduction',
    blog: 'https://blog.opencollective.com/',
    hiring: '/hiring',
    termsOfService: '/tos',
    privacyPolicy: '/privacypolicy',
  },
};

const switchLanguage = key => {
  document.cookie = `language=${key};path=/`;
  window.location.reload();
  window.scrollTo(0, 0);
};

const FooterContainer = styled.div.attrs({
  id: 'footer',
})`
  display: flex;
  justify-content: center;
  background: white;
  border-top: 1px solid #e8e9eb;
  min-height: 7.5rem;
  width: 100%;
  padding: 1rem;
`;

const Footer = () => {
  const intl = useIntl();
  const languageOptions = Object.keys(languages).map(key => {
    const language = languages[key];
    return {
      value: key,
      label: (
        <Flex
          alignItems="center"
          justifyContent="flex-start"
          fontSize="12px"
          color="black.800"
          lineHeight="18px"
          fontWeight="500"
          letterSpacing="-0.04px"
        >
          <Span fontSize="24px">{language.flag}</Span>&nbsp;
          <Span whiteSpace="nowrap" ml={1}>
            {language.name} - {language.nativeName} ({language.completion})
          </Span>
        </Flex>
      ),
    };
  });
  const defaultLanguage = languageOptions.find(language => language.value === intl.locale);

  return (
    <FooterContainer>
      <Container
        display="flex"
        flexDirection={['column', null, null, null, 'row']}
        justifyContent="space-between"
        alignItems={['center', null, null, null, 'flex-start']}
        width={[1, '650px', null, '671px', '1280px']}
      >
        <Flex
          justifyContent="space-between"
          alignItems={['center', 'flex-start']}
          mx={['auto', 3]}
          flexDirection={['column', 'row', null, null, 'column']}
          css="max-width: 1300px;"
          width={[1, null, null, null, '228px']}
        >
          <Container
            order={[null, null, null, null, '1']}
            display="flex"
            mt={3}
            width={[1, 1 / 3, null, null, 1]}
            alignItems={['center', 'flex-start']}
            flexDirection="column"
            maxWidth="300px"
          >
            <Flex my="12px">
              <img
                src="/static/images/opencollectivelogo-footer-n.svg"
                alt="Open Collective logo"
                height="28px"
                width="167px"
                style={{ maxWidth: '100%' }}
              />
            </Flex>
            <P
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
            order={[null, null, null, null, '3']}
            color="#6E747A"
            textAlign={'left'}
            mt={[4, null, null, null, 0]}
            display={[null, 'none', null, null, 'block']}
          >
            <P as="div" pb={2} pt={2}>
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
            <Container width="230px" my={2}>
              <StyledSelect
                options={languageOptions}
                onChange={({ value }) => switchLanguage(value)}
                defaultValue={defaultLanguage}
                borderRadius="10px"
                menuPlacement="auto"
                isSearchable={false}
                width={1}
              />
            </Container>
          </Container>
          <Container
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width={1}
            my={4}
            order={['2', '3', null, null, '2']}
            maxWidth="230px"
            flexWrap="wrap"
          >
            <SocialLink href="https://blog.opencollective.com/" aria-label="Open Collective Blog link">
              <Blog size={16} />
            </SocialLink>
            <SocialLink href="https://twitter.com/opencollect" aria-label="Open Collective Twitter link">
              <Twitter size={16} />
            </SocialLink>
            <SocialLink href="https://github.com/opencollective" aria-label="Open Collective Github link">
              <Github size={16} />
            </SocialLink>
            <SocialLink href="https://slack.opencollective.com" aria-label="Open Collective Slack Channel link">
              <Slack size={16} />
            </SocialLink>
            <SocialLink href="mailto:info@opencollective.com" aria-label="Email to Open Collective link">
              <Mail size={16} />
            </SocialLink>
          </Container>
        </Flex>
        <Flex
          width={[1, null, null, null, '804px']}
          as="nav"
          flexWrap="wrap"
          justifyContent="center"
          mt={3}
          mx={[null, 3]}
          flex={['1 1 auto', null, null, null, 'none']}
        >
          {Object.keys(navigation).map(key => (
            <Box key={key} width={[0.5, 0.25]} mb={3}>
              <P
                textAlign={['center', 'left']}
                fontSize="10px"
                fontWeight="600"
                lineHeight="15px"
                color="black.800"
                letterSpacing="0.8px"
                textTransform="uppercase"
                mb={[3, '24px']}
              >
                {intl.formatMessage(messages[key])}
              </P>
              <FlexList justifyContent="center" flexDirection="column" pl={0} pr={2}>
                {Object.keys(navigation[key]).map(item => (
                  <ListItem key={item} textAlign={['center', 'left']} mb={2}>
                    {navigation[key][item][0] === '/' ? (
                      <Link route={navigation[key][item]} passHref>
                        <MenuLink>
                          {messages[`${key}.${item}`] ? intl.formatMessage(messages[`${key}.${item}`]) : item}
                        </MenuLink>
                      </Link>
                    ) : (
                      <MenuLink href={navigation[key][item]}>
                        {messages[`${key}.${item}`] ? intl.formatMessage(messages[`${key}.${item}`]) : item}
                      </MenuLink>
                    )}
                  </ListItem>
                ))}
              </FlexList>
            </Box>
          ))}
        </Flex>
        <Container
          width={1}
          color="#6E747A"
          textAlign={'left'}
          mt={3}
          mx={3}
          display={['none', 'block', null, null, 'none']}
        >
          <P as="div" pb={2} pt={2} textTransform="uppercase">
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
          <Container width={['230px']} my={2}>
            <StyledSelect
              data-cy="language-switcher"
              options={languageOptions}
              onChange={({ value }) => switchLanguage(value)}
              defaultValue={defaultLanguage}
              menuPlacement="auto"
            />
          </Container>
        </Container>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
