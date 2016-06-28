module.exports = function(app) {

  const models = app.set('models');
  const sequelize = models.sequelize;

  /*
  * Hacky way to do currency conversion on Leaderboard
  */
  const generateFXConversionSQL = (aggregate) => {
    var currencyColumn = "currency";
    var amountColumn = "amount";
    
    if(aggregate) {
      currencyColumn = 'MAX(g.currency)';
      amountColumn = 'SUM("amount")';
    }

    // FXRate as of 6/27/2016
    const fxConversion = [
      ['USD', 1.0],
      ['EUR', 0.90],
      ['GBP', 0.73],
      ['MXN', 18.92],
      ['SEK', 8.48],
      ['AUD', 1.34],
      ['INR', 67.89],
      ['CAD', 1.3]
    ];

    var sql = 'CASE ';
    sql += fxConversion.map(currency => `WHEN ${currencyColumn} = '${currency[0]}' THEN ${amountColumn} / ${currency[1]}`).join('\n');
    sql += 'ELSE 0 END';

    return sql;
  };

  const getTotalDonations = () => {
    return sequelize.query(`
      SELECT SUM(${generateFXConversionSQL()}) AS "totalDonationsInUSD"
      FROM "Transactions" 
      WHERE amount > 0 AND "PaymentMethodId" IS NOT NULL
    `, {
      type: sequelize.QueryTypes.SELECT
    })
    .then(res => Math.round(res[0].totalDonationsInUSD));
  };

  /**
   * Returns all the users of a group with their `totalDonations` and `role` (HOST/MEMBER/BACKER)
   */
  const getUsersFromGroupWithTotalDonations = (GroupId) => {
    return sequelize.query(`
      WITH total_donations AS (
        SELECT
          max("UserId") as "UserId",
          SUM(amount/100) as amount
        FROM "Donations" d
        WHERE d."GroupId" = :GroupId AND d.amount >= 0
        GROUP BY "UserId"
      )
      SELECT
        ug."UserId" as id,
        ug."createdAt" as "createdAt",
        u.name as name,
        ug.role as role,
        u.avatar as avatar,
        u.website as website,
        u."twitterHandle" as "twitterHandle",
        td.amount as "totalDonations"
      FROM "UserGroups" ug
      LEFT JOIN "Users" u ON u.id = ug."UserId"
      LEFT JOIN total_donations td ON td."UserId" = ug."UserId"
      WHERE ug."GroupId" = :GroupId
      AND ug."deletedAt" IS NULL
      ORDER BY "totalDonations" DESC, ug."createdAt" ASC
    `, {
      replacements: { GroupId },
      type: sequelize.QueryTypes.SELECT
    });
  };

const getLeaderboard = () => {
  return sequelize.query(`
      SELECT
        MAX(g.name) as name,
        COUNT(t.id) as "donationsCount",
        SUM(amount) as "totalAmount",
        MAX(g.currency) as currency,
        to_char(MAX(t."createdAt"), 'Month DD') as "latestDonation",
        MAX(g.slug) as slug,
        MAX(g.logo) as logo,
        ${generateFXConversionSQL(true)} AS "amountInUSD"
      FROM "Transactions" t
      LEFT JOIN "Groups" g ON g.id = t."GroupId"
      WHERE t."createdAt" > current_date - INTERVAL '30' day
        AND t.amount > 0
        AND t."UserId"
        NOT IN (10,39,40,43,45,46)
      GROUP BY t."GroupId"
      ORDER BY "amountInUSD" DESC`,
    {
      type: sequelize.QueryTypes.SELECT
    });
  };

  const getTotalDonors = () => {
    return sequelize.query(`
      SELECT COUNT(DISTINCT("UserId")) as "totalDonors" FROM "Transactions" WHERE "PaymentMethodId" IS NOT NULL AND amount > 0
    `, {
      type: sequelize.QueryTypes.SELECT
    })
    .then(res => res[0].totalDonors);
  };

  /**
   * get total number of active collectives 
   * (a collective is considered as active if it has ever received any funding from its host or through a donation)
   */
  const getTotalCollectives = () => {
    return sequelize.query(`
      SELECT COUNT(DISTINCT("GroupId")) as "totalCollectives" FROM "Transactions" WHERE amount > 0
    `, {
      type: sequelize.QueryTypes.SELECT
    })
    .then(res => res[0].totalCollectives);
  };
  

  return {
    getTotalDonors,
    getTotalDonations,
    getTotalCollectives,
    getUsersFromGroupWithTotalDonations,
    getLeaderboard
  };

};