import { pick } from 'lodash';
import config from 'config';

import { types } from '../constants/collectives';
import roles from '../constants/roles';
import emailLib from '../lib/email';
import models from '.';

export default function(Sequelize, DataTypes) {
  const MemberInvitation = Sequelize.define(
    'MemberInvitation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      CreatedByUserId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      MemberCollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      CollectiveId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Collectives',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        allowNull: false,
      },

      TierId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Tiers',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member',
        validate: {
          isIn: {
            args: [
              [
                roles.HOST,
                roles.ADMIN,
                roles.MEMBER,
                roles.BACKER,
                roles.CONTRIBUTOR,
                roles.ATTENDEE,
                roles.FOLLOWER,
                roles.FUNDRAISER,
              ],
            ],
            msg: 'Must be host, admin, member, backer, contributor, attendee, fundraiser or follower',
          },
        },
      },

      description: {
        type: DataTypes.STRING,
      },

      // Dates.
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
      },
      since: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      paranoid: true,
    },
  );

  // ---- Instance methods ----

  MemberInvitation.prototype.accept = async function() {
    const existingMember = await models.Member.findOne({
      where: {
        MemberCollectiveId: this.MemberCollectiveId,
        CollectiveId: this.CollectiveId,
        TierId: this.TierId,
        role: this.role,
      },
    });

    // Ignore if membership already exists
    if (existingMember) {
      return this.destroy();
    }

    const user = await models.User.findOne({
      where: { CollectiveId: this.MemberCollectiveId },
      include: {
        model: models.Collective,
        as: 'collective',
        attributes: ['id'],
        where: { type: types.USER, isIncognito: false },
      },
    });

    if (!user) {
      throw new Error(`No profile found for this user. Please contact support`);
    }

    const collective = await models.Collective.findByPk(this.CollectiveId);
    if (collective) {
      await collective.addUserWithRole(user, this.role, {
        TierId: this.TierId,
        CreatedByUserId: this.CreatedByUserId,
        description: this.description,
        since: this.since,
      });
    }

    return this.destroy();
  };

  MemberInvitation.prototype.decline = async function() {
    return this.destroy();
  };

  // ---- Static methods ----

  MemberInvitation.invite = async function(collective, memberParams) {
    // Check params
    if (![roles.ADMIN, roles.MEMBER].includes(memberParams.role)) {
      throw new Error('Can only invite users as admins or members');
    }

    // Ensure the user is not already a member or invited as such
    const existingMember = await models.Member.findOne({
      where: {
        CollectiveId: collective.id,
        MemberCollectiveId: memberParams.MemberCollectiveId,
        role: memberParams.role,
      },
    });

    if (existingMember) {
      throw new Error(`This user already have the ${memberParams.role} role on this Collective`);
    }

    // Update the existing invitation if it exists
    const existingInvitation = await models.MemberInvitation.findOne({
      where: {
        CollectiveId: collective.id,
        MemberCollectiveId: memberParams.MemberCollectiveId,
      },
    });

    if (existingInvitation) {
      return existingInvitation.update(pick(memberParams, ['role', 'description', 'since']));
    }

    // Ensure collective has not invited too many people
    const nbInvitationsForCollective = await models.MemberInvitation.count({ where: { CollectiveId: collective.id } });
    if (nbInvitationsForCollective >= config.limits.maxMemberInvitationsPerCollective) {
      throw new Error(
        'You have reached the max number of member invitations for this collective. Please wait for them to be accepted before sending others.',
      );
    }

    // Load users
    const memberUser = await models.User.findOne({
      where: { CollectiveId: memberParams.MemberCollectiveId },
      include: [{ model: models.Collective, as: 'collective' }],
    });

    if (!memberUser) {
      throw new Error('user not found');
    }

    const createdByUser = await models.User.findByPk(memberParams.CreatedByUserId, {
      include: [{ model: models.Collective, as: 'collective' }],
    });

    const invitation = await await MemberInvitation.create({
      ...memberParams,
      CollectiveId: collective.id,
    });

    return emailLib.send('member.invitation', memberUser.email, {
      role: memberParams.role.toLowerCase(),
      invitation: pick(invitation, 'id'),
      collective: pick(collective, ['slug', 'name']),
      memberCollective: pick(memberUser, ['collective.slug', 'collective.name']),
      invitedByUser: pick(createdByUser, ['collective.slug', 'collective.name']),
    });
  };

  MemberInvitation.schema('public');
  return MemberInvitation;
}
