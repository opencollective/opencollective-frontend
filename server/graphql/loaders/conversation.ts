import models, { sequelize } from '../../models';
import DataLoader from 'dataloader';

export default {
  followers: (): DataLoader<number, object> =>
    new DataLoader(async conversationIds => {
      const subscribedCollectives = await sequelize.query(
        `
        SELECT      c.*, f."ConversationId" AS __conversation_id__
        FROM        "Collectives" c
        INNER JOIN  "Users" u ON u."CollectiveId" = c.id
        INNER JOIN  "ConversationFollowers" f ON f."UserId" = u.id
        WHERE       f."ConversationId" in (:conversationIds)
        AND         f."isActive" = TRUE
        GROUP BY    f."ConversationId", c.id
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          model: models.Collective,
          mapToModel: true,
          replacements: { conversationIds },
        },
      );

      if (subscribedCollectives.length === 0) {
        return conversationIds.map(() => []);
      }

      const groupedCollectives = subscribedCollectives.reduce((result, collective) => {
        const conversationId = collective.dataValues.__conversation_id__;
        result[conversationId] = result[conversationId] || [];
        result[conversationId].push(collective);
        return result;
      }, {});

      return conversationIds.map(conversationId => {
        return groupedCollectives[conversationId] || [];
      });
    }),
  commentsCount: (): DataLoader<number, number> =>
    new DataLoader(async (conversationsIds: number[]) => {
      const counts: Array<{ ConversationId: number; count: number }> = await sequelize.query(
        `
        SELECT "ConversationId", COUNT(id) as count
        FROM "Comments"
        WHERE "ConversationId" IN (:conversationsIds)
        AND "deletedAt" IS NULL
        GROUP BY "ConversationId"
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          mapToModel: false,
          replacements: { conversationsIds },
        },
      );

      const groupedCounts: { [ConversationId: number]: number } = {};
      counts.forEach(item => (groupedCounts[item.ConversationId] = item.count));
      return conversationsIds.map(id => {
        if (groupedCounts[id]) {
          // -1 because we don't count the root comment
          return groupedCounts[id] - 1;
        } else {
          return 0;
        }
      });
    }),
};
