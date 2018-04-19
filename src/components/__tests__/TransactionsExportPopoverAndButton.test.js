import { transformResultInCSV } from '../TransactionsExportPopoverAndButton';

describe("TransactionsExportPopoverAndButton component", () => {
  it("TransformResultsInCSV", async () => {
    // When some JSON is transformed in CSV
    const csv = transformResultInCSV([{
      description: "monthly recurring subscription",
      createdAt: "Mon Dec 04 2017 10:43:04 GMT-0500 (EST)",
      amount: 200,
      currency: "BRL",
      netAmountInCollectiveCurrency: 144,
      hostFeeInHostCurrency: 10,
      platformFeeInHostCurrency: 10,
      paymentProcessorFeeInHostCurrency: 36,
      paymentMethod: { service: "stripe" },
      fromCollective: { id: 7603, name: "Brad Pinter", slug: "bradpinter" },
      host:{ id: 9805, name: "Open Source Collective org", currency: "USD" },
      subscription: { interval: "month" },
    }]);

    // Then it should output the following CSV
    expect(csv).toEqual([
      "Transaction Description,User Name,User Profile,Transaction Date,Collective Currency,Host Currency,Transaction Amount,Host Fee (USD),OpenCollective Fee (USD),Payment Processor Fee (USD),Net Amount (BRL),Subscription Interval,Order Date",
      '"monthly recurring subscription","Brad Pinter","http://opencollective.com/bradpinter",2017-12-04 15:43:04,"BRL","USD",2.00,0.10,0.10,0.36,1.44,"month","2017-12-04T15:43:04.000Z"'
    ].join("\n"))
  });
});
