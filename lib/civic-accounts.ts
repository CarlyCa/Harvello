export const assignableRoles = ["Employee", "Hive Ambassador", "Reviewer", "Opportunity Coordinator", "Team Lead"] as const;
export type AssignableRole = typeof assignableRoles[number];

export type CivicAccount = {
  id: string;
  name: string;
  email: string | null;
  role: AssignableRole | "Administrator";
  active: boolean;
  department?: string | null;
  notes?: string | null;
  auth_user_id?: string | null;
};
