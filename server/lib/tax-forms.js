import config from 'config';
import { uniqBy } from 'lodash';
import models from '../models';
import logger from './logger';
import { isEmailInternal } from './utils';

const { RequiredLegalDocument, LegalDocument, Collective, User } = models;
const {
  documentType: { US_TAX_FORM },
} = RequiredLegalDocument;

export async function findUsersThatNeedToBeSentTaxForm({ invoiceTotalThreshold, year }) {
  const users = await RequiredLegalDocument.findAll({
    where: { documentType: US_TAX_FORM },
  })
    .map(requiredUsTaxDoc => requiredUsTaxDoc.getHostCollective())
    .map(host => host.getUsersWhoHaveTotalExpensesOverThreshold({ threshold: invoiceTotalThreshold, year }))
    .reduce((acc, item) => {
      return [...acc, ...item];
    }, [])
    .filter(user => {
      return LegalDocument.doesUserNeedToBeSentDocument({ documentType: US_TAX_FORM, year, user });
    });

  return uniqBy(users, 'id');
}

export async function isUserTaxFormRequiredBeforePayment({ invoiceTotalThreshold, year, expenseCollectiveId, UserId }) {
  const collective = await Collective.findOne({
    where: { id: expenseCollectiveId },
    include: {
      association: 'HostCollective',
    },
  });

  // Host can be null (we allow submitting expenses to collectives without a host)
  if (!collective.HostCollective) {
    return false;
  }

  const { HostCollective: host } = collective;
  const user = await User.findByPk(UserId);
  const requiredDocuments = await host.getRequiredLegalDocuments({
    where: {
      documentType: US_TAX_FORM,
    },
  });

  if (requiredDocuments.length == 0) {
    return false;
  }

  const isOverThreshold = await host.doesUserHaveTotalExpensesOverThreshold({
    threshold: invoiceTotalThreshold,
    year,
    UserId,
  });

  if (!isOverThreshold) {
    return false;
  }

  const hasUserCompletedDocument = await LegalDocument.hasUserCompletedDocument({
    documentType: US_TAX_FORM,
    year,
    user,
  });

  return !hasUserCompletedDocument;
}

export function SendHelloWorksTaxForm({ client, callbackUrl, workflowId, year }) {
  return async function sendHelloWorksUsTaxForm(user) {
    const userCollective = await user.getCollective();

    const participants = {
      participant_swVuvW: {
        type: 'email',
        value: user.email,
        fullName: `${userCollective.name}`,
      },
    };

    const saveDocumentStatus = status => {
      return LegalDocument.findOrCreate({
        where: { documentType: US_TAX_FORM, year, CollectiveId: userCollective.id },
      }).then(([doc]) => {
        doc.requestStatus = status;
        return doc.save();
      });
    };

    try {
      // Don't send emails on dev/staging environments to ensure we never trigger a notification
      // from HelloWorks for users when we shouldn't.
      if (config.env === 'production' || isEmailInternal(user.email)) {
        await client.workflowInstances.createInstance({
          callbackUrl,
          workflowId,
          documentDelivery: true,
          participants,
          metadata: {
            userId: user.id,
            email: user.email,
            year,
          },
        });
        return saveDocumentStatus(LegalDocument.requestStatus.REQUESTED);
      } else {
        logger.info(`${user.email} is an external email address, skipping HelloWorks in development environment`);
      }
    } catch (error) {
      logger.info(`Failed to initialize tax form for user #${user.id} (${user.email})`);
      return saveDocumentStatus(LegalDocument.requestStatus.ERROR);
    }
  };
}
