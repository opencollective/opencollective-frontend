-- All sponsors (all months)

select
	to_char(t."createdAt", 'YYYY-mm') as "month",
	sum(t.amount)/100 as amount,
	max(t.currency) as currency,
	c.slug as "fromCollective"

from "Transactions" t
inner join "Collectives" c on c.id = t."FromCollectiveId"

where
	amount > 0 and
	"CollectiveId" != 1 and
	t."platformFeeInHostCurrency" < 0 and
	t."deletedAt" IS NULL and
	((t."OrderId" IS NOT NULL AND t.type LIKE 'CREDIT')
	OR (t."ExpenseId" IS NOT NULL AND t.type LIKE 'DEBIT'))
	AND c.type ilike 'organization'
    AND ((t."RefundTransactionId" IS NOT NULL AND
          t."data"->'refund' IS NULL AND
          t.type = 'CREDIT') OR t."RefundTransactionId" IS NULL)

group by c.slug, "month"
order by c.slug
