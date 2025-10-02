import React from 'react';

interface DashboardPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const params = await props.params;
  const { slug } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Dashboard - {slug}</h1>
        <p className="text-muted-foreground">Welcome to the dashboard for {slug}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Overview</h2>
          <p className="text-muted-foreground">Quick overview of your collective's activity and metrics.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Recent Activity</h2>
          <p className="text-muted-foreground">Latest transactions and updates for your collective.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href={`/dashboard/${slug}/expenses`}
              className="block text-blue-600 transition-colors hover:text-blue-800"
            >
              → View Expenses
            </a>
            <a
              href={`/dashboard/${slug}/transactions`}
              className="block text-blue-600 transition-colors hover:text-blue-800"
            >
              → View Transactions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
