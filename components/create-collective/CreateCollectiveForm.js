import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Field, Form } from 'formik';
import { Flex, Box } from '@rebass/grid';
import { assign, get } from 'lodash';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import themeGet from '@styled-system/theme-get';
import styled from 'styled-components';

import { H1, P } from '../Text';
import Container from '../Container';
import Illustration from '../home/HomeIllustration';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledButton from '../StyledButton';
import MessageBox from '../MessageBox';
import ExternalLink from '../ExternalLink';
import CreateCollectiveCover from '../CreateCollectiveCover';

const BackButton = styled(StyledButton)`
  color: ${themeGet('colors.black.600')};
  font-size: ${themeGet('fontSizes.Paragraph')}px;
`;

const ContainerWithImage = styled(Container)`
  @media screen and (min-width: 40em) {
    background: url('/static/images/create-collective/formIllustration.png');
    background-repeat: no-repeat;
    background-size: 40%;
    background-position: right bottom;
  }
`;

const SubText = styled.p`
  font-size: 1.1rem;
`;

const Span = styled.span`
  &:hover {
    cursor: pointer;
  }
`;

const placeholders = {
  name: 'Agora Collective',
  slug: 'agora',
};

class CreateCollectiveForm extends React.Component {
  static propTypes = {
    error: PropTypes.string,
    host: PropTypes.object,
    query: PropTypes.object,
    collective: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    github: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.githubRepoHelper = this.githubRepoHelper.bind(this);

    const collective = { ...props.collective }; // {}

    this.state = {
      collective,
      tosChecked: false,
      hostTosChecked: false,
    };

    this.messages = defineMessages({
      introduceSubtitle: {
        id: 'createCollective.subtitle.introduce',
        defaultMessage: 'Introduce your Collective to the community.',
      },
      back: {
        id: 'Back',
        defaultMessage: 'Back',
      },
      header: { id: 'home.create', defaultMessage: 'Create a Collective' },
      nameLabel: { id: 'createCollective.form.nameLabel', defaultMessage: "What's the name of your collective?" },
      slugLabel: { id: 'createCollective.form.slugLabel', defaultMessage: 'What URL would you like?' },
      descriptionLabel: {
        id: 'createCollective.form.descriptionLabel',
        defaultMessage: 'What does your collective do?',
      },
      createButton: {
        id: 'collective.create.button',
        defaultMessage: 'Create Collective',
      },
      descriptionPlaceholder: {
        id: 'create.collective.placeholder',
        defaultMessage: 'Making the world a better place',
      },
      errorName: {
        id: 'createCollective.form.error.name',
        defaultMessage: 'Please use fewer than 50 characters',
      },
      errorDescription: {
        id: 'createCollective.form.error.description',
        defaultMessage: 'Please use fewer than 160 characters',
      },
      errorSlug: {
        id: 'createCollective.form.error.slug',
        defaultMessage: 'Please use fewer than 30 characters',
      },
    });
  }

  componentDidMount() {
    const { category, step, hostTos } = this.props.query;
    // first condition is if they are coming from Github stars, second is if they are coming from request manual verification
    if ((category === 'opensource' && step === 'form') || hostTos) {
      this.setState({ hostTosChecked: true });
      this.handleChange('hostTos', true);
    }
  }

  handleChange(fieldname, value) {
    this.setState(state => ({
      collective: {
        ...state.collective,
        [fieldname]: value,
      },
    }));
  }

  githubRepoHelper(repoName) {
    // replaces dash and underscore with space, then capitalises the words
    const formattedName = repoName.replace(/[-_]/g, ' ').replace(/(?:^|\s)\S/g, words => words.toUpperCase());
    return formattedName;
  }

  render() {
    const { intl, error, host, loading, github, query } = this.props;

    const initialValues = {
      name: github ? this.githubRepoHelper(github.repo) : '',
      description: '',
      slug: github ? github.repo : '',
    };

    const validate = values => {
      const errors = {};

      if (values.name.length > 50) {
        errors.name = intl.formatMessage(this.messages.errorName);
      }

      if (values.slug.length > 30) {
        errors.slug = intl.formatMessage(this.messages.errorSlug);
      }

      if (values.description.length > 160) {
        errors.description = intl.formatMessage(this.messages.errorDescription);
      }

      return errors;
    };

    const submit = values => {
      const { description, name, slug } = values;
      const collective = {
        name,
        description,
        slug,
      };
      assign(collective, this.state.collective);
      this.props.onSubmit({ ...collective, slug });
    };

    return (
      <Flex flexDirection="column" m={[3, 0]}>
        {host && host.slug !== 'opensource' && <CreateCollectiveCover host={host} />}
        <Flex flexDirection="column" my={[2, 4]}>
          <Box textAlign="left" minHeight={['32px']} marginLeft={['none', '224px']}>
            <BackButton asLink onClick={() => window && window.history.back()}>
              ←&nbsp;{intl.formatMessage(this.messages.back)}
            </BackButton>
          </Box>
          <Box mb={[2, 3]}>
            <H1
              fontSize={['H5', 'H3']}
              lineHeight={['H5', 'H3']}
              fontWeight="bold"
              textAlign="center"
              color="black.900"
            >
              {intl.formatMessage(this.messages.header)}
            </H1>
          </Box>
          <Box textAlign="center" minHeight={['24px']}>
            <P fontSize="LeadParagraph" color="black.600" mb={2}>
              {intl.formatMessage(this.messages.introduceSubtitle)}
            </P>
          </Box>
        </Flex>
        {error && (
          <Flex alignItems="center" justifyContent="center">
            <MessageBox type="error" withIcon mb={[1, 3]}>
              {error.replace('GraphQL error: ', 'Error: ')}
            </MessageBox>
          </Flex>
        )}
        <Flex alignItems="center" justifyContent="center">
          <ContainerWithImage
            mb={[1, 5]}
            width={[320, 512, 576]}
            border={['none', '1px solid #E6E8EB']}
            borderRadius={['none', '8px']}
            px={[1, 4]}
          >
            <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
              {formik => {
                const { values, handleSubmit, errors, touched } = formik;
                const suggestedSlug = () => {
                  return values.name
                    .trim()
                    .split(' ')
                    .join('-')
                    .toLowerCase();
                };

                const changeSlug = () => {
                  values.slug = suggestedSlug();
                  this.setState(state => ({ ...state, collective: { ...state.collective, slug: values.slug } }));
                };

                return (
                  <Form>
                    <StyledInputField
                      name="name"
                      htmlFor="name"
                      error={touched.name && errors.name}
                      label={intl.formatMessage(this.messages.nameLabel)}
                      value={values.name}
                      required
                      mt={4}
                      mb={3}
                    >
                      {inputProps => <Field as={StyledInput} {...inputProps} placeholder={placeholders.name} />}
                    </StyledInputField>
                    <StyledInputField
                      name="slug"
                      htmlFor="slug"
                      error={touched.slug && errors.slug}
                      label={intl.formatMessage(this.messages.slugLabel)}
                      value={values.slug}
                      required
                      my={3}
                    >
                      {inputProps => (
                        <Field
                          as={StyledInputGroup}
                          {...inputProps}
                          prepend="opencollective.com/"
                          placeholder={placeholders.slug}
                        />
                      )}
                    </StyledInputField>
                    {values.name.length > 0 && (
                      <SubText>
                        Suggested URL :{' '}
                        <Span style={{}} onClick={changeSlug}>
                          {`/${suggestedSlug()}`}
                        </Span>
                      </SubText>
                    )}
                    <StyledInputField
                      name="description"
                      htmlFor="description"
                      error={touched.description && errors.description}
                      label={intl.formatMessage(this.messages.descriptionLabel)}
                      value={values.description}
                      required
                      mt={3}
                      mb={4}
                    >
                      {inputProps => (
                        <Field
                          as={StyledInput}
                          {...inputProps}
                          placeholder={intl.formatMessage(this.messages.descriptionPlaceholder)}
                        />
                      )}
                    </StyledInputField>

                    <Flex flexDirection="column" mx={1} my={4}>
                      <StyledCheckbox
                        name="tos"
                        label={
                          <FormattedMessage
                            id="createcollective.tos.label"
                            defaultMessage="I agree with the {toslink} of Open Collective."
                            values={{
                              toslink: (
                                <ExternalLink href="/tos" openInNewTab>
                                  <FormattedMessage id="tos" defaultMessage="terms of service" />
                                </ExternalLink>
                              ),
                            }}
                          />
                        }
                        required
                        checked={this.state.tosChecked}
                        onChange={({ checked }) => {
                          this.handleChange('tos', checked);
                          this.setState({ tosChecked: checked });
                        }}
                      />
                      {!query.hostTos && get(host, 'settings.tos') && (
                        <StyledCheckbox
                          alignItems="flex-start"
                          name="hostTos"
                          label={
                            <FormattedMessage
                              id="createcollective.hosttos.label"
                              defaultMessage="I agree with the the {hosttoslink} of the host that will collect money on behalf of our collective."
                              values={{
                                hosttoslink: (
                                  <ExternalLink href={get(host, 'settings.tos')} openInNewTab>
                                    <FormattedMessage id="fiscaltos" defaultMessage="terms of fiscal sponsorship" />
                                  </ExternalLink>
                                ),
                              }}
                            />
                          }
                          required
                          checked={this.state.hostTosChecked}
                          onChange={({ checked }) => {
                            this.handleChange('hostTos', checked);
                            this.setState({ hostTosChecked: checked });
                          }}
                        />
                      )}
                    </Flex>

                    <Flex justifyContent={['center', 'left']} mb={4}>
                      <StyledButton
                        fontSize="13px"
                        width="148px"
                        minHeight="36px"
                        buttonStyle="primary"
                        type="submit"
                        loading={loading}
                        onSubmit={handleSubmit}
                      >
                        {intl.formatMessage(this.messages.createButton)}
                      </StyledButton>
                    </Flex>
                  </Form>
                );
              }}
            </Formik>
            <Flex justifyContent="center" mb={4} display={['flex', 'none']}>
              <Illustration
                display={['block', 'none']}
                src="/static/images/create-collective/mobileForm.png"
                width="320px"
                height="200px"
              />
            </Flex>
          </ContainerWithImage>
        </Flex>
      </Flex>
    );
  }
}

export default injectIntl(CreateCollectiveForm);
