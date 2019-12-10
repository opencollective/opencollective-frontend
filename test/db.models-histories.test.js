import { expect } from 'chai';
import { sequelize } from '../server/models';

const getTableInfo = tableName => {
  return sequelize.query(
    `
    SELECT * FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = ?
    ORDER BY column_name ASC
    `,
    { replacements: [tableName], type: sequelize.QueryTypes.SELECT, raw: true },
  );
};

/** Turns `Collectives` into `CollectiveHistories` */
const getHistoryTableName = tableName => {
  return `${tableName.slice(0, -1)}Histories`;
};

const tablesWithHistory = ['Collectives', 'Comments', 'Expenses', 'Subscriptions', 'Updates'];

describe('Ensure "Histories" tables match their corresponding model', () => {
  tablesWithHistory.map(tableName =>
    describe(`for ${tableName}`, () => {
      const historyTableName = getHistoryTableName(tableName);
      let tableInfo = null;
      let historyTableInfo = null;

      before(async () => {
        tableInfo = await getTableInfo(tableName);
        historyTableInfo = await getTableInfo(historyTableName);
      });

      // Check missing columns from history
      it('No column is missing from history', () => {
        tableInfo.forEach(column => {
          const historyEquivalent = historyTableInfo.find(c => c.column_name === column.column_name);
          const errorMsg = `The column ${column.column_name} is missing from the ${historyTableName} table`;
          expect(historyEquivalent, errorMsg).to.exist;
        });
      });

      // Check unnecessary columns from history
      it('Histories doesnt have additional columns', () => {
        const ignoredColumns = new Set(['archivedAt', 'hid']);
        historyTableInfo.forEach(column => {
          // Histories tables have an additional achivedAt column
          if (ignoredColumns.has(column.column_name)) {
            return false;
          }

          const equivalent = tableInfo.find(c => c.column_name === column.column_name);
          const errorMsg = `The column ${column.column_name} has been removed from ${tableName}, but not from ${historyTableName}`;
          expect(equivalent, errorMsg).to.exist;
        });
      });

      // Check differences in columns settings
      it('Columns have the same settings', () => {
        tableInfo.forEach(column => {
          const historyEquivalent = historyTableInfo.find(c => c.column_name === column.column_name);
          if (historyEquivalent) {
            const diffedFields = new Set([
              'column_default',
              'is_nullable',
              'data_type',
              'character_maximum_length',
              'character_octet_length',
              'numeric_precision',
              'numeric_precision_radix',
              'numeric_scale',
              'datetime_precision',
              'interval_type',
              'interval_precision',
              'character_set_catalog',
              'character_set_schema',
              'character_set_name',
              'maximum_cardinality',
              'is_self_referencing',
              'is_identity',
              'identity_generation',
              'identity_start',
              'identity_increment',
              'identity_maximum',
              'identity_minimum',
              'identity_cycle',
              'is_generated',
              'generation_expression',
              'is_updatable',
            ]);
            const differences = Object.keys(column).filter(k => {
              if (!diffedFields.has(k)) {
                return false;
              } else if (k === 'column_default' && column[k] && column[k].startsWith('nextval')) {
                // Ignore auto-incremented fields
                return false;
              } else if (column.column_name === 'id' && k === 'is_nullable') {
                // ID are nullables in history tables
                return false;
              }

              return column[k] !== historyEquivalent[k];
            });
            const formattedDirrerences = differences.map(d => {
              return `"${d}": ${column[d]} (${tableName}) ≠ ${historyEquivalent[d]} (${historyTableName})`;
            });
            const message = `Mismatch for ${column.column_name} settings:\n  - ${formattedDirrerences.join('\n  - ')}`;
            expect(differences.length, message).to.equal(0);
          }
        });
      });
    }),
  );
});
