export interface AgeRange {
  id: string;
  label: string;
  minMonths: number;
  maxMonths: number;
  cdcLink?: string;
}

export interface Milestone {
  id: string;
  ageRangeId: string;
  domain: Domain;
  titleKey: string;
  redFlag?: boolean;
}

export type Domain = 'physical' | 'academic' | 'social' | 'lifeSkills';

export const DOMAINS: { id: Domain; labelKey: string; descKey: string; color: string }[] = [
  { id: 'physical',  labelKey: 'youth.domainPhysical',  descKey: 'youth.domainPhysicalDesc',  color: 'green' },
  { id: 'academic',  labelKey: 'youth.domainAcademic',  descKey: 'youth.domainAcademicDesc',  color: 'blue' },
  { id: 'social',    labelKey: 'youth.domainSocial',    descKey: 'youth.domainSocialDesc',    color: 'purple' },
  { id: 'lifeSkills', labelKey: 'youth.domainLifeSkills', descKey: 'youth.domainLifeSkillsDesc', color: 'amber' },
];

// CDC-aligned age ranges
// https://www.cdc.gov/child-development/about/middle-childhood.html
// https://www.cdc.gov/child-development/about/young-teens.html
// https://www.cdc.gov/child-development/about/teenagers.html
export const AGE_RANGES: AgeRange[] = [
  { id: '6-8y',   label: 'Middle Childhood (6\u20138)',  minMonths: 72,  maxMonths: 108, cdcLink: 'https://www.cdc.gov/child-development/about/middle-childhood.html' },
  { id: '9-11y',  label: 'Middle Childhood (9\u201311)', minMonths: 108, maxMonths: 144, cdcLink: 'https://www.cdc.gov/child-development/about/middle-childhood.html' },
  { id: '12-14y', label: 'Young Teens (12\u201314)',     minMonths: 144, maxMonths: 180, cdcLink: 'https://www.cdc.gov/child-development/about/young-teens.html' },
  { id: '15-17y', label: 'Teenagers (15\u201317)',       minMonths: 180, maxMonths: 216, cdcLink: 'https://www.cdc.gov/child-development/about/teenagers.html' },
];

export function getAgeRangeForMonths(months: number): AgeRange | null {
  return AGE_RANGES.find(r => months >= r.minMonths && months < r.maxMonths) ?? null;
}

// 64 milestones: 4 milestones per domain x 4 age ranges
export const MILESTONES: Milestone[] = [
  // ─── 6-8y (Middle Childhood, Early) ────────────────────────
  { id: 'phys_6-8y_01', ageRangeId: '6-8y', domain: 'physical', titleKey: 'youth.ms_phys_6_8y_01' },
  { id: 'phys_6-8y_02', ageRangeId: '6-8y', domain: 'physical', titleKey: 'youth.ms_phys_6_8y_02' },
  { id: 'phys_6-8y_03', ageRangeId: '6-8y', domain: 'physical', titleKey: 'youth.ms_phys_6_8y_03' },
  { id: 'phys_6-8y_04', ageRangeId: '6-8y', domain: 'physical', titleKey: 'youth.ms_phys_6_8y_04' },
  { id: 'acad_6-8y_01', ageRangeId: '6-8y', domain: 'academic', titleKey: 'youth.ms_acad_6_8y_01' },
  { id: 'acad_6-8y_02', ageRangeId: '6-8y', domain: 'academic', titleKey: 'youth.ms_acad_6_8y_02' },
  { id: 'acad_6-8y_03', ageRangeId: '6-8y', domain: 'academic', titleKey: 'youth.ms_acad_6_8y_03' },
  { id: 'acad_6-8y_04', ageRangeId: '6-8y', domain: 'academic', titleKey: 'youth.ms_acad_6_8y_04' },
  { id: 'soc_6-8y_01', ageRangeId: '6-8y', domain: 'social', titleKey: 'youth.ms_soc_6_8y_01' },
  { id: 'soc_6-8y_02', ageRangeId: '6-8y', domain: 'social', titleKey: 'youth.ms_soc_6_8y_02' },
  { id: 'soc_6-8y_03', ageRangeId: '6-8y', domain: 'social', titleKey: 'youth.ms_soc_6_8y_03' },
  { id: 'soc_6-8y_04', ageRangeId: '6-8y', domain: 'social', titleKey: 'youth.ms_soc_6_8y_04' },
  { id: 'life_6-8y_01', ageRangeId: '6-8y', domain: 'lifeSkills', titleKey: 'youth.ms_life_6_8y_01' },
  { id: 'life_6-8y_02', ageRangeId: '6-8y', domain: 'lifeSkills', titleKey: 'youth.ms_life_6_8y_02' },
  { id: 'life_6-8y_03', ageRangeId: '6-8y', domain: 'lifeSkills', titleKey: 'youth.ms_life_6_8y_03' },
  { id: 'life_6-8y_04', ageRangeId: '6-8y', domain: 'lifeSkills', titleKey: 'youth.ms_life_6_8y_04' },

  // ─── 9-11y (Middle Childhood, Late) ────────────────────────
  { id: 'phys_9-11y_01', ageRangeId: '9-11y', domain: 'physical', titleKey: 'youth.ms_phys_9_11y_01' },
  { id: 'phys_9-11y_02', ageRangeId: '9-11y', domain: 'physical', titleKey: 'youth.ms_phys_9_11y_02' },
  { id: 'phys_9-11y_03', ageRangeId: '9-11y', domain: 'physical', titleKey: 'youth.ms_phys_9_11y_03' },
  { id: 'phys_9-11y_04', ageRangeId: '9-11y', domain: 'physical', titleKey: 'youth.ms_phys_9_11y_04' },
  { id: 'acad_9-11y_01', ageRangeId: '9-11y', domain: 'academic', titleKey: 'youth.ms_acad_9_11y_01' },
  { id: 'acad_9-11y_02', ageRangeId: '9-11y', domain: 'academic', titleKey: 'youth.ms_acad_9_11y_02' },
  { id: 'acad_9-11y_03', ageRangeId: '9-11y', domain: 'academic', titleKey: 'youth.ms_acad_9_11y_03' },
  { id: 'acad_9-11y_04', ageRangeId: '9-11y', domain: 'academic', titleKey: 'youth.ms_acad_9_11y_04' },
  { id: 'soc_9-11y_01', ageRangeId: '9-11y', domain: 'social', titleKey: 'youth.ms_soc_9_11y_01' },
  { id: 'soc_9-11y_02', ageRangeId: '9-11y', domain: 'social', titleKey: 'youth.ms_soc_9_11y_02' },
  { id: 'soc_9-11y_03', ageRangeId: '9-11y', domain: 'social', titleKey: 'youth.ms_soc_9_11y_03' },
  { id: 'soc_9-11y_04', ageRangeId: '9-11y', domain: 'social', titleKey: 'youth.ms_soc_9_11y_04' },
  { id: 'life_9-11y_01', ageRangeId: '9-11y', domain: 'lifeSkills', titleKey: 'youth.ms_life_9_11y_01' },
  { id: 'life_9-11y_02', ageRangeId: '9-11y', domain: 'lifeSkills', titleKey: 'youth.ms_life_9_11y_02' },
  { id: 'life_9-11y_03', ageRangeId: '9-11y', domain: 'lifeSkills', titleKey: 'youth.ms_life_9_11y_03' },
  { id: 'life_9-11y_04', ageRangeId: '9-11y', domain: 'lifeSkills', titleKey: 'youth.ms_life_9_11y_04' },

  // ─── 12-14y (Young Teens) ──────────────────────────────────
  { id: 'phys_12-14y_01', ageRangeId: '12-14y', domain: 'physical', titleKey: 'youth.ms_phys_12_14y_01' },
  { id: 'phys_12-14y_02', ageRangeId: '12-14y', domain: 'physical', titleKey: 'youth.ms_phys_12_14y_02' },
  { id: 'phys_12-14y_03', ageRangeId: '12-14y', domain: 'physical', titleKey: 'youth.ms_phys_12_14y_03' },
  { id: 'phys_12-14y_04', ageRangeId: '12-14y', domain: 'physical', titleKey: 'youth.ms_phys_12_14y_04' },
  { id: 'acad_12-14y_01', ageRangeId: '12-14y', domain: 'academic', titleKey: 'youth.ms_acad_12_14y_01' },
  { id: 'acad_12-14y_02', ageRangeId: '12-14y', domain: 'academic', titleKey: 'youth.ms_acad_12_14y_02' },
  { id: 'acad_12-14y_03', ageRangeId: '12-14y', domain: 'academic', titleKey: 'youth.ms_acad_12_14y_03' },
  { id: 'acad_12-14y_04', ageRangeId: '12-14y', domain: 'academic', titleKey: 'youth.ms_acad_12_14y_04' },
  { id: 'soc_12-14y_01', ageRangeId: '12-14y', domain: 'social', titleKey: 'youth.ms_soc_12_14y_01' },
  { id: 'soc_12-14y_02', ageRangeId: '12-14y', domain: 'social', titleKey: 'youth.ms_soc_12_14y_02' },
  { id: 'soc_12-14y_03', ageRangeId: '12-14y', domain: 'social', titleKey: 'youth.ms_soc_12_14y_03' },
  { id: 'soc_12-14y_04', ageRangeId: '12-14y', domain: 'social', titleKey: 'youth.ms_soc_12_14y_04' },
  { id: 'life_12-14y_01', ageRangeId: '12-14y', domain: 'lifeSkills', titleKey: 'youth.ms_life_12_14y_01' },
  { id: 'life_12-14y_02', ageRangeId: '12-14y', domain: 'lifeSkills', titleKey: 'youth.ms_life_12_14y_02' },
  { id: 'life_12-14y_03', ageRangeId: '12-14y', domain: 'lifeSkills', titleKey: 'youth.ms_life_12_14y_03' },
  { id: 'life_12-14y_04', ageRangeId: '12-14y', domain: 'lifeSkills', titleKey: 'youth.ms_life_12_14y_04' },

  // ─── 15-17y (Teenagers) ────────────────────────────────────
  { id: 'phys_15-17y_01', ageRangeId: '15-17y', domain: 'physical', titleKey: 'youth.ms_phys_15_17y_01' },
  { id: 'phys_15-17y_02', ageRangeId: '15-17y', domain: 'physical', titleKey: 'youth.ms_phys_15_17y_02' },
  { id: 'phys_15-17y_03', ageRangeId: '15-17y', domain: 'physical', titleKey: 'youth.ms_phys_15_17y_03' },
  { id: 'phys_15-17y_04', ageRangeId: '15-17y', domain: 'physical', titleKey: 'youth.ms_phys_15_17y_04' },
  { id: 'acad_15-17y_01', ageRangeId: '15-17y', domain: 'academic', titleKey: 'youth.ms_acad_15_17y_01' },
  { id: 'acad_15-17y_02', ageRangeId: '15-17y', domain: 'academic', titleKey: 'youth.ms_acad_15_17y_02' },
  { id: 'acad_15-17y_03', ageRangeId: '15-17y', domain: 'academic', titleKey: 'youth.ms_acad_15_17y_03' },
  { id: 'acad_15-17y_04', ageRangeId: '15-17y', domain: 'academic', titleKey: 'youth.ms_acad_15_17y_04' },
  { id: 'soc_15-17y_01', ageRangeId: '15-17y', domain: 'social', titleKey: 'youth.ms_soc_15_17y_01' },
  { id: 'soc_15-17y_02', ageRangeId: '15-17y', domain: 'social', titleKey: 'youth.ms_soc_15_17y_02' },
  { id: 'soc_15-17y_03', ageRangeId: '15-17y', domain: 'social', titleKey: 'youth.ms_soc_15_17y_03' },
  { id: 'soc_15-17y_04', ageRangeId: '15-17y', domain: 'social', titleKey: 'youth.ms_soc_15_17y_04' },
  { id: 'life_15-17y_01', ageRangeId: '15-17y', domain: 'lifeSkills', titleKey: 'youth.ms_life_15_17y_01' },
  { id: 'life_15-17y_02', ageRangeId: '15-17y', domain: 'lifeSkills', titleKey: 'youth.ms_life_15_17y_02' },
  { id: 'life_15-17y_03', ageRangeId: '15-17y', domain: 'lifeSkills', titleKey: 'youth.ms_life_15_17y_03' },
  { id: 'life_15-17y_04', ageRangeId: '15-17y', domain: 'lifeSkills', titleKey: 'youth.ms_life_15_17y_04' },
];
