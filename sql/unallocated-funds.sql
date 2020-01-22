SELECT
  c.slug AS organization,
  pm.name AS description,
  TRUNC((pm."initialBalance" / 100.0), 2) AS initial_funds,
  TRUNC((pm."initialBalance" + SUM(t."netAmountInCollectiveCurrency")) / 100.0, 2) AS unallocated_funds,
  pm.currency
FROM
  "PaymentMethods" pm
INNER JOIN
  "Collectives" c ON c.id = pm."CollectiveId"
INNER JOIN
  "Transactions" t ON t."PaymentMethodId" = pm.id AND t."type" = 'DEBIT'
WHERE
  pm.service = 'opencollective'AND pm."type" = 'prepaid'
AND
  (pm."data" ->> 'HostCollectiveId')::integer = $collectiveId -- Use 11004 for OSC
AND
  pm."deletedAt" IS NULL
AND
  t."deletedAt" IS NULL
GROUP BY
  c.id, pm.id
HAVING
  (pm."initialBalance" + SUM(t."netAmountInCollectiveCurrency")) > 0
