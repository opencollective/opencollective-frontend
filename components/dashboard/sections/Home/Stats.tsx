import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import TransferwiseIcon from '../../../icons/TransferwiseIcon';
import PayPal from '../../../icons/PayPal';
import { Stripe } from '@styled-icons/fa-brands/Stripe';
import { CreditCardIcon, InboxIcon, Receipt, X } from 'lucide-react';
import { Badge } from '../../../ui/Badge';
import React from 'react';
import { isHostAccount, isIndividualAccount } from '../../../../lib/collective.lib';

const chartData = [
  {
    revenue: 10400,
    subscription: 240,
  },
  {
    revenue: 14405,
    subscription: 300,
  },
  {
    revenue: 9400,
    subscription: 200,
  },
  {
    revenue: 8200,
    subscription: 278,
  },
  {
    revenue: 7000,
    subscription: 189,
  },
  {
    revenue: 9600,
    subscription: 239,
  },
  {
    revenue: 11244,
    subscription: 278,
  },
  {
    revenue: 26475,
    subscription: 189,
  },
];

const individualDchartData = [
  {
    revenue: 500,
    subscription: 240,
  },
  {
    revenue: 1204,
    subscription: 300,
  },
  {
    revenue: 2105,
    subscription: 200,
  },
  {
    revenue: 2421,
    subscription: 278,
  },
  {
    revenue: 2323,
    subscription: 189,
  },
  {
    revenue: 2385,
    subscription: 239,
  },
  {
    revenue: 2504,
    subscription: 278,
  },
  {
    revenue: 2484,
    subscription: 189,
  },
];

export default function Stats({ account }) {
  const isHost = isHostAccount(account);
  const isIndividual = isIndividualAccount(account);
  const isCollective = !isHost && !isIndividual;

  if (isHost) {
    return (
      <div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paypal balance</CardTitle>
              <PayPal size={16} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$78,521.34</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wise balance</CardTitle>
              <TransferwiseIcon size={16} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stripe issuing balance</CardTitle>
              <Stripe size={16} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
            </CardContent>
          </Card>
          {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe issuing balance</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card> */}
          {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-normal">Expenses in Ready to pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">432</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <Line
                    type="monotone"
                    strokeWidth={2}
                    dataKey="revenue"
                    activeDot={{
                      r: 6,
                      style: { fill: 'var(--theme-primary)', opacity: 0.25 },
                    }}
                    style={
                      {
                        stroke: 'var(--theme-primary)',
                        '--theme-primary': `hsl(221.2 83.2% 53.3%)`,
                      } as React.CSSProperties
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card> */}
        </div>
        <div className="mt-8 rounded-md border bg-slate-50/50 text-sm text-slate-500 antialiased">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <Receipt size={16} />
              <span>
                <span className="cursor-pointer font-medium text-primary hover:underline">74 expenses</span> are ready
                to be paid.
              </span>
              <Badge type="info" size="xs">
                5 new
              </Badge>
            </div>
            <X size={16} />
          </div>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <CreditCardIcon size={16} />
              <span>
                <span className="cursor-pointer font-medium text-primary hover:underline">5 virtual card requests</span>{' '}
                are pending.
              </span>
              <Badge type="info" size="xs">
                1 new
              </Badge>
            </div>
            <X size={16} />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <InboxIcon size={16} />
              <span>
                <span className="cursor-pointer font-medium text-primary hover:underline">12 host applications</span>{' '}
                are pending.
              </span>
              <Badge type="info" size="xs">
                3 new
              </Badge>
            </div>
            <X size={16} />
          </div>
        </div>
      </div>
    );
  }
  if (isCollective) {
    return (
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-normal">Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$7,421.89</div>
            {/* <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <Line
                    type="monotone"
                    strokeWidth={2}
                    dataKey="revenue"
                    activeDot={{
                      r: 6,
                      style: { fill: 'var(--theme-primary)', opacity: 0.25 },
                    }}
                    style={
                      {
                        stroke: 'var(--theme-primary)',
                        '--theme-primary': `hsl(221.2 83.2% 53.3%)`,
                      } as React.CSSProperties
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-normal">Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$5,323.32</div>
            {/* <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <Line
                    type="monotone"
                    strokeWidth={2}
                    dataKey="revenue"
                    activeDot={{
                      r: 6,
                      style: { fill: 'var(--theme-primary)', opacity: 0.25 },
                    }}
                    style={
                      {
                        stroke: 'var(--theme-primary)',
                        '--theme-primary': `hsl(221.2 83.2% 53.3%)`,
                      } as React.CSSProperties
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collective balance</CardTitle>
            {/* <PayPal size={16} /> */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,521.34</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-normal">Received</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$15,231.89</div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={individualDchartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="revenue"
                  activeDot={{
                    r: 6,
                    style: { fill: 'var(--theme-primary)', opacity: 0.25 },
                  }}
                  style={
                    {
                      stroke: 'var(--theme-primary)',
                      '--theme-primary': `hsl(221.2 83.2% 53.3%)`,
                    } as React.CSSProperties
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
