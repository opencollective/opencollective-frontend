import config from 'config';
import { pick } from 'lodash';

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
  sendMessageToCollective,
  rejectCollective,
  activateCollectiveAsHost,
  deactivateCollectiveAsHost,
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
  markPendingOrderAsExpired,
} from './mutations/orders';

import { editPublicMessage } from './mutations/members';
import { editTiers, editTier } from './mutations/tiers';
import { editConnectedAccount } from './mutations/connectedAccounts';
import { createWebhook, deleteNotification, editWebhooks } from './mutations/notifications';
import {
  createExpense,
  editExpense,
  updateExpenseStatus,
  payExpense,
  deleteExpense,
  markExpenseAsUnpaid,
} from './mutations/expenses';
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
  MemberInputType,
} from './inputTypes';
import { createVirtualCardsForEmails, bulkCreateVirtualCards } from '../../paymentProviders/opencollective/virtualcard';
import models, { sequelize } from '../../models';
import emailLib from '../../lib/email';
import logger from '../../lib/logger';
import roles from '../../constants/roles';
import errors from '../../lib/errors';
import { Unauthorized, ValidationFailed, Forbidden } from '../errors';

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
  rejectCollective: {
    type: CollectiveInterfaceType,
    description: 'Reject a collective',
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      rejectionReason: { type: GraphQLString },
    },
    resolve(_, args, req) {
      return rejectCollective(_, args, req);
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
  sendMessageToCollective: {
    type: new GraphQLObjectType({
      name: 'SendMessageToCollectiveResult',
      fields: {
        success: { type: GraphQLBoolean },
      },
    }),
    args: {
      collectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      message: { type: new GraphQLNonNull(GraphQLString) },
      subject: { type: GraphQLString },
    },
    resolve(_, args, req) {
      return sendMessageToCollective(_, args, req);
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
      throwIfExists: {
        type: GraphQLBoolean,
        description: 'If set to false, will act like just like a Sign In and returns the user',
        defaultValue: true,
      },
      sendSignInLink: {
        type: GraphQLBoolean,
        description: 'If true, a signIn link will be sent to the user',
        defaultValue: true,
      },
    },
    resolve(_, args, req) {
      return sequelize.transaction(async transaction => {
        let user = await models.User.findOne({ where: { email: args.user.email.toLowerCase() } }, { transaction });
        let organization = null;

        if (args.throwIfExists && user) {
          throw new Error('User already exists for given email');
        } else if (!user) {
          const creationRequest = {
            ip: req.ip,
            userAgent: req.header('user-agent'),
          };
          // Create user
          user = await models.User.createUserWithCollective(args.user, transaction);
          user = await user.update({ data: { creationRequest } }, { transaction });
        }

        // Create organization
        if (args.organization) {
          const organizationParams = {
            type: 'ORGANIZATION',
            ...pick(args.organization, ['name', 'website', 'twitterHandle', 'githubHandle']),
          };
          organization = await models.Collective.create(organizationParams, { transaction });
          await organization.addUserWithRole(user, roles.ADMIN, { CreatedByUserId: user.id }, {}, transaction);
        }

        // Sent signIn link
        if (args.sendSignInLink) {
          const loginLink = user.generateLoginLink(args.redirect, args.websiteUrl);
          if (config.env === 'development') {
            logger.info(`Login Link: ${loginLink}`);
          }
          emailLib.send('user.new.token', user.email, { loginLink }, { sendEvenIfNotProduction: true });
        }

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
  unapproveExpense: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return updateExpenseStatus(req.remoteUser, args.id, statuses.PENDING);
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
      forceManual: {
        type: GraphQLBoolean,
        description: 'Force expense with paypal method to be paid manually',
      },
    },
    resolve(_, args, req) {
      return payExpense(req.remoteUser, args);
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
  markPendingOrderAsExpired: {
    type: OrderType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
    },
    resolve(_, args, req) {
      return markPendingOrderAsExpired(req.remoteUser, args.id);
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
  markExpenseAsUnpaid: {
    type: ExpenseType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      processorFeeRefunded: { type: new GraphQLNonNull(GraphQLBoolean) },
    },
    resolve(_, args, req) {
      return markExpenseAsUnpaid(req.remoteUser, args.id, args.processorFeeRefunded);
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
  editCoreContributors: {
    type: CollectiveInterfaceType,
    description: 'Updates all the core contributors (role = ADMIN or MEMBER) for this collective.',
    args: {
      collectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      members: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberInputType))) },
    },
    async resolve(_, args, req) {
      const collective = await models.Collective.findByPk(args.collectiveId);
      if (!collective) {
        throw new errors.NotFound();
      } else if (!req.remoteUser || !req.remoteUser.isAdmin(collective.id)) {
        throw new errors.Unauthorized();
      } else {
        await collective.editMembers(args.members, {
          CreatedByUserId: req.remoteUser.id,
          remoteUserCollectiveId: req.remoteUser.CollectiveId,
        });
        return collective;
      }
    },
  },
  editPublicMessage: {
    type: new GraphQLList(MemberType),
    description: 'A mutation to edit the public message of all matching members.',
    args: {
      FromCollectiveId: { type: GraphQLNonNull(GraphQLInt) },
      CollectiveId: { type: GraphQLNonNull(GraphQLInt) },
      message: { type: GraphQLString },
    },
    resolve: editPublicMessage,
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
    resolve: commentMutations.createComment,
  },
  editComment: {
    type: CommentType,
    args: {
      comment: {
        type: new GraphQLNonNull(CommentAttributesInputType),
      },
    },
    resolve: commentMutations.editComment,
  },
  deleteComment: {
    type: CommentType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve: commentMutations.deleteComment,
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
  replaceCreditCard: {
    type: PaymentMethodType,
    description: 'Replace a payment method',
    args: {
      id: { type: new GraphQLNonNull(GraphQLInt) },
      CollectiveId: { type: new GraphQLNonNull(GraphQLInt) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      token: { type: new GraphQLNonNull(GraphQLString) },
      data: { type: new GraphQLNonNull(StripeCreditCardDataInputType) },
    },
    resolve: async (_, args, req) => {
      return paymentMethodsMutation.replaceCreditCard(args, req.remoteUser);
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
      batch: {
        type: GraphQLString,
        description: 'Batch name for the created gift cards.',
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
  replyToMemberInvitation: {
    type: GraphQLBoolean,
    description: 'Endpoint to accept or reject an invitation to become a member',
    args: {
      invitationId: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The ID of the invitation to accept or decline',
      },
      accept: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: 'Wether this invitation should be accepted or declined',
      },
    },
    async resolve(_, args, req) {
      if (!req.remoteUser) {
        throw new Unauthorized();
      }

      const invitation = await models.MemberInvitation.findByPk(args.invitationId);
      if (!invitation) {
        return new ValidationFailed({
          message: "This invitation doesn't exist or a reply has already been given to it",
        });
      } else if (!req.remoteUser.isAdmin(invitation.MemberCollectiveId)) {
        return new Forbidden({
          message: 'Only admin of the invited collective can reply to the invitation',
        });
      }

      if (args.accept) {
        await invitation.accept();
      } else {
        await invitation.decline();
      }

      return args.accept;
    },
  },
  backyourstackDispatchOrder: {
    type: new GraphQLObjectType({
      name: 'BackYourStackDispatchState',
      fields: {
        dispatching: { type: GraphQLBoolean },
      },
    }),
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
      },
    },
    resolve(_, args) {
      return backyourstackMutations.dispatchOrder(args.id);
    },
  },
  activateCollectiveAsHost: {
    type: CollectiveInterfaceType,
    description: 'Activate a collective as Host.',
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'ID of the collective (Organization or User)',
      },
    },
    resolve(_, args, req) {
      return activateCollectiveAsHost(_, args, req);
    },
  },
  deactivateCollectiveAsHost: {
    type: CollectiveInterfaceType,
    description: 'Deactivate a collective as Host.',
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'ID of the collective (Organization or User)',
      },
    },
    resolve(_, args, req) {
      return deactivateCollectiveAsHost(_, args, req);
    },
  },
};

export default mutations;
