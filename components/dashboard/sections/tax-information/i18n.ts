import { defineMessages } from 'react-intl';

import { Chapter3Status, FederalTaxClassification, NFFEStatus } from './common';

export const I18nFederalTaxClassification = defineMessages({
  [FederalTaxClassification.Individual]: {
    id: 'FederalTaxClassification.Individual',
    defaultMessage: 'Individual/sole proprietor or single-member LLC',
  },
  [FederalTaxClassification.C_Corporation]: {
    id: 'FederalTaxClassification.C_Corporation',
    defaultMessage: 'C Corporation',
  },
  [FederalTaxClassification.S_Corporation]: {
    id: 'FederalTaxClassification.S_Corporation',
    defaultMessage: 'S Corporation',
  },
  [FederalTaxClassification.Partnership]: {
    defaultMessage: 'Partnership',
  },
  [FederalTaxClassification.TrustEstate]: {
    id: 'FederalTaxClassification.TrustEstate',
    defaultMessage: 'Trust/estate',
  },
  [FederalTaxClassification.LimitedLiabilityCompany]: {
    id: 'FederalTaxClassification.LimitedLiabilityCompany',
    defaultMessage: 'Limited liability company',
  },
  [FederalTaxClassification.Other]: {
    id: 'FederalTaxClassification.Other',
    defaultMessage: 'Other',
  },
});

export const I18nNFFEStatus = defineMessages({
  [NFFEStatus.ActiveNFFE]: {
    defaultMessage: 'Active NFFE (non-US private company with <50% passive income)',
    id: 'HY5R9/',
  },
  [NFFEStatus.PassiveNFFE]: {
    defaultMessage: 'Passive NFFE (non-US private company with >50% passive income)',
    id: 'CmeSUe',
  },
  [NFFEStatus.NonProfitOrganization]: {
    defaultMessage: 'Non-profit organization (tax-exempt charity in your country, not a 501(c) organization)',
    id: 'k0kSgk',
  },
});

export const I18nChapter3Status = defineMessages({
  [Chapter3Status.Corporation]: {
    defaultMessage: 'Corporation',
    id: 'psPbog',
  },
  [Chapter3Status.Partnership]: {
    defaultMessage: 'Partnership',
    id: 'yURinU',
  },
  [Chapter3Status.SimpleTrust]: {
    defaultMessage: 'Simple trust',
    id: 'qgLfdL',
  },
  [Chapter3Status.TaxExemptOrganization]: {
    defaultMessage: 'Tax-exempt organization',
    id: '5Nlql/',
  },
  [Chapter3Status.ComplexTrust]: {
    defaultMessage: 'Complex trust',
    id: 'j54VCU',
  },
  [Chapter3Status.ForeignGovernmentControlledEntity]: {
    defaultMessage: 'Foreign government-controlled entity',
    id: 'sJVFyQ',
  },
  [Chapter3Status.CentralBankOfIssue]: {
    defaultMessage: 'Central bank of issue',
    id: 'g7TMdI',
  },
  [Chapter3Status.PrivateFoundation]: {
    defaultMessage: 'Private foundation',
    id: '8BL3+L',
  },
  [Chapter3Status.Estate]: {
    defaultMessage: 'Estate',
    id: 'HgtxY3',
  },
  [Chapter3Status.ForeignGovernmentIntegralPart]: {
    defaultMessage: 'Foreign government integral part',
    id: 'YKA23n',
  },
  [Chapter3Status.GrantorTrust]: {
    defaultMessage: 'Grantor trust',
    id: 'ALn43Y',
  },
  [Chapter3Status.DisregardedEntity]: {
    defaultMessage: 'Disregarded entity',
    id: 'Nrlec3',
  },
  [Chapter3Status.InternationalOrganization]: {
    defaultMessage: 'International organization',
    id: 'ar4IE4',
  },
});

export const I18nTypeOfLimitationOnBenefitsProvisions = defineMessages({
  Government: {
    defaultMessage: 'Government',
    id: 'bh4rlK',
  },
  TaxExemptPensionTrustOrPensionFund: {
    defaultMessage: 'Tax-exempt pension trust or pension fund',
    id: 'wHY61H',
  },
  OtherTaxExemptOrganization: {
    defaultMessage: 'Other tax-exempt organization',
    id: 'vg29RM',
  },
  PubliclyTradedCorporation: {
    defaultMessage: 'Publicly traded corporation',
    id: 'Txrgf2',
  },
  SubsidiaryOfAPubliclyTradedCorporation: {
    defaultMessage: 'Subsidiary of a publicly traded corporation',
    id: 'l0EYaN',
  },
  CompanyThatMeetsTheOwnershipAndBaseErosionTest: {
    defaultMessage: 'Company that meets the ownership and base erosion test',
    id: 'IgNnY1',
  },
  CompanyThatMeetsTheDerivativeBenefitsTest: {
    defaultMessage: 'Company that meets the derivative benefits test',
    id: 'FjwI2S',
  },
  CompanyWithAnItemOfIncomeThatMeetsActiveTradeOrBusinessTest: {
    defaultMessage: 'Company with an item of income that meets active trade or business test',
    id: 'Y3cqkI',
  },
  FavorableDiscretionaryDeterminationByTheUSCompetentAuthorityReceived: {
    defaultMessage: 'Favorable discretionary determination by the US competent authority received',
    id: 'FctonF',
  },
  NoLOBArticleInTreaty: {
    defaultMessage: 'No LOB article in treaty',
    id: 'sJsgP6',
  },
  Other: {
    defaultMessage: 'Other',
    id: '/VnDMl',
  },
});
