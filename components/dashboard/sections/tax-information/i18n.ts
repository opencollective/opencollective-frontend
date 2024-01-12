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
  },
  [NFFEStatus.PassiveNFFE]: {
    defaultMessage: 'Passive NFFE (non-US private company with >50% passive income)',
  },
  [NFFEStatus.NonProfitOrganization]: {
    defaultMessage: 'Non-profit organization (tax-exempt charity in your country, not a 501(c) organization)',
  },
});

export const I18nChapter3Status = defineMessages({
  [Chapter3Status.Corporation]: {
    defaultMessage: 'Corporation',
  },
  [Chapter3Status.Partnership]: {
    defaultMessage: 'Partnership',
  },
  [Chapter3Status.SimpleTrust]: {
    defaultMessage: 'Simple trust',
  },
  [Chapter3Status.TaxExemptOrganization]: {
    defaultMessage: 'Tax-exempt organization',
  },
  [Chapter3Status.ComplexTrust]: {
    defaultMessage: 'Complex trust',
  },
  [Chapter3Status.ForeignGovernmentControlledEntity]: {
    defaultMessage: 'Foreign government-controlled entity',
  },
  [Chapter3Status.CentralBankOfIssue]: {
    defaultMessage: 'Central bank of issue',
  },
  [Chapter3Status.PrivateFoundation]: {
    defaultMessage: 'Private foundation',
  },
  [Chapter3Status.Estate]: {
    defaultMessage: 'Estate',
  },
  [Chapter3Status.ForeignGovernmentIntegralPart]: {
    defaultMessage: 'Foreign government integral part',
  },
  [Chapter3Status.GrantorTrust]: {
    defaultMessage: 'Grantor trust',
  },
  [Chapter3Status.DisregardedEntity]: {
    defaultMessage: 'Disregarded entity',
  },
  [Chapter3Status.InternationalOrganization]: {
    defaultMessage: 'International organization',
  },
});

export const I18nTypeOfLimitationOnBenefitsProvisions = defineMessages({
  Government: {
    defaultMessage: 'Government',
  },
  TaxExemptPensionTrustOrPensionFund: {
    defaultMessage: 'Tax-exempt pension trust or pension fund',
  },
  OtherTaxExemptOrganization: {
    defaultMessage: 'Other tax-exempt organization',
  },
  PubliclyTradedCorporation: {
    defaultMessage: 'Publicly traded corporation',
  },
  SubsidiaryOfAPubliclyTradedCorporation: {
    defaultMessage: 'Subsidiary of a publicly traded corporation',
  },
  CompanyThatMeetsTheOwnershipAndBaseErosionTest: {
    defaultMessage: 'Company that meets the ownership and base erosion test',
  },
  CompanyThatMeetsTheDerivativeBenefitsTest: {
    defaultMessage: 'Company that meets the derivative benefits test',
  },
  CompanyWithAnItemOfIncomeThatMeetsActiveTradeOrBusinessTest: {
    defaultMessage: 'Company with an item of income that meets active trade or business test',
  },
  FavorableDiscretionaryDeterminationByTheUSCompetentAuthorityReceived: {
    defaultMessage: 'Favorable discretionary determination by the US competent authority received',
  },
  NoLOBArticleInTreaty: {
    defaultMessage: 'No LOB article in treaty',
  },
  Other: {
    defaultMessage: 'Other',
  },
});
