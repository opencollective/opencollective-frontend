/**
 * Representative variables for the GraphQL query cost report (opencollective/opencollective#9084), by operation name.
 *
 * The report computes the cost of each operation with the defaults of its variables, then the defaults of the
 * schema. When that does not reflect how the operation is used (for example a `limit` variable without default that
 * the page always sets to 10), declare the variables the page sends here:
 *
 *     DashboardExpenses: { limit: 10 },
 *
 * Only `limit` values change the cost. The report lists names that match no operation as problems, so that entries
 * do not outlive the operations they describe.
 */
const representativeVariables: Record<string, Record<string, unknown>> = {};

// config file
// ts-unused-exports:disable-next-line
export default representativeVariables;
