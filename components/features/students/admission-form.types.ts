export interface SelectOption {
  value: string;
  label: string;
}

// Every section receives its slice of react-hook-form's API via useFormContext() rather than
// prop-drilled register/errors — this shared prop shape only covers what a few sections need
// beyond that (option lists for selects that will eventually come from a real service call).
export interface AcademicOptions {
  academicSessions: SelectOption[];
  classes: SelectOption[];
  sections: SelectOption[];
}
