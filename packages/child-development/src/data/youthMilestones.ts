export interface AgeRange {
  id: string;
  label: string;
  minMonths: number;
  maxMonths: number;
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

export const AGE_RANGES: AgeRange[] = [
  { id: '5-6y',   label: 'Kindergarten / 1st Grade', minMonths: 60,  maxMonths: 72 },
  { id: '6-8y',   label: 'Early Elementary',         minMonths: 72,  maxMonths: 96 },
  { id: '8-10y',  label: 'Late Elementary',          minMonths: 96,  maxMonths: 120 },
  { id: '10-12y', label: 'Pre-Teen',                 minMonths: 120, maxMonths: 144 },
  { id: '12-14y', label: 'Early Teen',               minMonths: 144, maxMonths: 168 },
  { id: '14-16y', label: 'Mid-Teen',                 minMonths: 168, maxMonths: 192 },
  { id: '16-18y', label: 'Late Teen',                minMonths: 192, maxMonths: 216 },
];

export function getAgeRangeForMonths(months: number): AgeRange | null {
  return AGE_RANGES.find(r => months >= r.minMonths && months < r.maxMonths) ?? null;
}

// ~112 milestones: 4 milestones per domain × 7 age ranges = 112
export const MILESTONES: Milestone[] = [
  // ─── 5-6y (Kindergarten / 1st Grade) ─────────────────────────
  // Physical
  { id: 'phys_5-6y_01', ageRangeId: '5-6y', domain: 'physical', titleKey: 'youth.ms_phys_5_6y_01' },
  { id: 'phys_5-6y_02', ageRangeId: '5-6y', domain: 'physical', titleKey: 'youth.ms_phys_5_6y_02' },
  { id: 'phys_5-6y_03', ageRangeId: '5-6y', domain: 'physical', titleKey: 'youth.ms_phys_5_6y_03' },
  { id: 'phys_5-6y_04', ageRangeId: '5-6y', domain: 'physical', titleKey: 'youth.ms_phys_5_6y_04' },
  // Academic
  { id: 'acad_5-6y_01', ageRangeId: '5-6y', domain: 'academic', titleKey: 'youth.ms_acad_5_6y_01' },
  { id: 'acad_5-6y_02', ageRangeId: '5-6y', domain: 'academic', titleKey: 'youth.ms_acad_5_6y_02' },
  { id: 'acad_5-6y_03', ageRangeId: '5-6y', domain: 'academic', titleKey: 'youth.ms_acad_5_6y_03' },
  { id: 'acad_5-6y_04', ageRangeId: '5-6y', domain: 'academic', titleKey: 'youth.ms_acad_5_6y_04' },
  // Social
  { id: 'soc_5-6y_01', ageRangeId: '5-6y', domain: 'social', titleKey: 'youth.ms_soc_5_6y_01' },
  { id: 'soc_5-6y_02', ageRangeId: '5-6y', domain: 'social', titleKey: 'youth.ms_soc_5_6y_02' },
  { id: 'soc_5-6y_03', ageRangeId: '5-6y', domain: 'social', titleKey: 'youth.ms_soc_5_6y_03' },
  { id: 'soc_5-6y_04', ageRangeId: '5-6y', domain: 'social', titleKey: 'youth.ms_soc_5_6y_04' },
  // Life Skills
  { id: 'life_5-6y_01', ageRangeId: '5-6y', domain: 'lifeSkills', titleKey: 'youth.ms_life_5_6y_01' },
  { id: 'life_5-6y_02', ageRangeId: '5-6y', domain: 'lifeSkills', titleKey: 'youth.ms_life_5_6y_02' },
  { id: 'life_5-6y_03', ageRangeId: '5-6y', domain: 'lifeSkills', titleKey: 'youth.ms_life_5_6y_03' },
  { id: 'life_5-6y_04', ageRangeId: '5-6y', domain: 'lifeSkills', titleKey: 'youth.ms_life_5_6y_04' },

  // ─── 6-8y (Early Elementary) ─────────────────────────────────
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

  // ─── 8-10y (Late Elementary) ─────────────────────────────────
  { id: 'phys_8-10y_01', ageRangeId: '8-10y', domain: 'physical', titleKey: 'youth.ms_phys_8_10y_01' },
  { id: 'phys_8-10y_02', ageRangeId: '8-10y', domain: 'physical', titleKey: 'youth.ms_phys_8_10y_02' },
  { id: 'phys_8-10y_03', ageRangeId: '8-10y', domain: 'physical', titleKey: 'youth.ms_phys_8_10y_03' },
  { id: 'phys_8-10y_04', ageRangeId: '8-10y', domain: 'physical', titleKey: 'youth.ms_phys_8_10y_04' },
  { id: 'acad_8-10y_01', ageRangeId: '8-10y', domain: 'academic', titleKey: 'youth.ms_acad_8_10y_01' },
  { id: 'acad_8-10y_02', ageRangeId: '8-10y', domain: 'academic', titleKey: 'youth.ms_acad_8_10y_02' },
  { id: 'acad_8-10y_03', ageRangeId: '8-10y', domain: 'academic', titleKey: 'youth.ms_acad_8_10y_03' },
  { id: 'acad_8-10y_04', ageRangeId: '8-10y', domain: 'academic', titleKey: 'youth.ms_acad_8_10y_04' },
  { id: 'soc_8-10y_01', ageRangeId: '8-10y', domain: 'social', titleKey: 'youth.ms_soc_8_10y_01' },
  { id: 'soc_8-10y_02', ageRangeId: '8-10y', domain: 'social', titleKey: 'youth.ms_soc_8_10y_02' },
  { id: 'soc_8-10y_03', ageRangeId: '8-10y', domain: 'social', titleKey: 'youth.ms_soc_8_10y_03' },
  { id: 'soc_8-10y_04', ageRangeId: '8-10y', domain: 'social', titleKey: 'youth.ms_soc_8_10y_04' },
  { id: 'life_8-10y_01', ageRangeId: '8-10y', domain: 'lifeSkills', titleKey: 'youth.ms_life_8_10y_01' },
  { id: 'life_8-10y_02', ageRangeId: '8-10y', domain: 'lifeSkills', titleKey: 'youth.ms_life_8_10y_02' },
  { id: 'life_8-10y_03', ageRangeId: '8-10y', domain: 'lifeSkills', titleKey: 'youth.ms_life_8_10y_03' },
  { id: 'life_8-10y_04', ageRangeId: '8-10y', domain: 'lifeSkills', titleKey: 'youth.ms_life_8_10y_04' },

  // ─── 10-12y (Pre-Teen) ──────────────────────────────────────
  { id: 'phys_10-12y_01', ageRangeId: '10-12y', domain: 'physical', titleKey: 'youth.ms_phys_10_12y_01' },
  { id: 'phys_10-12y_02', ageRangeId: '10-12y', domain: 'physical', titleKey: 'youth.ms_phys_10_12y_02' },
  { id: 'phys_10-12y_03', ageRangeId: '10-12y', domain: 'physical', titleKey: 'youth.ms_phys_10_12y_03' },
  { id: 'phys_10-12y_04', ageRangeId: '10-12y', domain: 'physical', titleKey: 'youth.ms_phys_10_12y_04' },
  { id: 'acad_10-12y_01', ageRangeId: '10-12y', domain: 'academic', titleKey: 'youth.ms_acad_10_12y_01' },
  { id: 'acad_10-12y_02', ageRangeId: '10-12y', domain: 'academic', titleKey: 'youth.ms_acad_10_12y_02' },
  { id: 'acad_10-12y_03', ageRangeId: '10-12y', domain: 'academic', titleKey: 'youth.ms_acad_10_12y_03' },
  { id: 'acad_10-12y_04', ageRangeId: '10-12y', domain: 'academic', titleKey: 'youth.ms_acad_10_12y_04' },
  { id: 'soc_10-12y_01', ageRangeId: '10-12y', domain: 'social', titleKey: 'youth.ms_soc_10_12y_01' },
  { id: 'soc_10-12y_02', ageRangeId: '10-12y', domain: 'social', titleKey: 'youth.ms_soc_10_12y_02' },
  { id: 'soc_10-12y_03', ageRangeId: '10-12y', domain: 'social', titleKey: 'youth.ms_soc_10_12y_03' },
  { id: 'soc_10-12y_04', ageRangeId: '10-12y', domain: 'social', titleKey: 'youth.ms_soc_10_12y_04' },
  { id: 'life_10-12y_01', ageRangeId: '10-12y', domain: 'lifeSkills', titleKey: 'youth.ms_life_10_12y_01' },
  { id: 'life_10-12y_02', ageRangeId: '10-12y', domain: 'lifeSkills', titleKey: 'youth.ms_life_10_12y_02' },
  { id: 'life_10-12y_03', ageRangeId: '10-12y', domain: 'lifeSkills', titleKey: 'youth.ms_life_10_12y_03' },
  { id: 'life_10-12y_04', ageRangeId: '10-12y', domain: 'lifeSkills', titleKey: 'youth.ms_life_10_12y_04' },

  // ─── 12-14y (Early Teen) ────────────────────────────────────
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

  // ─── 14-16y (Mid-Teen) ──────────────────────────────────────
  { id: 'phys_14-16y_01', ageRangeId: '14-16y', domain: 'physical', titleKey: 'youth.ms_phys_14_16y_01' },
  { id: 'phys_14-16y_02', ageRangeId: '14-16y', domain: 'physical', titleKey: 'youth.ms_phys_14_16y_02' },
  { id: 'phys_14-16y_03', ageRangeId: '14-16y', domain: 'physical', titleKey: 'youth.ms_phys_14_16y_03' },
  { id: 'phys_14-16y_04', ageRangeId: '14-16y', domain: 'physical', titleKey: 'youth.ms_phys_14_16y_04' },
  { id: 'acad_14-16y_01', ageRangeId: '14-16y', domain: 'academic', titleKey: 'youth.ms_acad_14_16y_01' },
  { id: 'acad_14-16y_02', ageRangeId: '14-16y', domain: 'academic', titleKey: 'youth.ms_acad_14_16y_02' },
  { id: 'acad_14-16y_03', ageRangeId: '14-16y', domain: 'academic', titleKey: 'youth.ms_acad_14_16y_03' },
  { id: 'acad_14-16y_04', ageRangeId: '14-16y', domain: 'academic', titleKey: 'youth.ms_acad_14_16y_04' },
  { id: 'soc_14-16y_01', ageRangeId: '14-16y', domain: 'social', titleKey: 'youth.ms_soc_14_16y_01' },
  { id: 'soc_14-16y_02', ageRangeId: '14-16y', domain: 'social', titleKey: 'youth.ms_soc_14_16y_02' },
  { id: 'soc_14-16y_03', ageRangeId: '14-16y', domain: 'social', titleKey: 'youth.ms_soc_14_16y_03' },
  { id: 'soc_14-16y_04', ageRangeId: '14-16y', domain: 'social', titleKey: 'youth.ms_soc_14_16y_04' },
  { id: 'life_14-16y_01', ageRangeId: '14-16y', domain: 'lifeSkills', titleKey: 'youth.ms_life_14_16y_01' },
  { id: 'life_14-16y_02', ageRangeId: '14-16y', domain: 'lifeSkills', titleKey: 'youth.ms_life_14_16y_02' },
  { id: 'life_14-16y_03', ageRangeId: '14-16y', domain: 'lifeSkills', titleKey: 'youth.ms_life_14_16y_03' },
  { id: 'life_14-16y_04', ageRangeId: '14-16y', domain: 'lifeSkills', titleKey: 'youth.ms_life_14_16y_04' },

  // ─── 16-18y (Late Teen) ─────────────────────────────────────
  { id: 'phys_16-18y_01', ageRangeId: '16-18y', domain: 'physical', titleKey: 'youth.ms_phys_16_18y_01' },
  { id: 'phys_16-18y_02', ageRangeId: '16-18y', domain: 'physical', titleKey: 'youth.ms_phys_16_18y_02' },
  { id: 'phys_16-18y_03', ageRangeId: '16-18y', domain: 'physical', titleKey: 'youth.ms_phys_16_18y_03' },
  { id: 'phys_16-18y_04', ageRangeId: '16-18y', domain: 'physical', titleKey: 'youth.ms_phys_16_18y_04' },
  { id: 'acad_16-18y_01', ageRangeId: '16-18y', domain: 'academic', titleKey: 'youth.ms_acad_16_18y_01' },
  { id: 'acad_16-18y_02', ageRangeId: '16-18y', domain: 'academic', titleKey: 'youth.ms_acad_16_18y_02' },
  { id: 'acad_16-18y_03', ageRangeId: '16-18y', domain: 'academic', titleKey: 'youth.ms_acad_16_18y_03' },
  { id: 'acad_16-18y_04', ageRangeId: '16-18y', domain: 'academic', titleKey: 'youth.ms_acad_16_18y_04' },
  { id: 'soc_16-18y_01', ageRangeId: '16-18y', domain: 'social', titleKey: 'youth.ms_soc_16_18y_01' },
  { id: 'soc_16-18y_02', ageRangeId: '16-18y', domain: 'social', titleKey: 'youth.ms_soc_16_18y_02' },
  { id: 'soc_16-18y_03', ageRangeId: '16-18y', domain: 'social', titleKey: 'youth.ms_soc_16_18y_03' },
  { id: 'soc_16-18y_04', ageRangeId: '16-18y', domain: 'social', titleKey: 'youth.ms_soc_16_18y_04' },
  { id: 'life_16-18y_01', ageRangeId: '16-18y', domain: 'lifeSkills', titleKey: 'youth.ms_life_16_18y_01' },
  { id: 'life_16-18y_02', ageRangeId: '16-18y', domain: 'lifeSkills', titleKey: 'youth.ms_life_16_18y_02' },
  { id: 'life_16-18y_03', ageRangeId: '16-18y', domain: 'lifeSkills', titleKey: 'youth.ms_life_16_18y_03' },
  { id: 'life_16-18y_04', ageRangeId: '16-18y', domain: 'lifeSkills', titleKey: 'youth.ms_life_16_18y_04' },
];
