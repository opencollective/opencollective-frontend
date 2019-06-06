import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { defineMessages, FormattedMessage } from 'react-intl';
import { pick, get } from 'lodash';
import { Box } from '@rebass/grid';

import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledButton from './StyledButton';
import Container from './Container';
import StyledCheckbox from './StyledCheckbox';

import storage from '../lib/storage';
import withIntl from '../lib/withIntl';

const UpdateFormWrapper = styled(Container)`
  width: 100%;
`;

// Dynamic imports: this components have a huge impact on bundle size and are externalized
// We use the DYNAMIC_IMPORT env variable to skip dynamic while using Jest
let HTMLEditor, MarkdownEditor;
if (process.env.DYNAMIC_IMPORT) {
  HTMLEditor = dynamic(() => import(/* webpackChunkName: 'HTMLEditor' */ './HTMLEditor'));
  MarkdownEditor = dynamic(() => import(/* webpackChunkName: 'MarkdownEditor' */ './MarkdownEditor'));
} else {
  HTMLEditor = require('./HTMLEditor').default;
  MarkdownEditor = require('./MarkdownEditor').default;
}

class EditUpdateForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    update: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.messages = defineMessages({
      'title.label': { id: 'updates.new.title.label', defaultMessage: 'Title' },
    });

    this.state = {
      modified: false,
      update: props.update ? pick(props.update, 'title', 'html', 'markdown', 'isPrivate') : {},
      loading: false,
    };

    this.storageKey = `EditUpdateForm#${get(this.props, 'update.id') || get(this.props, 'collective.slug')}`;
  }

  componentDidMount() {
    const savedState = storage.get(this.storageKey);
    if (savedState && !this.props.update) {
      console.log('>>> restoring EditUpdateForm state', savedState);
      this.setState(savedState);
    }
    this._isMounted = true;
    this.forceUpdate();
  }

  handleChange(attr, value) {
    const update = {
      ...this.state.update,
      [attr]: value,
    };
    const newState = { modified: true, update };
    storage.set(this.storageKey, newState);
    this.setState(newState);
    this.props.onChange && this.props.onChange(update);
  }

  async onSubmit(e) {
    this.setState({ loading: true });
    if (e) {
      e.preventDefault();
    }
    try {
      await this.props.onSubmit(this.state.update);
      this.setState({ modified: false, loading: false });
      storage.set(this.storageKey, null);
    } catch (e) {
      this.setState({ loading: false });
      console.error('EditUpdateForm onSubmit error', e);
    }
    return false;
  }

  render() {
    const { collective, LoggedInUser } = this.props;
    const { update } = this.state;
    if (!this._isMounted) return <div />;

    const editor =
      get(LoggedInUser, 'collective.settings.editor') === 'markdown' ||
      get(collective, 'settings.editor') === 'markdown'
        ? 'markdown'
        : 'html';

    return (
      <UpdateFormWrapper className={`EditUpdateForm ${this.props.mode}`}>
        <style jsx>
          {`
            .col {
              float: left;
              display: flex;
              flex-direction: column;
              margin-right: 1rem;
              margin-top: 1rem;
            }
            .row {
              clear: both;
              margin-left: 0;
              margin-right: 0;
            }
            .row .col.large {
              width: 100%;
            }
            .row.actions {
              margin-top: 7rem;
            }
            label {
              text-transform: uppercase;
              color: #aaaeb3;
              font-weight: 300;
              white-space: nowrap;
            }
            .netAmountInCollectiveCurrency {
              font-weight: bold;
            }
            .error {
              color: red;
            }
          `}
        </style>
        <form onSubmit={this.onSubmit}>
          <div className="row">
            <div className="col large">
              <Container mb={2} fontWeight="500" fontSize="1.6rem" lineHeight="1.7">
                <Box as="span">Title</Box>
              </Container>
              <StyledInputField htmlFor="title">
                {inputProps => (
                  <StyledInput
                    {...inputProps}
                    type="text"
                    value={update.title}
                    onChange={e => this.handleChange('title', e.target.value)}
                    minWidth={500}
                    placeHolder="Normal"
                    required
                  />
                )}
              </StyledInputField>
            </div>
          </div>
          <div className="row">
            <Container className="col large" width={1}>
              <Container fontWeight="500" mb={2} mt={3} fontSize="1.6rem" lineHeight="1.7">
                <Box as="span">Message</Box>
              </Container>
              {editor === 'markdown' && (
                <MarkdownEditor
                  onChange={markdown => this.handleChange('markdown', markdown)}
                  defaultValue={update.markdown}
                />
              )}
              {editor === 'html' && (
                <HTMLEditor onChange={html => this.handleChange('html', html)} defaultValue={update.html} />
              )}
            </Container>
          </div>

          <div className="row">
            <Container mt={4} space={2} display="flex" alignItems="baseline">
              <Box mr={2}>
                <StyledCheckbox
                  defaultChecked={update.isPrivate}
                  name="private"
                  onChange={isPrivate => this.handleChange('isPrivate', isPrivate.checked)}
                />
              </Box>
              <Container ml={3} fontSize="16px" fontWeight="500">
                Private update
              </Container>
            </Container>
          </div>
          <div className="row">
            <Container marginLeft="25px" color="#71757A">
              <FormattedMessage
                id="update.private.description"
                defaultMessage="Only contributors will be able to see the content of this update"
              />
            </Container>
          </div>
          <div className="row actions">
            <StyledButton
              className="bluewhite"
              buttonSize="large"
              buttonStyle="primary"
              type="submit"
              disabled={this.state.loading}
            >
              {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
              {!this.state.loading && <FormattedMessage id="update.new.save" defaultMessage="Post Update" />}
            </StyledButton>
          </div>

          <div className="row">
            <div className="col large">{this.state.error && <div className="error">{this.state.error}</div>}</div>
          </div>
        </form>
      </UpdateFormWrapper>
    );
  }
}

export default withIntl(EditUpdateForm);
