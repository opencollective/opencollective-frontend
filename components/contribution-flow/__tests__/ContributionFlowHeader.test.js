import React from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import ContributionFlowHeader from '../ContributionFlowHeader';

const buildContributor = id => ({
  id: `contributor-${id}`,
  name: `Contributor ${id}`,
  image: null,
  collectiveSlug: null,
});

const renderHeader = (collective, props = {}) =>
  render(
    withRequiredProviders(
      <ContributionFlowHeader
        collective={{ slug: 'babel', name: 'Babel', ...collective }}
        isEmbed={false}
        {...props}
      />,
    ),
  );

describe('ContributionFlowHeader', () => {
  it('renders the title with a link to the collective page', () => {
    renderHeader({});
    const title = screen.getByRole('heading', { name: 'Contribute to Babel' });
    expect(title.closest('a')).toHaveAttribute('href', '/babel');
  });

  it('does not link to the collective page in embeds', () => {
    renderHeader({}, { isEmbed: true });
    expect(screen.getByRole('heading', { name: 'Contribute to Babel' }).closest('a')).toBeNull();
  });

  it('truncates long collective names in the title, but keeps the full name as tooltip', () => {
    const name = 'A'.repeat(80);
    renderHeader({ name });
    const title = screen.getByRole('heading');
    expect(title).toHaveAttribute('title', name);
    expect(title).toHaveTextContent(`Contribute to ${'A'.repeat(57)}...`);
  });

  it('does not show contributors when there are none', () => {
    renderHeader({ contributors: { totalCount: 0, nodes: [] } });
    expect(screen.queryByText(/other fellow contributors/)).not.toBeInTheDocument();
  });

  it('shows the contributors count without overflow when all contributors are displayed', () => {
    renderHeader({ contributors: { totalCount: 2, nodes: [buildContributor(1), buildContributor(2)] } });
    expect(screen.getByText('Join 2 other fellow contributors')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('shows the number of contributors not displayed', () => {
    renderHeader({ contributors: { totalCount: 42, nodes: [buildContributor(1), buildContributor(2)] } });
    expect(screen.getByText('Join 42 other fellow contributors')).toBeInTheDocument();
    expect(screen.getByText('+ 40')).toBeInTheDocument();
  });
});
