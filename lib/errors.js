/**
 * An error that can safely be ignored by logging and reporting. Useful to trick
 * the behavior of libraries/frameworks like NextJS by throwing exceptions at them.
 */
export class IgnorableError extends Error {
  constructor(message, ...args) {
    super(message, ...args);
    this.message = `[Please ignore this error] ${message || ''}`;
  }
}
