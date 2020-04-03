import React from 'react';
import PropTypes from 'prop-types';
import Showdown from 'showdown';
import RichTextEditor from '../RichTextEditor';

/**
 * Convert all titles below `h3` to `h3`.
 */
const convertTitlesDown = htmlString => {
  if (!htmlString) {
    return htmlString;
  }

  return htmlString.replace(/<h(1|2)>/g, '<h3>').replace(/<\/h(1|2)>/g, '</h3>');
};

/**
 * Having a conversion with Showdown here will ensure a smooth migration
 * from old collective page that used an (un-documented) markdown description.
 * Once the new collective page becomes the default, we should remove all
 * markdow-related code from the new collective page.
 */
const ReverseCompatibleHTMLEditor = ({ defaultValue, ...props }) => {
  const isMarkdown = defaultValue && defaultValue[0] !== '<';
  const htmlValue = isMarkdown ? new Showdown.Converter().makeHtml(defaultValue) : defaultValue;
  return <RichTextEditor {...props} defaultValue={convertTitlesDown(htmlValue)} />;
};

ReverseCompatibleHTMLEditor.propTypes = {
  defaultValue: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  autoFocus: PropTypes.bool,
};

export default React.memo(ReverseCompatibleHTMLEditor);
