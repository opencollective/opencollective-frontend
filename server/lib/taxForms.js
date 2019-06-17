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
    .map(requiredUsTaxDoc => requiredUsTaxDoc.getHostCollective())
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
  return async function sendHelloWorksUsTaxForm(user) {
    const participants = {
      participant_swVuvW: {
        type: 'email',
        value: user.email,
        fullName: `${user.firstName} ${user.lastName}`, // Is this an internationalisation problem?
      },
    };

    const userCollective = await user.getCollective();
    console.log(user.email);

    return (
      client.workflowInstances
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
        // .then(() => LegalDocument.findByTypeYearUser({ documentType: US_TAX_FORM, year, user }))
        .then(([doc]) => {
          doc.requestStatus = LegalDocument.requestStatus.REQUESTED;
          return doc.save();
        })
        .catch(async err => {
          console.log('err sending tax form: ', err);
          const [doc] = await LegalDocument.findOrCreate({
            where: { documentType: US_TAX_FORM, year, CollectiveId: userCollective.id },
          });
          doc.requestStatus = LegalDocument.requestStatus.ERROR;
          await doc.save();
        })
    );
  };
}
