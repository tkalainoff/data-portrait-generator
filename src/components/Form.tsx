import React from 'react';
import type {
  ChartType,
  CommunityContribution,
  Department,
  DeskLocation,
  PortraitData,
  Skill,
  Tenure,
} from '../types';
import {
  CHART_TYPES,
  COMMUNITY_OPTIONS,
  DEPARTMENTS,
  DESK_LOCATIONS,
  SKILL_OPTIONS,
  TENURES,
} from '../types';

interface FormProps {
  value: PortraitData;
  onChange: (data: PortraitData) => void;
  onGenerate: () => void;
  isRendering: boolean;
}

function CheckGroup<T extends string>({
  options,
  selected,
  onChange,
  max,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
  max?: number;
}) {
  const toggle = (v: T) => {
    if (selected.includes(v)) {
      onChange(selected.filter((s) => s !== v));
    } else if (!max || selected.length < max) {
      onChange([...selected, v]);
    }
  };

  return (
    <div className="check-group">
      {options.map(({ value, label }) => {
        const checked = selected.includes(value);
        const disabled = !checked && !!max && selected.length >= max;
        return (
          <label
            key={value}
            className={`check-pill${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(value)}
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

export function Form({ value, onChange, onGenerate, isRendering }: FormProps) {
  const set = <K extends keyof PortraitData>(key: K, v: PortraitData[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <form className="portrait-form" onSubmit={(e) => { e.preventDefault(); onGenerate(); }}>
      <h2 className="form-title">Your Portrait</h2>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={value.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Full name"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="job_title">Job Title</label>
        <input
          id="job_title"
          type="text"
          value={value.job_title}
          onChange={(e) => set('job_title', e.target.value)}
          placeholder="Your role"
        />
      </div>

      <div className="field">
        <label htmlFor="pronouns">Pronouns</label>
        <input
          id="pronouns"
          type="text"
          value={value.pronouns}
          onChange={(e) => set('pronouns', e.target.value)}
          placeholder="e.g. she/her"
        />
      </div>

      <div className="field">
        <label htmlFor="department">Department</label>
        <select
          id="department"
          value={value.department}
          onChange={(e) => set('department', e.target.value as Department)}
        >
          {DEPARTMENTS.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tenure">Tenure</label>
        <select
          id="tenure"
          value={value.tenure}
          onChange={(e) => set('tenure', e.target.value as Tenure)}
        >
          {TENURES.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Community Contributions</label>
        <CheckGroup<CommunityContribution>
          options={COMMUNITY_OPTIONS}
          selected={value.community_contributions}
          onChange={(v) => set('community_contributions', v)}
        />
      </div>

      <div className="field">
        <label htmlFor="desk_location">Desk Location</label>
        <select
          id="desk_location"
          value={value.desk_location}
          onChange={(e) => set('desk_location', e.target.value as DeskLocation)}
        >
          {DESK_LOCATIONS.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Skills <span className="hint">(up to 6)</span></label>
        <CheckGroup<Skill>
          options={SKILL_OPTIONS}
          selected={value.skills}
          onChange={(v) => set('skills', v)}
          max={6}
        />
      </div>

      <div className="field">
        <label htmlFor="favorite_chart">Favorite Chart</label>
        <select
          id="favorite_chart"
          value={value.favorite_chart}
          onChange={(e) => set('favorite_chart', e.target.value as ChartType)}
        >
          {CHART_TYPES.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="generate-btn" disabled={isRendering}>
        {isRendering ? 'Generating…' : 'Generate Portrait'}
      </button>
    </form>
  );
}
