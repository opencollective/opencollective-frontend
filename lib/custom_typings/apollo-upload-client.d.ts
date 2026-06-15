declare module 'apollo-upload-client/UploadHttpLink.mjs' {
  import type { ApolloLink } from '@apollo/client';

  type UploadHttpLinkOptions = {
    uri?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string>;
    formDataAppendFile?: (formData: FormData, fieldName: string, file: File | Blob) => void;
  };

  export default class UploadHttpLink extends ApolloLink {
    constructor(options?: UploadHttpLinkOptions);
  }
}
