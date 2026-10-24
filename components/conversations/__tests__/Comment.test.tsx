import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { polyfill } from 'interweave-ssr';
import { renderToStaticMarkup } from 'react-dom/server';

import { CommentType } from '../../../lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../../test/providers';

import HTMLContent from '../../HTMLContent';
import Comment from '../Comment';
import Thread from '../Thread';

jest.mock(
  '../../InlineEditField',
  () =>
    ({ children }: { children: (state: { isEditing: boolean }) => React.ReactNode }) =>
      children({ isEditing: false }),
);
jest.mock('../../RichTextEditor', () => () => null);
jest.mock('../CommentMetadata', () => ({ CommentMetadata: () => null }));
jest.mock('../EmojiReactionPicker', () => () => null);
jest.mock('../EmojiReactions', () => () => null);
jest.mock('../../Avatar', () => () => null);
jest.mock('../../AccountHoverCard', () => ({
  ...jest.requireActual<typeof import('../../AccountHoverCard')>('../../AccountHoverCard'),
  AccountHoverCard: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

const html =
  '<p><a href="https://example.org/receipt.png"><img src="https://example.org/receipt.png" alt="Receipt" /></a><a href="https://example.org/details">Details</a></p>';

describe('comment image links', () => {
  it('opens a linked image separately while keeping ordinary comment links unchanged', () => {
    render(
      withRequiredProviders(
        <Comment
          comment={{ id: 'comment-id', createdAt: '2026-10-23', html, type: CommentType.COMMENT }}
          reactions={[]}
          onDelete={jest.fn()}
          onReplyClick={jest.fn()}
        />,
      ),
    );

    const imageLink = screen.getByRole('link', { name: 'Receipt' });
    expect(imageLink).toHaveAttribute('href', 'https://example.org/receipt.png');
    expect(imageLink).toHaveAttribute('target', '_blank');
    expect(imageLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Details' })).not.toHaveAttribute('target');
  });

  it('preserves the default behavior of HTML content outside comments', () => {
    render(withRequiredProviders(<HTMLContent content={html} />));

    expect(screen.getByRole('link', { name: 'Receipt' })).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'Details' })).not.toHaveAttribute('target');
  });

  it('opens linked images separately through the expense drawer small-thread variant', () => {
    render(
      withRequiredProviders(
        <Thread
          variant="small"
          hasMore={false}
          items={[
            { __typename: 'Comment', id: 'comment-id', createdAt: '2026-10-23', html, type: CommentType.COMMENT },
          ]}
          onCommentCreated={jest.fn()}
        />,
      ),
    );

    const imageLink = screen.getByRole('link', { name: 'Receipt' });
    expect(imageLink).toHaveAttribute('target', '_blank');
    expect(imageLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Details' })).not.toHaveAttribute('target');
  });

  it('keeps linked images in the delete preview from replacing the expense page', async () => {
    render(
      withRequiredProviders(
        <Comment
          comment={{ id: 'comment-id', createdAt: '2026-10-23', html, type: CommentType.COMMENT }}
          reactions={[]}
          canDelete
          onDelete={jest.fn()}
          onReplyClick={jest.fn()}
        />,
      ),
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog');
    const imageLink = within(dialog).getByRole('link', { name: 'Receipt' });
    expect(imageLink).toHaveAttribute('target', '_blank');
    expect(imageLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(dialog).getByRole('link', { name: 'Details' })).not.toHaveAttribute('target');
  });

  it('still supports opening all links separately', () => {
    render(withRequiredProviders(<HTMLContent content={html} openLinksInNewTab />));

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});

describe('server-rendered comment image links', () => {
  const originalDocumentFactory = global.INTERWEAVE_SSR_POLYFILL;

  beforeAll(() => polyfill());
  afterAll(() => {
    global.INTERWEAVE_SSR_POLYFILL = originalDocumentFactory;
  });

  it('opens a nested linked image separately with the actual server-side parser', () => {
    const content = document.createElement('div');
    content.innerHTML = renderToStaticMarkup(
      withRequiredProviders(
        <Comment
          comment={{
            id: 'comment-id',
            createdAt: '2026-10-23',
            type: CommentType.COMMENT,
            html: '<p><a href="https://example.org/receipt.png"><span><strong><img src="https://example.org/receipt.png" alt="Receipt" /></strong></span></a><a href="https://example.org/details">Details</a></p>',
          }}
          reactions={[]}
          onDelete={jest.fn()}
          onReplyClick={jest.fn()}
        />,
      ),
    );

    const imageLink = within(content).getByRole('link', { name: 'Receipt' });
    expect(imageLink).toHaveAttribute('href', 'https://example.org/receipt.png');
    expect(imageLink).toHaveAttribute('target', '_blank');
    expect(imageLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(content).getByRole('link', { name: 'Details' })).not.toHaveAttribute('target');
  });

  it.each([false, true])('preserves the all-links setting during server rendering: %s', openLinksInNewTab => {
    const content = document.createElement('div');
    content.innerHTML = renderToStaticMarkup(
      withRequiredProviders(<HTMLContent content={html} openLinksInNewTab={openLinksInNewTab} />),
    );

    for (const link of within(content).getAllByRole('link')) {
      if (openLinksInNewTab) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      } else {
        expect(link).not.toHaveAttribute('target');
      }
    }
  });

  it('opens linked images separately when server-rendering the small-thread variant', () => {
    const content = document.createElement('div');
    content.innerHTML = renderToStaticMarkup(
      withRequiredProviders(
        <Thread
          variant="small"
          hasMore={false}
          items={[
            { __typename: 'Comment', id: 'comment-id', createdAt: '2026-10-23', html, type: CommentType.COMMENT },
          ]}
          onCommentCreated={jest.fn()}
        />,
      ),
    );

    const imageLink = within(content).getByRole('link', { name: 'Receipt' });
    expect(imageLink).toHaveAttribute('target', '_blank');
    expect(imageLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(content).getByRole('link', { name: 'Details' })).not.toHaveAttribute('target');
  });
});
