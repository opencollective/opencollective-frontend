/* Create webapp application. */
INSERT INTO "Applications" ("id","api_key","name","disabled","_access","updatedAt","createdAt") VALUES (DEFAULT,'637526ace0abe5ebc034e744d86d603a','webapp',false,1,'2015-05-03 22:59:39.655 +00:00','2015-05-03 22:59:39.655 +00:00') RETURNING *;
/* Create tipbox application. */
INSERT INTO "Applications" ("id","api_key","name","disabled","_access","updatedAt","createdAt") VALUES (DEFAULT,'984faa9573226017cf631a1089a60d4b','tipbox',false,0,'2015-05-03 23:00:00.000 +00:00','2015-05-03 23:00:00.000 +00:00') RETURNING *;

/* Delete a group.
DELETE FROM "Groups" WHERE id = 1;
*/
