import React from 'react';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Github } from '@styled-icons/fa-brands/Github';
import { Slack } from '@styled-icons/fa-brands/Slack';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { Blog } from '@styled-icons/icomoon/Blog';
import { Mail } from '@styled-icons/octicons/Mail';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import languages from '../lib/constants/locales';
import { Link } from '../server/pages';

import TranslateIcon from './icons/TranslateIcon';
import Container from './Container';
import { Box, Flex } from './Grid';
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
  height: 48px;
  justify-content: center;
  opacity: 0.6;
  width: 48px;

  &:hover,
  &:focus {
    opacity: 1;
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

const navigation = {
  PLATFORM: {
    'Explainer video': 'https://www.youtube.com/watch?v=IBU5fSILAe8',
    'How it Works': '/how-it-works',
    'Use Cases': 'https://blog.opencollective.com/tag/case-studies/',
    'Sign up': '/create-account',
    Login: '/signin',
  },
  JOIN: {
    'Create a Collective': '/create',
    Discover: '/discover',
    'Find a fiscal host': '/hosts',
  },
  COMMUNITY: {
    'Open Source': 'https://github.com/opencollective/opencollective/issues',
    Slack: 'https://slack.opencollective.com',
    'Docs & help': 'https://docs.opencollective.com',
    Support: '/support',
  },
  COMPANY: {
    About: 'https://docs.opencollective.com/help/about/introduction',
    Blog: 'https://blog.opencollective.com/',
    Hiring: '/hiring',
    'Terms of Service': '/tos',
    'Privacy Policy': '/privacypolicy',
  },
};

const switchLanguage = key => {
  document.cookie = `language=${key};path=/`;
  window.location.reload();
  window.scrollTo(0, 0);
};

class Footer extends React.Component {
  render() {
    const languageOptions = Object.keys(languages).map(key => {
      const language = languages[key];
      return {
        value: key,
        label: (
          <Span fontSize="12px" color="black.800" lineHeight="18px" fontWeight="500" letterSpacing="-0.04px">
            {language.flag} {language.name} - {language.nativeName} ({language.completion})
          </Span>
        ),
      };
    });

    return (
      <Flex
        id="footer"
        background="white"
        borderTop="1px solid #E8E9EB"
        bottom={0}
        minHeight="7.5rem"
        p="1rem"
        width={1}
        justifyContent="center"
      >
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
              <Flex>
                <object
                  type="image/svg+xml"
                  data="/static/images/opencollectivelogo-footer-n.svg"
                  height="20"
                  style={{ maxWidth: '100%' }}
                />
              </Flex>
              <P
                textAlign={['center', 'left']}
                color="black.800"
                fontSize={['12px']}
                lineHeight={['18px']}
                letterSpacing={['-0.04px']}
                py={2}
              >
                <FormattedMessage id="footer.OC.description" defaultMessage="Make your community sustainable." />
              </P>
            </Container>
            <Container
              order={[null, null, null, null, '3']}
              color="#6E747A"
              textAlign={'left'}
              mt={3}
              display={[null, 'none', null, null, 'block']}
            >
              <P
                as="div"
                fontSize="10px"
                fontWeight="600"
                color="black.800"
                lineHeight="15px"
                letterSpacing="0.8px"
                pb={2}
                pt={2}
                textTransform="uppercase"
              >
                <TranslateIcon />
                <Span mx={2} style={{ verticalAlign: 'middle' }}>
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
              <Container width={['220px']} my={2}>
                <StyledSelect
                  options={languageOptions}
                  onChange={({ value }) => switchLanguage(value)}
                  defaultValue={languageOptions[0]}
                />
              </Container>
            </Container>
            <Container
              display="flex"
              justifyContent="space-evenly"
              alignItems="center"
              width={1}
              my={3}
              order={['2', '3', null, null, '2']}
              maxWidth="288px"
            >
              <SocialLink href="https://blog.opencollective.com/">
                <Blog size={17} color="#76777A" />
              </SocialLink>
              <SocialLink href="https://twitter.com/opencollect">
                <Twitter size={17} color="#76777A" />
              </SocialLink>
              <SocialLink href="https://github.com/opencollective">
                <Github size={17} color="#76777A" />
              </SocialLink>
              <SocialLink href="https://slack.opencollective.com">
                <Slack size={17} color="#76777A" />
              </SocialLink>
              <SocialLink href="mailto:info@opencollective.com">
                <Mail size={19} color="#76777A" />
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
                  color={['black.800', 'black.500']}
                  letterSpacing="0.8px"
                  pb={3}
                >
                  {key}
                </P>
                <FlexList justifyContent="center" flexDirection="column" pl={0} pr={2}>
                  {Object.keys(navigation[key]).map(item => (
                    <ListItem key={item} textAlign={['center', 'left']} mb={2}>
                      {navigation[key][item][0] === '/' ? (
                        <Link route={navigation[key][item]} passHref>
                          <MenuLink>{item}</MenuLink>
                        </Link>
                      ) : (
                        <MenuLink href={navigation[key][item]}>{item}</MenuLink>
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
            <P
              as="div"
              fontSize="10px"
              fontWeight="600"
              color="black.800"
              lineHeight="15px"
              letterSpacing="0.8px"
              pb={2}
              pt={2}
              textTransform="uppercase"
            >
              <TranslateIcon />
              <Span mx={2} style={{ verticalAlign: 'middle' }}>
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
            <Container width={['220px']} my={2}>
              <StyledSelect
                data-cy="language-switcher"
                options={languageOptions}
                onChange={({ value }) => switchLanguage(value)}
                defaultValue={languageOptions[0]}
              />
            </Container>
          </Container>
        </Container>
      </Flex>
    );
  }
}

export default Footer;
