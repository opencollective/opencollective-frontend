import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import { compose } from '../../../lib/utils';

import Container from '../../Container';
import { Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import MessageBox from '../../MessageBox';
import { PasswordInput } from '../../PasswordInput';
import { PasswordStrengthBar } from '../../PasswordStrengthBar';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import { H3, P } from '../../Text';
import { TwoFactorAuthenticationSettings } from '../../two-factor-authentication/TwoFactorAuthenticationSettings';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/useToast';
import { withUser } from '../../UserProvider';

class UserSecurity extends React.Component {
  static propTypes = {
    /** From graphql query */
    setPassword: PropTypes.func.isRequired,
    /** From withUser */
    LoggedInUser: PropTypes.shape({
      isRoot: PropTypes.bool.isRequired,
      hasPassword: PropTypes.bool.isRequired,
      hasRole: PropTypes.func.isRequired,
      email: PropTypes.string.isRequired,
    }),
    login: PropTypes.func.isRequired,
    refetchLoggedInUser: PropTypes.func.isRequired,
    data: PropTypes.shape({
      individual: PropTypes.object,
      loading: PropTypes.bool,
    }),
    /** From parent component */
    slug: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      /* Password management state */
      passwordLoading: false,
      passwordError: null,
      currentPassword: '',
      password: '',
      passwordKey: 1,
      passwordScore: null,
    };

    this.setPassword = this.setPassword.bind(this);
    this.hasTriggeredScroll = false;
  }

  componentDidUpdate() {
    if (window.location.hash && !this.hasTriggeredScroll && !this.props.data.loading) {
      this.hasTriggeredScroll = true;
      const section = document.querySelector(window.location.hash);
      section.scrollIntoView();
    }
  }

  async setPassword() {
    const { password, passwordKey, currentPassword, passwordScore } = this.state;

    if (password === currentPassword) {
      this.setState({
        passwordError: (
          <FormattedMessage defaultMessage="New password can't be the same as current password" id="ne9Dbl" />
        ),
      });
      return;
    }

    if (passwordScore <= 1) {
      this.setState({
        passwordError: (
          <FormattedMessage
            defaultMessage="Password is too weak. Try to use more characters or use a password manager to generate a strong one."
            id="C2rcD0"
          />
        ),
      });
      return;
    }

    try {
      this.setState({ passwordLoading: true });
      const hadPassword = this.props.LoggedInUser.hasPassword;
      const result = await this.props.setPassword({ variables: { password, currentPassword } });
      if (result.data.setPassword.token) {
        await this.props.login(result.data.setPassword.token);
      }
      await this.props.refetchLoggedInUser();
      this.setState({
        currentPassword: '',
        password: '',
        passwordError: null,
        passwordScore: null,
        passwordLoading: false,
        passwordKey: Number(passwordKey) + 1,
      });
      toast({
        variant: 'success',
        message: hadPassword ? (
          <FormattedMessage defaultMessage="Password successfully updated" id="6oGOC9" />
        ) : (
          <FormattedMessage defaultMessage="Password successfully set" id="cLP25w" />
        ),
      });
    } catch (e) {
      this.setState({ passwordError: e.message, passwordLoading: false });
    }
  }

  renderPasswordManagement() {
    const { LoggedInUser } = this.props;
    const { password, passwordError, passwordLoading, passwordKey, currentPassword } = this.state;

    return (
      <Fragment>
        <H3 fontSize="18px" fontWeight="700" mb={2}>
          <FormattedMessage id="Password" defaultMessage="Password" />
        </H3>
        {passwordError && (
          <MessageBox type="error" withIcon my={2} data-cy="password-error">
            {passwordError}
          </MessageBox>
        )}
        <Container mb="4">
          <P py={2} mb={2}>
            {LoggedInUser.hasPassword ? (
              <FormattedMessage
                id="Password.Change.Info"
                defaultMessage="You already have a password set, you can change it using the following form."
              />
            ) : (
              <FormattedMessage
                id="Password.Set.Info"
                defaultMessage="Setting a password is optional but can be useful if you're using a password manager."
              />
            )}
          </P>

          {/* We're adding a hidden email field to helper password managers remember the credentials */}
          <StyledInput
            style={{ display: 'none' }}
            id="email"
            autoComplete="email"
            name="email"
            value={LoggedInUser.email}
            type="email"
          />

          {LoggedInUser.hasPassword && (
            <StyledInputField
              label={<FormattedMessage defaultMessage="Current Password" id="GretYf" />}
              labelFontWeight="bold"
              htmlFor="current-password"
              mb={2}
              width="100%"
            >
              <PasswordInput
                key={`current-password-${passwordKey}`}
                id="current-password"
                name="current-password"
                required
                onChange={e => {
                  this.setState({ passwordError: null, currentPassword: e.target.value });
                }}
              />
            </StyledInputField>
          )}

          <StyledInputField
            label={<FormattedMessage defaultMessage="New Password" id="Ev6SEF" />}
            labelFontWeight="bold"
            htmlFor="new-password"
            mt={2}
            mb={2}
            width="100%"
            hint={
              <FormattedMessage
                defaultMessage="Strong password recommended. Short or weak one restricted. <link>The strength of a password is a function of length, complexity, and unpredictability.</link>"
                id="qaIW32"
                values={{
                  link: getI18nLink({
                    href: 'https://en.wikipedia.org/wiki/Password_strength',
                    openInNewTab: true,
                  }),
                }}
              />
            }
          >
            <PasswordInput
              key={`current-password-${passwordKey}`}
              id="new-password"
              name="new-password"
              required
              onChange={e => {
                this.setState({ passwordError: null, password: e.target.value });
              }}
            />
          </StyledInputField>

          <div data-cy="password-strength-bar">
            <PasswordStrengthBar
              password={password}
              onChangeScore={passwordScore => {
                this.setState({ passwordScore });
              }}
            />
          </div>

          <Button
            variant="outline"
            size="default"
            className="mt-3"
            loading={passwordLoading}
            disabled={!password || (LoggedInUser.hasPassword && !currentPassword)}
            onClick={this.setPassword}
          >
            {LoggedInUser.hasPassword ? (
              <FormattedMessage id="Security.UpdatePassword.Button" defaultMessage="Update Password" />
            ) : (
              <FormattedMessage id="Security.SetPassword.Button" defaultMessage="Set Password" />
            )}
          </Button>
        </Container>
      </Fragment>
    );
  }

  render() {
    const { data } = this.props;
    const { loading } = data;

    if (loading) {
      return <Loading />;
    }

    const account = get(data, 'individual', null);
    const twoFactorMethods = get(account, 'twoFactorMethods', []) || [];

    return (
      <Flex flexDirection="column">
        {this.renderPasswordManagement()}

        <H3 id="two-factor-auth" fontSize="18px" fontWeight="700" mb={3}>
          <FormattedMessage id="TwoFactorAuth" defaultMessage="Two-factor authentication" />
        </H3>
        <TwoFactorAuthenticationSettings individual={account} userTwoFactorAuthenticationMethods={twoFactorMethods} />
      </Flex>
    );
  }
}

const accountHasTwoFactorAuthQuery = gql`
  query AccountHasTwoFactorAuth($slug: String) {
    individual(slug: $slug) {
      id
      slug
      name
      type
      email
      hasTwoFactorAuth
      twoFactorMethods {
        id
        method
        name
        createdAt
        description
        icon
      }
    }
  }
`;

const setPasswordMutation = gql`
  mutation SetPassword($password: String!, $currentPassword: String) {
    setPassword(password: $password, currentPassword: $currentPassword) {
      individual {
        id
        hasPassword
      }
      token
    }
  }
`;

const addGraphql = compose(
  graphql(setPasswordMutation, {
    name: 'setPassword',
    options: { context: API_V2_CONTEXT },
  }),
  graphql(accountHasTwoFactorAuthQuery, {
    options: props => ({
      context: API_V2_CONTEXT,
      variables: {
        slug: props.slug,
      },
    }),
  }),
);

export default withUser(addGraphql(UserSecurity));
