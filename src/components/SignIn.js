import PropTypes from 'prop-types';
import { withState } from 'recompose';

import { Box, Flex } from '@rebass/grid';
import Container from './Container';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledInput from './StyledInput';
import { H5, P, Span } from './Text';

/**
 * Component for handing user sign-in or redirecting to sign-up
 */
const SignIn = withState('state', 'setState', { email: '', error: null })(
  ({ state, setState, onSubmit, onSecondaryAction }) => (
    <StyledCard maxWidth={450}>
      <Box p={4}>
        <H5 as="label" fontWeight="bold" htmlFor="email" mb={3} textAlign="left" display="block">
          Sign in using your email address:
        </H5>
        <Flex
          as="form"
          method="POST"
          novalidate
          onSubmit={event => {
            event.preventDefault();
            onSubmit(state.email);
          }}
        >
          <StyledInput
            error={!!state.error}
            fontSize="Paragraph"
            id="email"
            name="email"
            onChange={({ target }) => setState({ email: target.value, error: null })}
            onInvalid={event => {
              event.preventDefault();
              setState({ ...state, error: event.target.validationMessage });
            }}
            placeholder="i.e. yourname@yourhost.com"
            required
            type="email"
            width={1}
          />
          <StyledButton
            buttonStyle="primary"
            fontWeight="600"
            disabled={!state.email}
            minWidth={100}
            ml={3}
            type="submit"
          >
            Sign In
          </StyledButton>
        </Flex>
        {state.error && (
          <Span display="block" color="red.500" pt={2} fontSize="Tiny" lineHeight="Tiny" aria-live="polite">
            {state.error}
          </Span>
        )}
      </Box>

      <Container alignItems="center" bg="black.50" px={4} py={3} display="flex" justifyContent="space-between">
        <P color="black.700">Don&apos;t have an account?</P>
        <StyledButton fontWeight="600" onClick={onSecondaryAction}>
          Join Free
        </StyledButton>
      </Container>
    </StyledCard>
  ),
);

SignIn.propTypes = {
  /** handles the email input submission, a.k.a Sign In */
  onSubmit: PropTypes.func.isRequired,
  /** handles the redirect from sign-in, a.k.a Join Free */
  onSecondaryAction: PropTypes.func.isRequired,
};

export default SignIn;
