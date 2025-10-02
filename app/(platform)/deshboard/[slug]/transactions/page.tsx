import React from 'react';
import { ArrowLeft, Filter, Download, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';

interface TransactionsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TransactionsPage(props: TransactionsPageProps) {
  const params = await props.params;
  const { slug } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <a
            href={`/dashboard/${slug}`}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </a>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Transactions - {slug}</h1>
            <p className="text-muted-foreground">View all financial transactions for your collective</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-foreground transition-colors hover:bg-accent">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-foreground transition-colors hover:bg-accent">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">$8,450.00</p>
          <p className="mt-1 text-sm text-green-600">+12.5% from last month</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Income</h3>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">$15,230.00</p>
          <p className="mt-1 text-sm text-muted-foreground">This month: $2,340</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">$6,780.00</p>
          <p className="mt-1 text-sm text-muted-foreground">This month: $1,890</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Transactions</h3>
          <p className="text-2xl font-bold text-foreground">247</p>
          <p className="mt-1 text-sm text-muted-foreground">Total count</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Sample transaction items */}
            {[
              {
                id: 1,
                type: 'income',
                description: 'Monthly Donation from John Doe',
                amount: '+$100.00',
                date: '2024-01-15',
                category: 'Donation',
              },
              {
                id: 2,
                type: 'expense',
                description: 'Office Supplies Purchase',
                amount: '-$245.00',
                date: '2024-01-14',
                category: 'Office',
              },
              {
                id: 3,
                type: 'income',
                description: 'Sponsorship from Tech Corp',
                amount: '+$500.00',
                date: '2024-01-13',
                category: 'Sponsorship',
              },
              {
                id: 4,
                type: 'expense',
                description: 'Team Event Catering',
                amount: '-$180.00',
                date: '2024-01-12',
                category: 'Events',
              },
              {
                id: 5,
                type: 'income',
                description: 'Merchandise Sales',
                amount: '+$75.50',
                date: '2024-01-11',
                category: 'Sales',
              },
            ].map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {transaction.type === 'income' ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{transaction.description}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-700">
                        {transaction.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {transaction.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-6 text-center">
            <button className="rounded-md border border-border px-6 py-2 text-foreground transition-colors hover:bg-accent">
              Load More Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
