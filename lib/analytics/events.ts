export const enum AnalyticsEvent {
  CONTRIBUTION_STARTED = 'Contribution Started',
  CONTRIBUTION_DETAILS_STEP_COMPLETED = 'Contribution Details Step Completed',
  CONTRIBUTION_PAYMENT_STEP = 'Contribution Payment Step',
  CONTRIBUTION_SUBMITTED = 'Contribution Submitted',
  CONTRIBUTION_SUCCESS = 'Contribution Success',
  CONTRIBUTION_ERROR = 'Contribution Error',

  EXPENSE_SUBMISSION_STARTED = 'Expense Submission Started',
  EXPENSE_SUBMISSION_PICKED_COLLECTIVE = 'Expense Submission Picked Collective',
  EXPENSE_SUBMISSION_PICKED_PAYEE = 'Expense Submission Picked Payee',
  EXPENSE_SUBMISSION_PICKED_EXPENSE_TYPE = 'Expense Submission Picked Expense Type',
  EXPENSE_SUBMISSION_PICKED_EXPENSE_TITLE = 'Expense Submission Picked Expense Title',
  EXPENSE_SUBMISSION_FILLED_EXPENSE_DETAILS = 'Expense Submission Filled Expense Details',
  EXPENSE_SUBMISSION_SUBMITTED = 'Expense Submitted',
  EXPENSE_SUBMISSION_SUBMITTED_SUCCESS = 'Expense Submitted Success',
  EXPENSE_SUBMISSION_SUBMITTED_ERROR = 'Expense Submitted Error',
}
