import { omit, pick } from 'lodash';
import {
  claimCollective,
  createCollective,
  editCollective,
  deleteEventCollective,
  deleteCollective,
  deleteUserCollective,
  approveCollective,
  createCollectiveFromGithub,
  archiveCollective,
  unarchiveCollective,
} from './mutations/collectives';
import {
  createOrder,
  confirmOrder,
  cancelSubscription,
  updateSubscription,
  refundTransaction,
  addFundsToOrg,
  addFundsToCollective,
  completePledge,
  markOrderAsPaid,
} from './mutations/orders';

import { createMember, removeMember, editMembership } from './mutations/members';
import { editTiers, editTier } from './mutations/tiers';
import { editConnectedAccount } from './mutations/connectedAccounts';
import { createWebhook, deleteNotification, editWebhooks } from './mutations/notifications';
import { createExpense, editExpense, updateExpenseStatus, payExpense, deleteExpense } from './mutations/expenses';
import * as paymentMethodsMutation from './mutations/paymentMethods';
import * as updateMutations from './mutations/updates';
import * as commentMutations from './mutations/comments';
import * as applicationMutations from './mutations/applications';
import * as backyourstackMutations from './mutations/backyourstack';
import { updateUserEmail, confirmUserEmail } from './mutations/users';

import statuses from '../../constants/expense_status';

import { GraphQLNonNull, GraphQLList, GraphQLString, GraphQLInt, GraphQLBoolean, GraphQLObjectType } from 'graphql';

import {
  OrderType,
  TierType,
  MemberType,
  ExpenseType,
  UpdateType,
  CommentType,
  ConnectedAccountType,
  PaymentMethodType,
  UserType,
  NotificationType,
} from './types';

import { CollectiveInterfaceType } from './CollectiveInterface';

import { TransactionInterfaceType } from './TransactionInterface';

import { ApplicationType, ApplicationInputType } from './Application';

import {
  CollectiveInputType,
  CollectiveAttributesInputType,
  OrderInputType,
  ConfirmOrderInputType,
  TierInputType,
  ExpenseInputType,
  UpdateInputType,
  UpdateAttributesInputType,
  CommentInputType,
  CommentAttributesInputType,
  ConnectedAccountInputType,
  PaymentMethodInputType,
  PaymentMethodDataVirtualCardInputType,
  UserInputType,
  StripeCreditCardDataInputType,
  NotificationInputType,
} from './inputTypes';
import { createVirtualCardsForEmails, bulkCreateVirtualCards } from '../../paymentProviders/opencollective/virtualcard';
import models, { sequelize } from '../../models';
import emailLib from '../../lib/email';
import roles from '../../constants/roles';

const mutations = {
  createCollective: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) },
    },
    resolve(_, args, req) {
      return createCollective(_, args, req);
    },
  },
  createCollectiveFromGithub: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) },
    },
    resolve(_, args, req) {
      return createCollectiveFromGithub(_, args, req);
    },
  },
  editCollective: {
    type: CollectiveInterfaceType,
    args: {
      collective: { type: new GraphQLNonNull(CollectiveInputType) },
    },
    resolve(_, args, req) {
      return editCollective(_, args, req);
    },
  },
  deleteEventCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return deleteEventCollective(_, args, req);
    },
  },
  deleteCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return deleteCollective(_, args, req);
    },
  },
  deleteUserCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return deleteUserCollective(_, args, req);
    },
  },
  claimCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(...args) {
      return claimCollective(...args);
    },
  },
  approveCollective: {
    type: CollectiveInterfaceType,
    description: 'Approve a collective',
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return approveCollective(req.remoteUser, args.id);
    },
  },
  archiveCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return archiveCollective(_, args, req);
    },
  },
  unarchiveCollective: {
    type: CollectiveInterfaceType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return unarchiveCollective(_, args, req);
    },
  },
  createUser: {
    description: 'Create a user with an optional organization.',
    type: new GraphQLObjectType({
      name: 'CreateUserResult',
      fields: {
        user: { type: UserType },
        organization: { type: CollectiveInterfaceType },
      },
    }),
    args: {
      user: {
        type: new GraphQLNonNull(UserInputType),
        description: 'The user info',
      },
      organization: {
        type: CollectiveInputType,
        description: 'An optional organization to create alongside the user',
      },
      redirect: {
        type: GraphQLString,
        description: 'The redirect URL for the login email sent to the user',
        defaultValue: '/',
      },
      websiteUrl: {
        type: GraphQLString,
        description: 'The website URL originating the request',
      },
    },
    resolve(_, args) {
      return sequelize.transaction(async transaction => {
        // Create user
        if (await models.User.findOne({ where: { email: args.user.email.toLowerCase() } }, { transaction })) {
          throw new Error('User already exists for given email');
        }

        const user = await models.User.createUserWithCollective(args.user, transaction);
        const loginLink = user.generateLoginLink(args.redirect, args.websiteUrl);

        if (!args.organization) {
          emailLib.send('user.new.token', user.email, { loginLink }, { sendEvenIfNotProduction: true });
          return { user, organization: null };
        }

        // Create organization
        const organizationParams = {
          type: 'ORGANIZATION',
          ...pick(args.organization, ['name', 'website', 'twitterHandle', 'githubHandle']),
        };
        const organization = await models.Collective.create(organizationParams, { transaction });
        await organization.addUserWithRole(user, roles.ADMIN, { CreatedByUserId: user.id }, transaction);

        emailLib.send('user.new.token', user.email, { loginLink }, { sendEvenIfNotProduction: true });
        return { user, organization };
      });
    },
  },
  updateUserEmail: {
    type: UserType,
    description: 'Update the email address for logged in user',
    args: {
      email: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'The new email address for user',
      },
    },
    resolve: (_, { email }, { remoteUser }) => {
      return updateUserEmail(remoteUser, email);
    },
  },
  confirmUserEmail: {
    type: UserType,
    description: 'Confirm the new user email from confirmation token',
    args: {
      token: {
        type: new GraphQLNonNull(GraphQLString),
        description: "User's emailConfirmationToken",
      },
    },
    resolve: (_, { token }) => {
      return confirmUserEmail(token);
    },
  },
  editConnectedAccount: {
    type: ConnectedAccountType,
    args: {
      connectedAccount: { type: new GraphQLNonNull(ConnectedAccountInputType) },
    },
    resolve(_, args, req) {
      return editConnectedAccount(req.remoteUser, args.connectedAccount);
    },
  },
  approveExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return updateExpenseStatus(req.remoteUser, args.id, statuses.APPROVED);
    },
  },
  rejectExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return updateExpenseStatus(req.remoteUser, args.id, statuses.REJECTED);
    },
  },
  payExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      paymentProcessorFeeInCollectiveCurrency: { type: GraphQLInt },
      hostFeeInCollectiveCurrency: { type: GraphQLInt },
      platformFeeInCollectiveCurrency: { type: GraphQLInt },
    },
    resolve(_, args, req) {
      return payExpense(req.remoteUser, args.id, omit(args, ['id']));
    },
  },
  markOrderAsPaid: {
    type: OrderType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return markOrderAsPaid(req.remoteUser, args.id);
    },
  },
  createExpense: {
    type: ExpenseType,
    args: {
      expense: { type: new GraphQLNonNull(ExpenseInputType) },
    },
    resolve(_, args, req) {
      return createExpense(req.remoteUser, args.expense);
    },
  },
  editExpense: {
    type: ExpenseType,
    args: {
      expense: { type: new GraphQLNonNull(ExpenseInputType) },
    },
    resolve(_, args, req) {
      return editExpense(req.remoteUser, args.expense);
    },
  },
  deleteExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return deleteExpense(req.remoteUser, args.id);
    },
  },
  editTier: {
    type: TierType,
    description: 'Update a single tier',
    args: {
      tier: {
        type: new GraphQLNonNull(TierInputType),
        description: 'The tier to update',
      },
    },
    resolve(_, args, req) {
      return editTier(_, args, req);
    },
  },
  editTiers: {
    type: new GraphQLList(TierType),
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      tiers: { type: new GraphQLList(TierInputType) },
    },
    resolve(_, args, req) {
      return editTiers(_, args, req);
    },
  },
  createMember: {
    type: MemberType,
    args: {
      member: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      role: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve(_, args, req) {
      return createMember(_, args, req);
    },
  },
  removeMember: {
    type: MemberType,
    args: {
      member: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      collective: { type: new GraphQLNonNull(CollectiveAttributesInputType) },
      role: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve(_, args, req) {
      return removeMember(_, args, req);
    },
  },
  editMembership: {
    type: MemberType,
    description: 'A mutation to edit membership. Dedicated to the user, not the collective admin.',
    args: {
      id: { type: GraphQLNonNull(GraphQLInt) },
      publicMessage: { type: GraphQLString },
    },
    resolve(_, args, req) {
      return editMembership(_, args, req);
    },
  },
  createOrder: {
    type: OrderType,
    args: {
      order: {
        type: new GraphQLNonNull(OrderInputType),
      },
    },
    resolve(_, args, req) {
      return createOrder(args.order, req.loaders, req.remoteUser, req.ip);
    },
  },
  confirmOrder: {
    type: OrderType,
    args: {
      order: {
        type: new GraphQLNonNull(ConfirmOrderInputType),
      },
    },
    resolve(_, args, req) {
      return confirmOrder(args.order, req.remoteUser);
    },
  },
  addFundsToCollective: {
    type: OrderType,
    args: {
      order: {
        type: new GraphQLNonNull(OrderInputType),
      },
    },
    resolve(_, args, req) {
      return addFundsToCollective(args.order, req.remoteUser);
    },
  },
  updateOrder: {
    // TODO: Should be renamed to completePledge.
    type: OrderType,
    args: {
      order: {
        type: new GraphQLNonNull(OrderInputType),
      },
    },
    resolve(_, args, req) {
      return completePledge(req.remoteUser, args.order);
    },
  },
  createUpdate: {
    type: UpdateType,
    args: {
      update: {
        type: new GraphQLNonNull(UpdateInputType),
      },
    },
    resolve(_, args, req) {
      return updateMutations.createUpdate(_, args, req);
    },
  },
  editUpdate: {
    type: UpdateType,
    args: {
      update: {
        type: new GraphQLNonNull(UpdateAttributesInputType),
      },
    },
    resolve(_, args, req) {
      return updateMutations.editUpdate(_, args, req);
    },
  },
  publishUpdate: {
    type: UpdateType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve(_, args, req) {
      return updateMutations.publishUpdate(_, args, req);
    },
  },
  unpublishUpdate: {
    type: UpdateType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve(_, args, req) {
      return updateMutations.unpublishUpdate(_, args, req);
    },
  },
  deleteUpdate: {
    type: UpdateType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve(_, args, req) {
      return updateMutations.deleteUpdate(_, args, req);
    },
  },
  createComment: {
    type: CommentType,
    args: {
      comment: {
        type: new GraphQLNonNull(CommentInputType),
      },
    },
    resolve(_, args, req) {
      return commentMutations.createComment(_, args, req);
    },
  },
  editComment: {
    type: CommentType,
    args: {
      comment: {
        type: new GraphQLNonNull(CommentAttributesInputType),
      },
    },
    resolve(_, args, req) {
      return commentMutations.editComment(_, args, req);
    },
  },
  deleteComment: {
    type: CommentType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve(_, args, req) {
      return commentMutations.deleteComment(_, args, req);
    },
  },
  cancelSubscription: {
    type: OrderType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return cancelSubscription(req.remoteUser, args.id);
    },
  },
  updateSubscription: {
    type: OrderType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      paymentMethod: { type: PaymentMethodInputType },
      amount: { type: GraphQLInt },
    },
    async resolve(_, args, req) {
      return await updateSubscription(req.remoteUser, args);
    },
  },
  refundTransaction: {
    type: TransactionInterfaceType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    async resolve(_, args, req) {
      return await refundTransaction(_, args, req);
    },
  },
  addFundsToOrg: {
    type: PaymentMethodType,
    args: {
      totalAmount: { type: new GraphQLNonNull(GraphQLInt) },
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      HostCollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      description: { type: GraphQLString },
    },
    resolve: async (_, args, req) => addFundsToOrg(args, req.remoteUser),
  },
  createApplication: {
    type: ApplicationType,
    args: {
      application: {
        type: new GraphQLNonNull(ApplicationInputType),
      },
    },
    resolve(_, args, req) {
      return applicationMutations.createApplication(_, args, req);
    },
  },
  deleteApplication: {
    type: ApplicationType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve(_, args, req) {
      return applicationMutations.deleteApplication(_, args, req);
    },
  },
  createPaymentMethod: {
    type: PaymentMethodType,
    deprecationReason: 'Please use createVirtualCards',
    args: {
      type: { type: new GraphQLNonNull(GraphQLString) },
      currency: { type: new GraphQLNonNull(GraphQLString) },
      amount: { type: GraphQLInt },
      monthlyLimitPerMember: { type: GraphQLInt },
      limitedToTags: {
        type: new GraphQLList(GraphQLString),
        description: 'Limit this payment method to make donations to collectives having those tags',
      },
      limitedToCollectiveIds: {
        type: new GraphQLList(GraphQLInt),
        description: 'Limit this payment method to make donations to those collectives',
      },
      limitedToHostCollectiveIds: {
        type: new GraphQLList(GraphQLInt),
        description: 'Limit this payment method to make donations to the collectives hosted by those hosts',
      },
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      PaymentMethodId: { type: GraphQLInt },
      description: { type: GraphQLString },
      expiryDate: { type: GraphQLString },
      data: { type: PaymentMethodDataVirtualCardInputType, description: 'The data attached to this PaymentMethod' },
    },
    resolve: async (_, args, req) => {
      return paymentMethodsMutation.createPaymentMethod(args, req.remoteUser);
    },
  },
  updatePaymentMethod: {
    type: PaymentMethodType,
    description: 'Update a payment method',
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      name: { type: GraphQLString },
      monthlyLimitPerMember: { type: GraphQLInt },
    },
    resolve: async (_, args, req) => {
      return paymentMethodsMutation.updatePaymentMethod(args, req.remoteUser);
    },
  },
  createCreditCard: {
    type: PaymentMethodType,
    description: 'Add a new credit card to the given collective',
    args: {
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      token: { type: new GraphQLNonNull(GraphQLString) },
      data: { type: new GraphQLNonNull(StripeCreditCardDataInputType) },
      monthlyLimitPerMember: { type: GraphQLInt },
    },
    resolve: async (_, args, req) => {
      return paymentMethodsMutation.createPaymentMethod(
        { ...args, service: 'stripe', type: 'creditcard' },
        req.remoteUser,
      );
    },
  },
  createVirtualCards: {
    type: new GraphQLList(PaymentMethodType),
    args: {
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      PaymentMethodId: { type: GraphQLInt },
      emails: {
        type: new GraphQLList(GraphQLString),
        description: 'A list of emails to generate virtual cards for (only if numberOfVirtualCards is not provided)',
      },
      numberOfVirtualCards: {
        type: GraphQLInt,
        description: 'Number of virtual cards to generate (only if emails is not provided)',
      },
      currency: {
        type: GraphQLString,
        description: 'An optional currency. If not provided, will use the collective currency.',
      },
      amount: {
        type: GraphQLInt,
        description: 'The amount as an Integer with cents.',
      },
      monthlyLimitPerMember: { type: GraphQLInt },
      limitedToTags: {
        type: new GraphQLList(GraphQLString),
        description: 'Limit this payment method to make donations to collectives having those tags',
      },
      limitedToCollectiveIds: {
        type: new GraphQLList(GraphQLInt),
        description: 'Limit this payment method to make donations to those collectives',
      },
      limitedToHostCollectiveIds: {
        type: new GraphQLList(GraphQLInt),
        description: 'Limit this payment method to make donations to the collectives hosted by those hosts',
      },
      limitedToOpenSourceCollectives: {
        type: GraphQLBoolean,
        description: 'Set `limitedToHostCollectiveIds` to open-source collectives only',
      },
      description: {
        type: GraphQLString,
        description: 'A custom message attached to the email that will be sent for this virtual card',
      },
      customMessage: {
        type: GraphQLString,
        description: 'A custom message that will be sent in the invitation email',
      },
      expiryDate: { type: GraphQLString },
    },
    resolve: async (_, { emails, numberOfVirtualCards, ...args }, { remoteUser }) => {
      if (numberOfVirtualCards && emails && numberOfVirtualCards !== emails.length) {
        throw Error("numberOfVirtualCards and emails counts doesn't match");
      } else if (args.limitedToOpenSourceCollectives && args.limitedToHostCollectiveIds) {
        throw Error('limitedToOpenSourceCollectives and limitedToHostCollectiveIds cannot be used at the same time');
      }

      if (args.limitedToOpenSourceCollectives) {
        const openSourceHost = await models.Collective.findOne({
          attributes: ['id'],
          where: { slug: 'opensource' },
        });
        if (!openSourceHost) {
          throw new Error(
            'Cannot find the host "Open Source Collective". You can disable the opensource-only limitation, or contact us at info@opencollective.com if this keeps happening',
          );
        }
        args.limitedToHostCollectiveIds = [openSourceHost.id];
      }

      if (numberOfVirtualCards) {
        return await bulkCreateVirtualCards(args, remoteUser, numberOfVirtualCards);
      } else if (emails) {
        return await createVirtualCardsForEmails(args, remoteUser, emails, args.customMessage);
      }

      throw new Error('You must either pass numberOfVirtualCards of an email list');
    },
  },
  claimPaymentMethod: {
    type: PaymentMethodType,
    args: {
      code: { type: new GraphQLNonNull(GraphQLString) },
      user: { type: UserInputType },
    },
    resolve: async (_, args, req) => paymentMethodsMutation.claimPaymentMethod(args, req.remoteUser),
  },
  removePaymentMethod: {
    type: new GraphQLNonNull(PaymentMethodType),
    description: 'Removes the payment method',
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'ID of the payment method to remove',
      },
    },
    resolve: async (_, args, req) => {
      return paymentMethodsMutation.removePaymentMethod(args.id, req.remoteUser);
    },
  },
  editWebhooks: {
    type: new GraphQLList(NotificationType),
    description: 'Edits (by replacing) the admin-level webhooks for a collective.',
    args: {
      collectiveId: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'ID of the collective whose webhooks are edited.',
      },
      notifications: {
        type: new GraphQLList(NotificationInputType),
        description: 'New notifications for the collective.',
      },
    },
    resolve(_, args, req) {
      return editWebhooks(args, req.remoteUser);
    },
  },
  createWebhook: {
    type: NotificationType,
    description: 'Register user-level webhooks for a collective.',
    args: {
      collectiveSlug: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Slug of the collective the webhook is created for.',
      },
      notification: {
        type: NotificationInputType,
        description: 'The notification object.',
      },
    },
    resolve(_, args, req) {
      return createWebhook(args, req.remoteUser);
    },
  },
  deleteNotification: {
    type: NotificationType,
    description: 'Deletes a notification by ID.',
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'ID of the notification to delete.',
      },
    },
    resolve(_, args, req) {
      return deleteNotification(args, req.remoteUser);
    },
  },
  backyourstackDispatchOrder: {
    type: new GraphQLList(OrderType),
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve(_, args) {
      return backyourstackMutations.dispatchOrder(args.id);
    },
  },
};

export default mutations;
