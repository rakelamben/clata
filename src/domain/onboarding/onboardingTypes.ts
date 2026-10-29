export type AgeCategory = 'blocked' | 'minor' | 'adult';

export type AgeCapability = 'p0' | 'account' | 'sync' | 'aiDialogue';

export type LocalProfile = {
  birthYear: number | null;
  ageCategory: AgeCategory | null;
  selectedPackageId: string | null;
};

export type OnboardingState =
  | 'loading'
  | 'intro'
  | 'installing-package'
  | 'select-language'
  | 'local-data-warning'
  | 'birth-year'
  | 'blocked'
  | 'ready'
  | 'error';

export type LanguageDialectOption = {
  packageId: string;
  languageId: string;
  dialectId: string;
  packageVersion: string;
};
