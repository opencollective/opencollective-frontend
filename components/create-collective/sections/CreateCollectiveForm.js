import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Field, Form } from 'formik';
import { Flex, Box } from '@rebass/grid';
import { assign } from 'lodash';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';

import { H1, P } from '../../Text';
import Container from '../../Container';
import Illustration from '../../home/HomeIllustration';
import StyledCheckbox from '../../StyledCheckbox';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledInputGroup from '../../StyledInputGroup';
import StyledButton from '../../StyledButton';
import MessageBox from '../../MessageBox';

import { Router } from '../../../server/pages';

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
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);

    const collective = { ...props.collective }; // {}

    this.state = {
      collective,
      checked: false,
    };

    this.messages = defineMessages({
      introduceSubtitle: {
        id: 'createCollective.subtitle.introduce',
        defaultMessage: 'Introduce your Collective to the community.',
      },
      back: {
        id: 'createCollective.link.back',
        defaultMessage: 'Back',
      },
      header: { id: 'createCollective.header.create', defaultMessage: 'Create a Collective' },
      nameLabel: { id: 'createCollective.form.nameLabel', defaultMessage: "What's the name of your collective?" },
      slugLabel: { id: 'createCollective.form.slugLabel', defaultMessage: 'What URL would you like?' },
      descLabel: { id: 'createCollective.form.descLabel', defaultMessage: 'What does your collective do?' },
      createButton: {
        id: 'createCollective.button.create',
        defaultMessage: 'Create Collective',
      },
    });
  }

  handleChange(fieldname, value) {
    if (value === null) {
      this.props.onChange(fieldname, value);
      return;
    }

    const collective = {};

    collective[fieldname] = value;

    this.setState({
      collective: assign(this.state.collective, collective),
    });
  }

  changeRoute = async params => {
    params = {
      ...params,
      verb: this.props.query.verb,
      hostCollectiveSlug: this.props.query.hostCollectiveSlug || undefined,
    };
    await Router.pushRoute('new-create-collective', params);
    window.scrollTo(0, 0);
  };

  render() {
    const { intl, error } = this.props;

    const initialValues = {
      name: '',
      desc: '',
      slug: '',
    };

    const validate = values => {
      const errors = {};

      if (values.name.length > 50) {
        errors.name = 'Please use fewer than 50 characters';
      }

      if (values.slug.length > 30) {
        errors.slug = 'Please use fewer than 30 characters';
      }

      if (values.desc.length > 50) {
        errors.desc = 'Please use fewer than 30 characters';
      }

      return errors;
    };

    const submit = values => {
      const { desc, name, slug } = values;
      const collective = {
        name,
        description: desc,
        slug,
      };
      assign(collective, this.state.collective);
      this.props.onSubmit(collective);
    };

    return (
      <Flex className="CreateCollectiveForm" flexDirection="column" m={[3, 4]}>
        <Flex flexDirection="column" my={[2, 4]}>
          <Box textAlign="left" minHeight={['32px']} width={[null, 832, 950, 1024]}>
            <StyledButton
              asLink
              fontSize="Paragraph"
              color="black.600"
              onClick={() => {
                this.changeRoute({ category: undefined });
                this.handleChange('category', null);
              }}
            >
              ←&nbsp;{intl.formatMessage(this.messages.back)}
            </StyledButton>
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
            <P fontSize="Paragraph" color="black.600" mb={2}>
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
          <Container
            mb={[1, 5]}
            width={[320, 512, 576, null]}
            border={['none', '1px solid #E6E8EB', null, null]}
            borderRadius={['none', '8px', null, null]}
            px={[1, 4]}
          >
            <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
              {formik => {
                const { values, handleSubmit, errors, touched } = formik;

                return (
                  <Form>
                    <StyledInputField
                      name="name"
                      htmlFor="name"
                      error={touched.name && errors.name}
                      label={intl.formatMessage(this.messages.nameLabel)}
                      value={values.name}
                      required
                      my={4}
                    >
                      {inputProps => <Field as={StyledInput} {...inputProps} placeholder="Guinea Pigs United" />}
                    </StyledInputField>
                    <StyledInputField
                      name="slug"
                      htmlFor="slug"
                      error={touched.slug && errors.slug}
                      label={intl.formatMessage(this.messages.slugLabel)}
                      value={values.slug}
                      required
                      my={4}
                    >
                      {inputProps => (
                        <Field
                          as={StyledInputGroup}
                          {...inputProps}
                          prepend="opencollective.com"
                          placeholder="guineapigs"
                        />
                      )}
                    </StyledInputField>
                    <StyledInputField
                      name="desc"
                      htmlFor="desc"
                      error={touched.desc && errors.desc}
                      label={intl.formatMessage(this.messages.descLabel)}
                      value={values.desc}
                      required
                      my={4}
                    >
                      {inputProps => (
                        <Field
                          as={StyledInput}
                          {...inputProps}
                          placeholder="We advocate for tiny piggies everywhere!"
                        />
                      )}
                    </StyledInputField>

                    <Box className="tos" mx={1} my={4}>
                      <StyledCheckbox
                        name="tos"
                        label={
                          <FormattedMessage
                            id="createcollective.tos.label"
                            defaultMessage="I agree with the <toslink>terms of service</toslink> of Open Collective."
                            values={{
                              toslink: msg => (
                                <a href="/tos" target="_blank" rel="noopener noreferrer">
                                  {msg}
                                </a>
                              ),
                            }}
                          />
                        }
                        required
                        checked={this.state.checked}
                        onChange={({ checked }) => {
                          this.handleChange('tos', checked);
                          this.setState({ checked });
                        }}
                      />
                    </Box>
                    <Flex justifyContent={['center', 'left']} mb={4}>
                      <StyledButton
                        buttonSize="small"
                        height="36px"
                        width="148px"
                        buttonStyle="primary"
                        type="submit"
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
                className="formImage"
                src="/static/images/createcollective-mobile-form.png"
                width="320px"
                height="200px"
              />
            </Flex>
          </Container>
        </Flex>
      </Flex>
    );
  }
}

export default injectIntl(CreateCollectiveForm);
