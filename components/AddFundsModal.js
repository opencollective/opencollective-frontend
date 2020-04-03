import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Row, Col } from 'react-bootstrap';
import gql from 'graphql-tag';
import { Mutation } from '@apollo/react-components';
import { pick } from 'lodash';

import Button from './Button';
import AddFundsForm from './AddFundsForm';
import { withUser } from './UserProvider';

const addFundsToOrgMutation = gql`
  mutation addFundsToOrg($totalAmount: Int!, $CollectiveId: Int!, $HostCollectiveId: Int!, $description: String) {
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

const AddFundsModal = ({ LoggedInUser, show, setShow, collective }) => {
  const [loading, setLoading] = React.useState(false);
  const [fundsAdded, setFundsAdded] = React.useState(false);
  const [error, setError] = React.useState(null);
  const close = () => {
    setShow(false);
    setError(null);
    setFundsAdded(null);
  };

  if (!LoggedInUser) {
    return null;
  }

  return (
    <Modal show={show} onHide={close}>
      <Modal.Body>
        <Row>
          <Col sm={12}>
            {fundsAdded && (
              <div>
                <h1>Funds added to organization successfully</h1>
                <center>
                  <Button className="blue" onClick={close}>
                    Ok
                  </Button>
                </center>
              </div>
            )}
            {!fundsAdded && (
              <Mutation mutation={addFundsToOrgMutation}>
                {addFundsToOrg => (
                  <AddFundsForm
                    LoggedInUser={LoggedInUser}
                    collective={collective}
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
                        await addFundsToOrg({
                          variables: {
                            ...pick(form, ['totalAmount', 'description']),
                            CollectiveId: collective.id,
                            HostCollectiveId: Number(form.FromCollectiveId),
                          },
                        });

                        setFundsAdded(true);
                        setLoading(false);
                        setError(null);
                        return null;
                      } catch (e) {
                        return finalizeWithError(e.message && e.message.replace(/GraphQL error:/, ''));
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
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
};

AddFundsModal.defaultProps = {
  show: false,
};

export default withUser(AddFundsModal);
