export type LoggedInUser = {
  id: number;
  collective: {
    id: number;
    slug: string;
    name: string;
    type: string;
  };
};
