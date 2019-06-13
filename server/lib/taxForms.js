import models from '../models';
import { uniqBy } from 'lodash';
const { RequiredLegalDocument, LegalDocument } = models;
const {
  documentType: { US_TAX_FORM },
} = RequiredLegalDocument;

export async function findUsersThatNeedToBeSentTaxForm({ invoiceTotalThreshold, year }) {
  const users = await RequiredLegalDocument.findAll({
    where: { documentType: US_TAX_FORM },
  })
    .map(requiredUsTaxDocType => requiredUsTaxDocType.getHostCollective())
    .map(host => host.getUsersWhoHaveTotalExpensesOverThreshold(invoiceTotalThreshold, year))
    .reduce((acc, item) => {
      return [...acc, ...item];
    }, [])
    .filter(user => {
      return LegalDocument.doesUserNeedToBeSentDocument({ documentType: US_TAX_FORM, year, user });
    });

  return uniqBy(users, 'id');
}

export function SendHelloWorksTaxForm({ client, callbackUrl, workflowId, year }) {
  return function sendHelloWorksUsTaxForm(user) {
    const participants = {
      participant_swVuvW: {
        type: 'email',
        value: user.email,
        fullName: `${user.firstName} ${user.lastName}`, // Is this an internationalisation problem?
      },
    };

    return client.workflowInstances
      .createInstance({
        callbackUrl,
        workflowId,
        documentDelivery: true,
        participants,
      })
      .then(() => LegalDocument.findByTypeYearUser({ documentType: US_TAX_FORM, year, user }))
      .then(doc => {
        doc.requestStatus = LegalDocument.requestStatus.REQUESTED;
        return doc.save();
      })
      .catch(async () => {
        const doc = await LegalDocument.findByTypeYearUser({ documentType: US_TAX_FORM, year, user });
        doc.requestStatus = LegalDocument.requestStatus.ERROR;
        await doc.save();
      });
  };
}
