-- Ban a list of collectives from the platform, including all their associated data
--
-- Variables:
--  • collectiveSlugs: The list of collective slugs to ban
-- 
-- ---------------------------------------------------------------------------------


WITH banned_collectives AS (
  SELECT   id 
  FROM    "Collectives"
  WHERE   slug = ANY($collectiveSlugs)
), deleted_profiles AS (
  -- Delete the actual collectives and their events
  UPDATE ONLY "Collectives" c
  SET         "deletedAt" = NOW(),
              data = (COALESCE(to_jsonb(data), '{}' :: jsonb) || '{"isBanned": true}' :: jsonb)
  FROM        banned_collectives
  WHERE       c."id" = banned_collectives.id
  OR          c."ParentCollectiveId" = banned_collectives.id
  RETURNING   c.id
), deleted_users AS (
  -- Delete the users (with their email preserved, they will be banned permanently)
  -- This block has no effect on collectives/orgs
  UPDATE ONLY "Users" u
  SET         "deletedAt" = NOW(),
              data = (COALESCE(to_jsonb(data), '{}' :: jsonb) || '{"isBanned": true}' :: jsonb)
  FROM        deleted_profiles
  WHERE       u."CollectiveId" = deleted_profiles.id
  RETURNING   u.id
), deleted_tiers AS (
  -- Delete tiers
  UPDATE ONLY "Tiers" t SET "deletedAt" = NOW()
  FROM        deleted_profiles
  WHERE       t."CollectiveId" = deleted_profiles.id 
  RETURNING   t.id
), deleted_members AS (
  -- Delete members and membershipses
  UPDATE ONLY "Members" m SET "deletedAt" = NOW()
  FROM        deleted_profiles
  -- for the   collective
  WHERE       m."MemberCollectiveId" = deleted_profiles.id 
  OR          m."CollectiveId" = deleted_profiles.id
  RETURNING   m.id
), deleted_updates AS (
  -- Delete updates
  UPDATE ONLY "Updates" u SET "deletedAt" = NOW()
  FROM        deleted_profiles
  WHERE       u."CollectiveId" = deleted_profiles.id 
  OR          u."FromCollectiveId" = deleted_profiles.id 
  RETURNING   u.id
), deleted_payment_methods AS (
  -- Delete payment methods
  UPDATE ONLY "PaymentMethods" pm SET "deletedAt" = NOW()
  FROM        deleted_profiles
  WHERE       pm."CollectiveId" = deleted_profiles.id 
  RETURNING   pm.id
), deleted_connected_accounts AS (
  -- Delete connected accounts
  UPDATE ONLY "ConnectedAccounts" ca SET "deletedAt" = NOW()
  FROM        deleted_profiles
  WHERE       ca."CollectiveId" = deleted_profiles.id 
  RETURNING   ca.id
), deleted_conversations AS (
  -- Delete conversations
  UPDATE ONLY "Conversations" conv SET "deletedAt" = NOW()
  FROM        deleted_profiles
  WHERE       conv."FromCollectiveId" = deleted_profiles.id
  OR          conv."CollectiveId" = deleted_profiles.id
  RETURNING   conv.id
), deleted_conversation_followers AS (
  -- Delete conversations followers
  DELETE FROM "ConversationFollowers" f
  USING       deleted_users, deleted_conversations
  WHERE       f."UserId" = deleted_users.id
  OR          f."ConversationId" = deleted_conversations.id
  RETURNING   f.id
), deleted_expenses AS (
  -- Delete expenses
  UPDATE ONLY "Expenses" e SET "deletedAt" = NOW()
  FROM        deleted_users, deleted_profiles
  WHERE       e."UserId" = deleted_users.id
  OR          e."CollectiveId" = deleted_profiles.id
  RETURNING   e.id
), deleted_comments AS (
  -- Delete comments
  UPDATE ONLY "Comments" com SET "deletedAt" = NOW()
  FROM        deleted_profiles, deleted_conversations, deleted_expenses
  WHERE       com."CollectiveId" = deleted_profiles.id 
  OR          com."FromCollectiveId" = deleted_profiles.id
  OR          com."ConversationId" = deleted_conversations.id
  OR          com."ExpenseId" = deleted_expenses.id
  RETURNING   com.id
), deleted_applications AS (
  -- Delete applications
  UPDATE ONLY "Applications" app SET "deletedAt" = NOW()
  FROM        deleted_users
  WHERE       app."CreatedByUserId" = deleted_users.id
  RETURNING   app.id
), deleted_orders AS (
  -- Delete orders
  UPDATE ONLY "Orders" o SET "deletedAt" = NOW()
  FROM        deleted_profiles
  WHERE       (o."FromCollectiveId" = deleted_profiles.id OR o."CollectiveId" = deleted_profiles.id)
  AND         o.status IN ('EXPIRED', 'PENDING', 'ERROR', 'CANCELLED')
  RETURNING   o.id
), deleted_notifications AS (
  -- Delete notifications
  DELETE FROM "Notifications" n
  USING       deleted_users
  WHERE       n."UserId" = deleted_users.id
  RETURNING   n.id
) SELECT 
  (SELECT COUNT(*) FROM deleted_profiles) AS nb_deleted_profiles,
  (SELECT COUNT(*) FROM deleted_users) AS deleted_users,
  (SELECT COUNT(*) FROM deleted_tiers) AS nb_deleted_tiers,
  (SELECT COUNT(*) FROM deleted_members) AS nb_deleted_members,
  (SELECT COUNT(*) FROM deleted_updates) AS nb_deleted_updates,
  (SELECT COUNT(*) FROM deleted_payment_methods) AS nb_deleted_payment_methods,
  (SELECT COUNT(*) FROM deleted_connected_accounts) AS nb_deleted_connected_accounts,
  (SELECT COUNT(*) FROM deleted_conversations) AS nb_deleted_conversations,
  (SELECT COUNT(*) FROM deleted_conversation_followers) AS nb_deleted_conversation_followers,
  (SELECT COUNT(*) FROM deleted_comments) AS nb_deleted_comments,
  (SELECT COUNT(*) FROM deleted_expenses) AS nb_deleted_expenses,
  (SELECT COUNT(*) FROM deleted_applications) AS nb_deleted_applications,
  (SELECT COUNT(*) FROM deleted_orders) AS nb_deleted_orders,
  (SELECT COUNT(*) FROM deleted_notifications) AS nb_deleted_notifications,
  (SELECT COUNT(*) FROM deleted_users) AS nb_deleted_users,
  (SELECT ARRAY_AGG(deleted_profiles.id) FROM deleted_profiles) AS deleted_profiles_ids
  
-- TODO:
-- Delete associated incognito profiles
