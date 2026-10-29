export interface ContributorCredit {
  name: string;
  role: string;
  dialectOrRegion?: string;
  note?: string;
}

export interface ContentLicenseInfo {
  textLicense: {
    name: string;
    code: 'CC-BY-SA-4.0';
    url: string;
    summary: string;
  };
  audioLicense: {
    name: string;
    isPublicLicense: false;
    summary: string;
    attributionNotice: string;
  };
}

export interface CompliancePolicy {
  minimumAgeYears: 10;
  legalBasis: string[];
  privacySummary: {
    noAccountRequired: boolean;
    localStorageOnly: boolean;
    noAnalyticsOrAds: boolean;
    noBackgroundTracking: boolean;
  };
  reportingChannel: {
    email: string;
    subjectPrefix: string;
    purpose: string;
  };
}

export interface AboutMetadata {
  appName: string;
  appVersion: string;
  buildNumber: string;
  activePackage: {
    packageId: string;
    languageName: string;
    dialectName: string;
    version: string;
  };
  credits: ContributorCredit[];
  licenses: ContentLicenseInfo;
  compliance: CompliancePolicy;
}
