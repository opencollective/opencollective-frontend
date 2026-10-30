import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../test/providers';

import { TagInput } from './TagInput';

const TagInputHarness = ({
  initialTags = [],
  suggestedTags = [],
  onChange,
}: {
  initialTags?: string[];
  suggestedTags?: string[];
  onChange?: (tags: string[]) => void;
}) => {
  const [tags, setTags] = React.useState<string[]>(initialTags);
  return (
    <TagInput
      value={tags}
      onChange={newTags => {
        setTags(newTags);
        onChange?.(newTags);
      }}
      suggestedTags={suggestedTags}
    />
  );
};

const renderTagInput = (props = {}) => render(withRequiredProviders(<TagInputHarness {...props} />));

const getInput = () => screen.getByPlaceholderText('+ Add tags');

describe('TagInput', () => {
  it('adds tags on Enter and on comma, and clears the input', () => {
    renderTagInput();

    fireEvent.change(getInput(), { target: { value: 'opensource' } });
    fireEvent.keyDown(getInput(), { key: 'Enter' });
    expect(screen.getByText('opensource')).toBeInTheDocument();
    expect(getInput()).toHaveValue('');

    fireEvent.change(getInput(), { target: { value: 'community' } });
    fireEvent.keyDown(getInput(), { key: ',' });
    expect(screen.getByText('community')).toBeInTheDocument();
    expect(getInput()).toHaveValue('');
  });

  it('ignores empty and duplicate tags', () => {
    const onChange = jest.fn();
    renderTagInput({ onChange });

    fireEvent.change(getInput(), { target: { value: '   ' } });
    fireEvent.keyDown(getInput(), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(getInput(), { target: { value: 'opensource' } });
    fireEvent.keyDown(getInput(), { key: 'Enter' });
    fireEvent.change(getInput(), { target: { value: 'opensource' } });
    fireEvent.keyDown(getInput(), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(['opensource']);
    expect(screen.getAllByText('opensource')).toHaveLength(1);
  });

  it('splits pasted values that contain commas', () => {
    renderTagInput();

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', { value: { getData: () => 'design, community' } });
    fireEvent(getInput(), pasteEvent);

    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.getByText('community')).toBeInTheDocument();
  });

  it('removes tags with the cross button', () => {
    renderTagInput({ initialTags: ['design', 'community'] });

    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(screen.queryByText('design')).not.toBeInTheDocument();
    expect(screen.getByText('community')).toBeInTheDocument();
  });

  it('removes the last tag with Backspace when the input is empty', () => {
    renderTagInput({ initialTags: ['design', 'community'] });

    fireEvent.keyDown(getInput(), { key: 'Backspace' });

    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.queryByText('community')).not.toBeInTheDocument();
  });

  it('toggles suggested tags on click', () => {
    renderTagInput({ suggestedTags: ['opensource', 'community'] });

    const suggestion = screen.getByRole('button', { name: 'opensource' });
    expect(suggestion).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(suggestion);
    expect(screen.getByRole('button', { name: 'opensource' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('opensource')).toHaveLength(2); // Suggestion + tag badge

    fireEvent.click(screen.getByRole('button', { name: 'opensource' }));
    expect(screen.getAllByText('opensource')).toHaveLength(1); // Only the suggestion remains
    expect(screen.getByRole('button', { name: 'opensource' })).toHaveAttribute('aria-pressed', 'false');
  });
});
