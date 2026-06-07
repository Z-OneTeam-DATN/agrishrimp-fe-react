export interface RoleType {
  id: number;
  slug: string;
  displayName: string;
  isActive: boolean;
  isSystem: boolean;
  memberCount?: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: number;
  updatedByUserId: number;
}

export interface PermissionAction {
  id: number;
  name: string;
  slug: string;
}

export interface ModulePermission {
  id: number;
  name: string;
  slug: string;
  actions: PermissionAction[];
}

export interface PermissionGroup {
  groupName: string;
  groupLabel: string;
  modules: ModulePermission[];
}

export interface RoleDetail extends RoleType {
  permissionCodes: string[];
  permissions: {
    id: number;
    name: string;
    slug: string;
    type: 'MODULE' | 'ACTION';
  }[];
}
