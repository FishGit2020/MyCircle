export interface Child {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  dueDate?: string;
  bornDate?: string; // YYYY-MM-DD — marks when baby was actually born (concludes pregnancy tracking)
  avatarColor?: string;
  checkedMilestones?: string[];
}
