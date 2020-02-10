/**
 * Typescript interface for the `User` model ()
 */
interface IUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  emailWaitingForValidation: string;
  emailConfirmationToken: string;
  data: any | null;
}
