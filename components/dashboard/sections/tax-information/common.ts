import { z } from 'zod';

export enum TaxFormType {
  W9 = 'W9',
  W8_BEN = 'W8_BEN',
  W8_BEN_E = 'W8_BEN_E',
}

export enum SubmitterType {
  Individual = 'Individual',
  Business = 'Business',
}

export enum FederalTaxClassification {
  Individual = 'Individual',
  C_Corporation = 'C_Corporation',
  S_Corporation = 'S_Corporation',
  Partnership = 'Partnership',
  TrustEstate = 'TrustEstate',
  LimitedLiabilityCompany = 'LimitedLiabilityCompany',
  Other = 'Other',
}

export enum Chapter3Status {
  Corporation = 'Corporation',
  Partnership = 'Partnership',
  SimpleTrust = 'SimpleTrust',
  TaxExemptOrganization = 'TaxExemptOrganization',
  ComplexTrust = 'ComplexTrust',
  ForeignGovernmentControlledEntity = 'ForeignGovernmentControlledEntity',
  CentralBankOfIssue = 'CentralBankOfIssue',
  PrivateFoundation = 'PrivateFoundation',
  Estate = 'Estate',
  ForeignGovernmentIntegralPart = 'ForeignGovernmentIntegralPart',
  GrantorTrust = 'GrantorTrust',
  DisregardedEntity = 'DisregardedEntity',
  InternationalOrganization = 'InternationalOrganization',
}

export enum TypeOfLimitationOnBenefitsProvisions {
  Government = 'Government',
  TaxExemptPensionTrustOrPensionFund = 'TaxExemptPensionTrustOrPensionFund',
  OtherTaxExemptOrganization = 'OtherTaxExemptOrganization',
  PubliclyTradedCorporation = 'PubliclyTradedCorporation',
  SubsidiaryOfAPubliclyTradedCorporation = 'SubsidiaryOfAPubliclyTradedCorporation',
  CompanyThatMeetsTheOwnershipAndBaseErosionTest = 'CompanyThatMeetsTheOwnershipAndBaseErosionTest',
  CompanyThatMeetsTheDerivativeBenefitsTest = 'CompanyThatMeetsTheDerivativeBenefitsTest',
  CompanyWithAnItemOfIncomeThatMeetsActiveTradeOrBusinessTest = 'CompanyWithAnItemOfIncomeThatMeetsActiveTradeOrBusinessTest',
  FavorableDiscretionaryDeterminationByTheUSCompetentAuthorityReceived = 'FavorableDiscretionaryDeterminationByTheUSCompetentAuthorityReceived',
  NoLOBArticleInTreaty = 'NoLOBArticleInTreaty',
  Other = 'Other',
}

export enum NFFEStatus {
  ActiveNFFE = 'ActiveNFFE',
  PassiveNFFE = 'PassiveNFFE',
  NonProfitOrganization = 'NonProfitOrganization',
}

export const TaxFormNameFields = z.object({
  firstName: z.string().min(1).max(50),
  middleName: z.string().max(50).or(z.literal('')).optional(),
  lastName: z.string().min(1).max(50),
});

export type TaxFormNameValues = z.infer<typeof TaxFormNameFields>;

export const TaxFormLocationFields = z.object({
  country: z.string(),
  structured: z.object({
    address1: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
  }),
});

export type TaxFormLocationValues = z.infer<typeof TaxFormLocationFields>;

export const BaseFormSchema = z.object({
  isUSPersonOrEntity: z.boolean(),
  submitterType: z.nativeEnum(SubmitterType),
  formType: z.nativeEnum(TaxFormType),
  email: z.string().email(),
  signer: TaxFormNameFields,
  isSigned: z.literal<boolean>(true),
});

export type BaseFormValues = z.infer<typeof BaseFormSchema>;
