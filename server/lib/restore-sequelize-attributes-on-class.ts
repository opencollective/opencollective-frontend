import { Model } from 'sequelize';

/**
 * Because of https://github.com/sequelize/sequelize/issues/10579, the classes transpiled
 * by Babel are resetting the sequelize properties getters & setters. This helper fixes these properties
 * by re-defining them. Based on https://github.com/RobinBuschmann/sequelize-typescript/issues/612#issuecomment-491890977.
 *
 * Must be called from the constructor.
 */
export default function restoreSequelizeAttributesOnClass(newTarget, self: Model): void {
  Object.keys(newTarget.rawAttributes).forEach((propertyKey: keyof Model) => {
    Object.defineProperty(self, propertyKey, {
      get() {
        return self.getDataValue(propertyKey);
      },
      set(value) {
        self.setDataValue(propertyKey, value);
      },
    });
  });
}
