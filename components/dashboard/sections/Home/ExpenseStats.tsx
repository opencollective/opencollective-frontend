import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import TransferwiseIcon from '../../../icons/TransferwiseIcon';
import PayPal from '../../../icons/PayPal';
import { Stripe } from '@styled-icons/fa-brands/Stripe';
import { CreditCardIcon, InboxIcon, Receipt, X } from 'lucide-react';
import { Badge } from '../../../ui/Badge';
import React from 'react';
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
export default function Stats() {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
