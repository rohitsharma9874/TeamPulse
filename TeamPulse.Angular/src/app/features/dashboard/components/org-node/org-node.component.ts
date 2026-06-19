import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, ROLE_LABELS } from '../../../../core/models/user.model';

export interface OrgTreeNode {
  user: User;
  children: OrgTreeNode[];
}

@Component({
  standalone: true,
  selector: 'app-org-node',
  imports: [CommonModule, OrgNodeComponent],
  templateUrl: './org-node.component.html',
  styleUrls: ['./org-node.component.scss'],
})
export class OrgNodeComponent {
  @Input() node!: OrgTreeNode;
  @Input() perms: { canAddMember: boolean; canRemoveMember: boolean } = { canAddMember: false, canRemoveMember: false };
  @Input() currentUserId?: string;
  @Input() taskCounts: Record<string, number> = {};
  @Input() onNodeClick!: (user: User) => void;
  @Input() onEditClick!: (user: User) => void;
  @Input() onDeleteClick!: (userId: string) => void;

  readonly roleLabels = ROLE_LABELS;

  get taskCount(): number {
    return this.taskCounts[this.node.user.id] ?? 0;
  }
}
