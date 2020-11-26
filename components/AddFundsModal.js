import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { pick } from 'lodash';
import { Col, Modal, Row } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import useKeyboardShortcut from '../lib/hooks/useEscapeKey'

import AddFundsForm from './AddFundsForm';
import Button from './Button';
import { withUser } from './UserProvider';

const addFundsToOrgMutation = gql`
  mutation AddFundsToOrg($totalAmount: Int!, $CollectiveId: Int!, $HostCollectiveId: Int!, $description: String) {
    addFundsToOrg(
      totalAmount: $totalAmount
      CollectiveId: $CollectiveId
      HostCollectiveId: $HostCollectiveId
      description: $description
    ) {
      id
    }
  }
`;

const addFundsToCollectiveMutation = gql`
  mutation addFundsToCollective($order: OrderInputType!) {
    addFundsToCollective(order: $order) {
      id
      fromCollective {
        id
        slug
        name
      }
      collective {
        id
        stats {
          id
          balance
        }
      }
    }
  }
`;

const AddFundsModal = ({ LoggedInUser, show, setShow, collective, host }) => {
  const [loading, setLoading] = React.useState(false);
  const [fundsAdded, setFundsAdded] = React.useState(false);
  const [error, setError] = React.useState(null);
  const isAddFundsToOrg = collective.type === CollectiveType.ORGANIZATION;
  const close = () => {
    setShow(false);
    setError(null);
    setFundsAdded(null);
  };

  if (!LoggedInUser) {
    return null;
  }

  useKeyboardShortcut(() => close())

  return (
    <Modal show={show} onHide={close}>
      <Modal.Body>
        <Row>
          <Col sm={12}>
            {fundsAdded && (
              <div>
                <h1>
                  <FormattedMessage id="AddFunds.Success" defaultMessage="Funds added successfully" />
                </h1>
                <center>
                  <Button className="blue" onClick={close}>
                    Ok
                  </Button>
                </center>
              </div>
            )}
            {!fundsAdded && (
              <Mutation mutation={isAddFundsToOrg ? addFundsToOrgMutation : addFundsToCollectiveMutation}>
                {addFunds => (
                  <AddFundsForm
                    LoggedInUser={LoggedInUser}
                    collective={collective}
                    host={host}
                    loading={loading}
                    onCancel={close}
                    onSubmit={async form => {
                      const finalizeWithError = error => {
                        setError(error);
                        setLoading(false);
                      };

                      if (form.totalAmount === 0) {
                        return finalizeWithError('Total amount must be > 0');
                      } else if (!form.FromCollectiveId) {
                        return finalizeWithError('No host selected');
                      }

                      setLoading(true);
                      try {
                        if (isAddFundsToOrg) {
                          await addFunds({
                            variables: {
                              ...pick(form, ['totalAmount', 'description']),
                              CollectiveId: collective.legacyId || collective.id,
                              HostCollectiveId: Number(form.FromCollectiveId),
                            },
                          });
                        } else {
                          await addFunds({
                            variables: {
                              order: {
                                ...pick(form, ['totalAmount', 'description', 'hostFeePercent', 'platformFeePercent']),
                                collective: { id: collective.legacyId || collective.id },
                                fromCollective: { id: Number(form.FromCollectiveId) },
                              },
                            },
                          });
                        }

                        setFundsAdded(true);
                        setLoading(false);
                        setError(null);
                        return null;
                      } catch (e) {
                        return finalizeWithError(e.message);
                      }
                    }}
                  />
                )}
              </Mutation>
            )}
          </Col>
        </Row>
        <Row>
          <Col sm={2} />
          <Col sm={10}>{error && <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}</Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

AddFundsModal.propTypes = {
  show: PropTypes.bool,
  setShow: PropTypes.func,
  collective: PropTypes.object,
  host: PropTypes.object,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
};

AddFundsModal.defaultProps = {
  show: false,
};

export default withUser(AddFundsModal);
