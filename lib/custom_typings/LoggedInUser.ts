export type LoggedInUser = {
  id: number;
  collective: {
    id: number;
    slug: string;
    name: string;
    type: string;
  };
  hasTwoFactorAuth: boolean;
  hasRole: (roles: string[] | string, collective) => boolean;
  hostsUserisAdminOf: () => any[];
  isAdminOfCollective: (collective: any) => boolean;
  isAdminOfCollectiveOrHost: (collective: any) => boolean;
  isHostAdmin: (collective: any) => boolean;
  isSelf: (collective: any) => boolean;
  canEditComment: (comment: any) => boolean;
  canEditEvent: (event: any) => boolean;
  canEditProject: (project: any) => boolean;
  canEditUpdate: (update: any) => boolean;
  canSeeAdminPanel: (collective: any) => boolean;
  email: string;
};
