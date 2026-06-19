import { Injectable } from '@angular/core';
import { ROLE_HIERARCHY } from '../models/user.model';

export interface AppPermissions {
  tier: number;
  tierLabel: string;
  // Navigation sections
  canViewPerformance: boolean;
  canViewAlerts: boolean;
  canViewActivity: boolean;
  canViewTeamDirectory: boolean;
  // Task operations
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  canViewAllTasks: boolean; // false → only own tasks
  canExportCsv: boolean;
  canViewBilling: boolean;
  // Team management
  canAddMember: boolean;
  canRemoveMember: boolean;
  // Overview depth
  canViewFullOverview: boolean;
  // Stage visibility: New + Refinement columns shown only to managers and above
  canSeeEarlyStages: boolean;
}

export function getRoleTier(role: string): number {
  const rank = ROLE_HIERARCHY[role] ?? 9;
  if (rank <= 2) return 1; // Admin / Sub-Admin
  if (rank === 3) return 2; // Senior Managers
  if (rank === 4) return 3; // Managers
  if (rank <= 6) return 4; // Associates / Audit Associates
  return 5;               // Executives / Assistants / Trainees
}

const TIER_MATRIX: Record<number, AppPermissions> = {
  1: {
    tier: 1, tierLabel: 'Admin',
    canViewPerformance: true, canViewAlerts: true, canViewActivity: true,
    canViewTeamDirectory: true, canCreateTask: true, canEditTask: true,
    canDeleteTask: true, canViewAllTasks: true, canExportCsv: true,
    canViewBilling: true, canAddMember: true, canRemoveMember: true,
    canViewFullOverview: true, canSeeEarlyStages: true,
  },
  2: {
    tier: 2, tierLabel: 'Senior Manager',
    canViewPerformance: true, canViewAlerts: true, canViewActivity: true,
    canViewTeamDirectory: true, canCreateTask: true, canEditTask: true,
    canDeleteTask: true, canViewAllTasks: true, canExportCsv: true,
    canViewBilling: true, canAddMember: false, canRemoveMember: false,
    canViewFullOverview: true, canSeeEarlyStages: true,
  },
  3: {
    tier: 3, tierLabel: 'Manager',
    canViewPerformance: false, canViewAlerts: true, canViewActivity: false,
    canViewTeamDirectory: true, canCreateTask: true, canEditTask: true,
    canDeleteTask: false, canViewAllTasks: true, canExportCsv: true,
    canViewBilling: true, canAddMember: false, canRemoveMember: false,
    canViewFullOverview: true, canSeeEarlyStages: true,
  },
  4: {
    tier: 4, tierLabel: 'Associate',
    canViewPerformance: false, canViewAlerts: false, canViewActivity: false,
    canViewTeamDirectory: false, canCreateTask: false, canEditTask: false,
    canDeleteTask: false, canViewAllTasks: false, canExportCsv: false,
    canViewBilling: false, canAddMember: false, canRemoveMember: false,
    canViewFullOverview: false, canSeeEarlyStages: false,
  },
  5: {
    tier: 5, tierLabel: 'Staff',
    canViewPerformance: false, canViewAlerts: false, canViewActivity: false,
    canViewTeamDirectory: false, canCreateTask: false, canEditTask: false,
    canDeleteTask: false, canViewAllTasks: false, canExportCsv: false,
    canViewBilling: false, canAddMember: false, canRemoveMember: false,
    canViewFullOverview: false, canSeeEarlyStages: false,
  },
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  permsFor(role: string): AppPermissions {
    return TIER_MATRIX[getRoleTier(role)] ?? TIER_MATRIX[5];
  }
}
