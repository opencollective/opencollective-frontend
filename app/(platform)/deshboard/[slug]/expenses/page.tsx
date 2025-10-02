import React from 'react';
import { ArrowLeft, Plus, Filter, Download } from 'lucide-react';

interface ExpensesPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ExpensesPage(props: ExpensesPageProps) {
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
            <h1 className="mb-2 text-3xl font-bold text-foreground">Expenses - {slug}</h1>
            <p className="text-muted-foreground">Manage and track expenses for your collective</p>
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
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              New Expense
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Total Expenses</h3>
          <p className="text-2xl font-bold text-foreground">$12,450</p>
          <p className="mt-1 text-sm text-green-600">+5.2% from last month</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Pending Approval</h3>
          <p className="text-2xl font-bold text-foreground">8</p>
          <p className="mt-1 text-sm text-yellow-600">Requires attention</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">This Month</h3>
          <p className="text-2xl font-bold text-foreground">$2,340</p>
          <p className="mt-1 text-sm text-muted-foreground">23 expenses</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Average Amount</h3>
          <p className="text-2xl font-bold text-foreground">$156</p>
          <p className="mt-1 text-sm text-muted-foreground">Per expense</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold text-foreground">Recent Expenses</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Sample expense items */}
            {[
              { id: 1, description: 'Office Supplies', amount: '$245.00', status: 'Approved', date: '2024-01-15' },
              { id: 2, description: 'Team Lunch', amount: '$89.50', status: 'Pending', date: '2024-01-14' },
              { id: 3, description: 'Software License', amount: '$299.00', status: 'Approved', date: '2024-01-13' },
              { id: 4, description: 'Travel Expenses', amount: '$450.00', status: 'Processing', date: '2024-01-12' },
            ].map(expense => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{expense.description}</h3>
                  <p className="text-sm text-muted-foreground">{expense.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">{expense.amount}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      expense.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : expense.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {expense.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
