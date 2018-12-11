export default {
  adaptive: {
    pay: {
      success: {
        responseEnvelope: {
          timestamp: '2015-06-21T17:44:37.487-07:00',
          ack: 'Success',
          correlationId: 'c388ecaf49b1b',
          build: '15743565',
        },
        payKey: 'AP-791807008W699005A',
        paymentExecStatus: 'CREATED',
        defaultFundingPlan: {
          fundingPlanId: '0',
          fundingAmount: {
            code: 'EUR',
            amount: '15.56',
          },
          backupFundingSource: {
            lastFourOfAccountNumber: '0035',
            type: 'CREDITCARD',
          },
          senderFees: {
            code: 'USD',
            amount: '3.78',
          },
          currencyConversion: {
            exchangeRate: '0.9115770282588879',
          },
          charge: [
            {
              charge: { code: 'USD', amount: '120.00' },
              fundingSource: { type: 'BALANCE' },
            },
          ],
        },
        httpStatusCode: 200,
        paymentApprovalUrl: 'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_ap-payment&paykey=AP-791807008W699005A',
      },
      error: {
        responseEnvelope: {
          timestamp: '2018-12-07T06:58:13.981-08:00',
          ack: 'Failure',
          correlationId: '7c5fbca45d456',
          build: '50282587',
        },
        error: [
          {
            errorId: '579031',
            domain: 'PLATFORM',
            subdomain: 'Application',
            severity: 'Error',
            category: 'Application',
            message: 'The total amount of all payments exceeds the maximum total amount for all payments',
          },
        ],
        httpStatusCode: 200,
      },
    },

    executePayment: {
      responseEnvelope: {
        timestamp: '2015-07-12T15:52:32.827-07:00',
        ack: 'Success',
        correlationId: '2abc79e90b8d5',
        build: '17325060',
      },
      payKey: 'AP-8HL44700YF673952M',
      paymentExecStatus: 'COMPLETED',
      httpStatusCode: 200,
    },
    paymentDetails: {
      created: {
        responseEnvelope: {
          timestamp: '2015-07-01T21:25:44.983-07:00',
          ack: 'Success',
          correlationId: '49f5b1753e0df',
          build: '15743565',
        },
        cancelUrl: 'http://localhost:8000/collectives/2/transactions/1/cancel',
        currencyCode: 'USD',
        memo: 'Reimbursement transaction 1: Homepage design',
        paymentInfoList: {
          paymentInfo: [[null], [null]],
        },
        returnUrl: 'http://localhost:8000/collectives/2/transactions/1/success',
        status: 'CREATED',
        trackingId: 'f56ca700:27',
        payKey: 'AP-791807008W699005A',
        actionType: 'PAY',
        feesPayer: 'SENDER',
        reverseAllParallelPaymentsOnError: 'false',
        sender: {
          useCredentials: 'false',
        },
        httpStatusCode: 200,
      },

      completed: {
        responseEnvelope: {
          timestamp: '2015-07-01T21:27:37.687-07:00',
          ack: 'Success',
          correlationId: 'e0d6da2659ff9',
          build: '15743565',
        },
        cancelUrl: 'http://localhost:8000/collectives/2/transactions/1/cancel',
        currencyCode: 'USD',
        memo: 'Reimbursement transaction 1: Homepage design',
        paymentInfoList: {
          paymentInfo: [[null], [null]],
        },
        returnUrl: 'http://localhost:8000/collectives/2/transactions/1/success',
        senderEmail: 'philippe.modard+paypalsandbox@gmail.com',
        status: 'COMPLETED',
        trackingId: 'f56ca700:27',
        payKey: 'AP-791807008W699005A',
        actionType: 'PAY',
        feesPayer: 'SENDER',
        reverseAllParallelPaymentsOnError: 'false',
        sender: {
          email: 'philippe.modard+paypalsandbox@gmail.com',
          accountId: 'UA4WZRN8UFEAU',
          useCredentials: 'false',
        },
        httpStatusCode: 200,
      },

      error: {
        responseEnvelope: {
          timestamp: '2015-07-01T21:30:34.416-07:00',
          ack: 'Failure',
          correlationId: '4bba3cee78340',
          build: '15743565',
        },
        error: [
          {
            errorId: '580022',
            domain: 'PLATFORM',
            subdomain: 'Application',
            severity: 'Error',
            category: 'Application',
            message: 'Invalid request parameter: payKey with value AP-7AR83715KM669105N',
            parameter: [null],
          },
        ],
        httpStatusCode: 200,
      },
    },

    preapproval: {
      responseEnvelope: {
        timestamp: '2015-07-08T22:48:47.136-07:00',
        ack: 'Success',
        correlationId: '125441b58945b',
        build: '15743565',
      },
      preapprovalKey: 'PA-94H23180P4099625W',
      httpStatusCode: 200,
      preapprovalUrl: 'https://www.sandbox.paypal.com/webscr?cmd=_ap-preapproval&preapprovalkey=PA-94H23180P4099625W',
    },

    preapprovalDetails: {
      created: {
        responseEnvelope: {
          timestamp: '2015-07-08T23:03:28.698-07:00',
          ack: 'Success',
          correlationId: '6f7bbf6fa2c0e',
          build: '15743565',
        },
        approved: 'false',
        cancelUrl: 'http://your-website.com',
        curPayments: '0',
        curPaymentsAmount: '0.00',
        curPeriodAttempts: '0',
        currencyCode: 'USD',
        dateOfMonth: '0',
        dayOfWeek: 'NO_DAY_SPECIFIED',
        endingDate: '2020-01-01T00:00:00.000Z',
        maxNumberOfPayments: '11',
        maxTotalAmountOfAllPayments: '123.00',
        paymentPeriod: 'NO_PERIOD_SPECIFIED',
        pinType: 'NOT_REQUIRED',
        returnUrl: 'http://your-website.com',
        startingDate: '2015-07-09T05:48:46.000Z',
        status: 'ACTIVE',
        ipnNotificationUrl: 'http://your-ipn-listener.com',
        displayMaxTotalAmount: 'true',
        httpStatusCode: 200,
      },

      completed: {
        responseEnvelope: {
          timestamp: '2015-07-09T17:51:41.091-07:00',
          ack: 'Success',
          correlationId: '01f913c1246cf',
          build: '15743565',
        },
        approved: 'true',
        cancelUrl: 'http://your-website.com',
        curPayments: '0',
        curPaymentsAmount: '0.00',
        curPeriodAttempts: '0',
        currencyCode: 'USD',
        dateOfMonth: '0',
        dayOfWeek: 'NO_DAY_SPECIFIED',
        endingDate: '2020-01-01T00:00:00.000Z',
        maxNumberOfPayments: '11',
        maxTotalAmountOfAllPayments: '2000.00',
        paymentPeriod: 'NO_PERIOD_SPECIFIED',
        pinType: 'NOT_REQUIRED',
        returnUrl: 'http://your-website.com',
        senderEmail: 'philippe.modard+paypalsandbox@gmail.com',
        startingDate: '2015-07-09T05:48:46.000Z',
        status: 'ACTIVE',
        ipnNotificationUrl: 'http://your-ipn-listener.com',
        displayMaxTotalAmount: 'true',
        sender: {
          accountId: 'UA4WZRN8UFEAU',
        },
        httpStatusCode: 200,
      },

      error: {
        responseEnvelope: {
          timestamp: '2015-10-20T03:21:33.373-07:00',
          ack: 'Failure',
          correlationId: 'efb2c427728cc',
          build: '17820627',
        },
        error: [
          {
            errorId: '520003',
            domain: 'PLATFORM',
            subdomain: 'Application',
            severity: 'Error',
            category: 'Application',
            message: 'Authentication failed. API credentials are incorrect.',
          },
        ],
      },
    },
  },
};
