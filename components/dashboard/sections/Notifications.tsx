'use client';

import type React from 'react';
import { useState } from 'react';
import { IntlProvider, FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import Avatar from '@/components/Avatar';
import { Badge } from '@/components/ui/Badge';

dayjs.extend(relativeTime);

enum NotificationType {
  EXPENSE_COMMENT = 0,
  EXPENSE_NEW = 1,
  EXPENSE_REJECTED = 2,
  EXPENSE_APPROVED = 3,
  EXPENSE_PAID = 4,
  APPLICATION_COMMENT = 5,
  APPLICATION_NEW = 6,
  APPLICATION_REJECTED = 7,
  APPLICATION_ACCEPTED = 8,
}

type TAccount = {
  imageUrl: string;
  name: string;
  slug: string;
};

type TExpense = {
  id: string;
  description: string;
  status: 'APPROVED' | 'PENDING' | 'PAID' | 'REJECTED';
};

type THostApplication = {
  id: string;
  message: string;
  status: 'PENDING' | 'REJECTED' | 'APPROVED';
  account: TAccount;
};

type TNotification = {
  read: boolean;
  createdBy: Partial<TAccount>;
  createdAt: string;
  type: NotificationType;
  ctx?: {
    expense?: Partial<TExpense>;
    application?: Partial<THostApplication>;
    comment?: string;
    account?: Partial<TAccount>;
  };
};

const notifications: TNotification[] = [
  {
    read: false,
    createdBy: {
      imageUrl: 'https://google.com/placeholder.svg?height=40&width=40',
      name: 'John Doe',
      slug: 'john-doe',
    },
    createdAt: dayjs().subtract(1, 'hour').toISOString(),
    type: NotificationType.EXPENSE_COMMENT,
    ctx: {
      expense: {
        description: 'Office equipment',
        status: 'APPROVED',
      },
      comment: 'Can you pay to a European bank account?',
    },
  },
  {
    read: true,
    createdBy: {
      imageUrl: 'https://google.com/placeholder.svg?height=40&width=40',
      name: 'Jane Smith',
      slug: 'jane-smith',
    },
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    type: NotificationType.APPLICATION_NEW,
    ctx: {
      application: {
        message: 'I would like to join your organization',
        status: 'PENDING',
      },
      account: {
        imageUrl: 'https://google.com/placeholder.svg?height=40&width=40',
        name: 'Jane Smith',
        slug: 'jane-smith',
      },
    },
  },
];

const messages = {
  NAidKb: 'Notifications',
  expense_comment: '{name} commented on expense {description}',
  application_new: '{name} submitted a new host application for {account}',
  default_notification: 'New notification',
  new_badge: 'New',
  all_tab: 'All',
  unread_tab: 'Unread',
};

const NotificationItem: React.FC<{ notification: TNotification }> = ({ notification }) => {
  const getNotificationContent = () => {
    switch (notification.type) {
      case NotificationType.EXPENSE_COMMENT:
        return (
          <FormattedMessage
            defaultMessage="{name} commented on expense {description}"
            id="expense_comment"
            values={{
              name: notification.createdBy.name,
              description: notification.ctx?.expense?.description,
              comment: notification.ctx?.comment,
            }}
          />
        );
      case NotificationType.APPLICATION_NEW:
        return (
          <FormattedMessage
            defaultMessage="{name} submitted a new host application for {account}"
            id="application_new"
            values={{
              name: notification.createdBy.name,
              message: notification.ctx?.application?.message,
              account: notification.ctx?.account?.name,
            }}
          />
        );
      default:
        return <FormattedMessage defaultMessage="New notification" id="default_notification" />;
    }
  };

  return (
    <div className={`border-b p-4 ${notification.read ? 'bg-background' : 'bg-accent'}`}>
      <div className="flex items-start space-x-4">
        <Avatar collective={notification.createdBy} />

        <div className="flex-1">
          <p className="text-sm font-medium">{getNotificationContent()}</p>
          <p className="text-sm text-muted-foreground">{dayjs(notification.createdAt).fromNow()}</p>
        </div>
        {!notification.read && (
          <Badge type="info">
            <FormattedMessage defaultMessage="New" id="new_badge" />
          </Badge>
        )}
      </div>
    </div>
  );
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = activeTab === 'all' ? notifications : notifications.filter(n => !n.read);

  return (
    <IntlProvider messages={messages} locale="en" defaultLocale="en">
      <div className="flex max-w-[--breakpoint-lg] flex-col gap-4">
        <DashboardHeader title={'Notifications'} />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All </TabsTrigger>
            <TabsTrigger value="unread">Unread </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="rounded-md border">
            {filteredNotifications.map((notification, index) => (
              <NotificationItem key={index} notification={notification} />
            ))}
          </TabsContent>
          <TabsContent value="unread" className="rounded-md border">
            {filteredNotifications.map((notification, index) => (
              <NotificationItem key={index} notification={notification} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </IntlProvider>
  );
}
