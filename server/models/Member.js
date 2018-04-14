import roles from '../constants/roles';
import { days } from '../lib/utils';

export default function(Sequelize, DataTypes) {

  const Member= Sequelize.define('Member', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    CreatedByUserId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    MemberCollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    CollectiveId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Collectives',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      allowNull: false
    },

    TierId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tiers',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member',
      validate: {
        isIn: {
          args: [[roles.HOST, roles.ADMIN, roles.MEMBER, roles.BACKER, roles.CONTRIBUTOR, roles.ATTENDEE, roles.FOLLOWER, roles.FUNDRAISER]],
          msg: 'Must be host, admin, member, backer, contributor, attendee, fundraiser or follower'
        }
      }
    },

    description: DataTypes.STRING,

    // Dates.
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    paranoid: true,
    indexes: [
       {
          fields: ['MemberCollectiveId', 'CollectiveId', 'role'],
          name: 'MemberCollectiveId-CollectiveId-role',
      }
    ],
    getterMethods: {
      // Info.
      info() {
        return {
          role: this.role,
          description: this.description,
          CreatedByUserId: this.CreatedByUserId,
          CollectiveId: this.CollectiveId,
          MemberCollectiveId: this.MemberCollectiveId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
          deletedAt: this.deletedAt
        };
      }
    }
  });

  /**
   * Returns false if member is part of a tier with an interval and last donation is out of interval
   * @param {*} member { tier: { interval }, lastDonation}
   */
  Member.isActive = (member) => {
    if (!member.tier || !member.tier.interval) return true;
    if (!member.lastDonation) return false;
    if (member.tier.interval === 'month' && days(new Date(member.lastDonation)) <= 31) return true;
    if (member.tier.interval === 'year' && days(new Date(member.lastDonation)) <= 365) return true;
    return false;
  }

  return Member
}
