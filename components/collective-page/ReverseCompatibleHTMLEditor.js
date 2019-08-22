import React from 'react';
import PropTypes from 'prop-types';
import Showdown from 'showdown';
import HTMLEditor from '../HTMLEditor';

/**
 * Having a convertion with Showdown here will ensure a smooth migration
 * from old collective page that used an (un-documented) markdown description.
 * Once the new collective page becomes the default, we should remove all
 * markdow-related code from the new collective page.
 */
const ReverseCompatibleHTMLEditor = props => {
  const defaultValue = props.defaultValue;
  const isMarkdown = defaultValue && defaultValue[0] !== '<';
  const htmlValue = isMarkdown ? new Showdown.Converter().makeHtml(defaultValue) : defaultValue;
  return <HTMLEditor {...props} defaultValue={htmlValue} />;
};

ReverseCompatibleHTMLEditor.propTypes = {
  defaultValue: PropTypes.string,
};

export default ReverseCompatibleHTMLEditor;
