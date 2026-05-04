export type Department =
  | 'strategy'
  | 'creative'
  | 'technology'
  | 'operations'
  | 'client-services';

export type Tenure =
  | 'less-than-1'
  | '1-3'
  | '3-5'
  | '5-10'
  | '10-plus';

export type CommunityContribution =
  | 'mentorship'
  | 'dei'
  | 'sustainability'
  | 'social'
  | 'learning';

export type DeskLocation =
  | 'new-york'
  | 'london'
  | 'chicago'
  | 'austin'
  | 'remote';

export type Skill =
  | 'design'
  | 'data'
  | 'strategy'
  | 'writing'
  | 'research'
  | 'facilitation';

export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'scatter'
  | 'map'
  | 'network';

export interface PortraitData {
  name: string;
  job_title: string;
  pronouns: string;
  department: Department;
  tenure: Tenure;
  community_contributions: CommunityContribution[];
  desk_location: DeskLocation;
  skills: Skill[];
  favorite_chart: ChartType;
}

export const SAMPLE_DATA: PortraitData = {
  name: 'Alex Rivera',
  job_title: 'Senior Innovation Lead',
  pronouns: 'they/them',
  department: 'creative',
  tenure: '3-5',
  community_contributions: ['mentorship', 'sustainability', 'learning'],
  desk_location: 'remote',
  skills: ['design', 'strategy', 'facilitation'],
  favorite_chart: 'pie',
};

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'strategy', label: 'Strategy' },
  { value: 'creative', label: 'Creative' },
  { value: 'technology', label: 'Technology' },
  { value: 'operations', label: 'Operations' },
  { value: 'client-services', label: 'Client Services' },
];

export const TENURES: { value: Tenure; label: string }[] = [
  { value: 'less-than-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1–3 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10-plus', label: '10+ years' },
];

export const COMMUNITY_OPTIONS: { value: CommunityContribution; label: string }[] = [
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'dei', label: 'DEI' },
  { value: 'sustainability', label: 'Sustainability' },
  { value: 'social', label: 'Social' },
  { value: 'learning', label: 'Learning' },
];

export const DESK_LOCATIONS: { value: DeskLocation; label: string }[] = [
  { value: 'new-york', label: 'New York' },
  { value: 'london', label: 'London' },
  { value: 'chicago', label: 'Chicago' },
  { value: 'austin', label: 'Austin' },
  { value: 'remote', label: 'Remote' },
];

export const SKILL_OPTIONS: { value: Skill; label: string }[] = [
  { value: 'design', label: 'Design' },
  { value: 'data', label: 'Data' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'writing', label: 'Writing' },
  { value: 'research', label: 'Research' },
  { value: 'facilitation', label: 'Facilitation' },
];

export const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'map', label: 'Map' },
  { value: 'network', label: 'Network' },
];
