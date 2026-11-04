import '@testing-library/jest-dom';

jest.mock('next/router', () => {
  const router = {
    pathname: '/',
    route: '/',
    asPath: '/',
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  };
  return {
    __esModule: true,
    default: { router, push: jest.fn(), events: router.events },
    withRouter: Component => Component,
    useRouter: () => router,
  };
});

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../lib/theme';

import { editCommentMutation } from './conversations/graphql';
import InlineEditField from './InlineEditField';

const renderField = () =>
  render(
    <MockedProvider>
      <IntlProvider locale="en" messages={{}}>
        <ThemeProvider theme={theme}>
          <InlineEditField
            mutation={editCommentMutation}
            values={{ id: '1', html: '<p>Original</p>' }}
            field="html"
            canEdit
            showEditIcon
            warnIfUnsavedChanges
            prepareVariables={(values, html) => ({ values: { id: values.id, html } })}
          />
        </ThemeProvider>
      </IntlProvider>
    </MockedProvider>,
  );

describe('InlineEditField', () => {
  it('asks for confirmation when cancelling with unsaved changes', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    const { container } = renderField();

    await userEvent.click(container.querySelector('[data-cy="InlineEditField-Trigger-html"]'));
    await userEvent.type(screen.getByRole('textbox'), ' edited');
    await userEvent.click(container.querySelector('[data-cy="InlineEditField-Btn-Cancel"]'));

    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
