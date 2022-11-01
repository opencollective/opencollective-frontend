import { variant } from 'styled-system';

export type MessageType = 'white' | 'dark' | 'info' | 'success' | 'warning' | 'error';

export const messageType = variant({
  key: 'messageTypes',
  prop: 'type',
});
