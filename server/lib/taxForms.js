import models from '../models';
import { uniqBy } from 'lodash';
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

export async function isUserTaxFormRequiredBeforePayment({ invoiceTotalThreshold, year, HostCollectiveId, UserId }) {
  const host = await Collective.findByPk(HostCollectiveId);
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
    const participants = {
      participant_swVuvW: {
        type: 'email',
        value: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
      },
    };

    const userCollective = await user.getCollective();

    return client.workflowInstances
      .createInstance({
        callbackUrl,
        workflowId,
        documentDelivery: true,
        participants,
        metadata: {
          email: user.email,
          year,
        },
      })
      .then(() =>
        LegalDocument.findOrCreate({ where: { documentType: US_TAX_FORM, year, CollectiveId: userCollective.id } }),
      )
      .then(([doc]) => {
        doc.requestStatus = LegalDocument.requestStatus.REQUESTED;
        return doc.save();
      })
      .catch(async () => {
        const [doc] = await LegalDocument.findOrCreate({
          where: { documentType: US_TAX_FORM, year, CollectiveId: userCollective.id },
        });
        doc.requestStatus = LegalDocument.requestStatus.ERROR;
        await doc.save();
      });
  };
}
