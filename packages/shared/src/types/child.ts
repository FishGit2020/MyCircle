export interface Child {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  dueDate?: string;
  avatarColor?: string;
  checkedMilestones?: string[];
}
