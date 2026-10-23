import React from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import HTMLContent from '../../HTMLContent';
import Comment from '../Comment';

jest.mock(
  '../../InlineEditField',
  () =>
    ({ children }) =>
      children({ isEditing: false }),
);
jest.mock('../../RichTextEditor', () => () => null);
jest.mock('../CommentActions', () => () => null);
jest.mock('../CommentMetadata', () => ({ CommentMetadata: () => null }));
jest.mock('../EmojiReactionPicker', () => () => null);
jest.mock('../EmojiReactions', () => () => null);
jest.mock('../SmallComment', () => () => null);

const html =
  '<p><a href="https://example.org/receipt.png"><img src="https://example.org/receipt.png" alt="Receipt" /></a><a href="https://example.org/details">Details</a></p>';

describe('comment image links', () => {
  it('opens a linked image separately while keeping ordinary comment links unchanged', () => {
    render(withRequiredProviders(<Comment comment={{ id: 'comment-id', createdAt: '2026-10-23', html }} />));

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

  it('still supports opening all links separately', () => {
    render(withRequiredProviders(<HTMLContent content={html} openLinksInNewTab />));

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
