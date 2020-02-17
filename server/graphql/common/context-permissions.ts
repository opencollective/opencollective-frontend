/**
 * Library to store and retrieve permissions in GraphQL's context.
 *
 * This is intended to solve the problem of children's permissions that depends on a parent
 * that may be far away in the hierarchy tree.
 */

import { get, set } from 'lodash';

/**
 * Context permissions types to use with `setContextPermission` and `getContextPermission`
 */
export enum PERMISSION_TYPE {
  SEE_ACCOUNT_LOCATION = 'SEE_ACCOUNT_LOCATION',
}

/**
 * Build a key to get/set a value in permissions.
 *
 * The permission is stored inside the `req` as an object that looks like:
 * {
 *    // Action type as the key
 *    SEE_ACCOUNT_LOCATION: {
 *      // [EntityId (collective id in this case)]: hasAccess
 *      45: true
 *    }
 * }
 */
const buildKey = (permissionType: PERMISSION_TYPE, entityId: string | number): string => {
  return `permissions.${permissionType}.${entityId}`;
};

/**
 * Set a permission on GraphQL context that will define the access for the entire query.

 *
 * @param req GraphQL context (third param of resolvers)
 * @param permissionType Type of the permission, see PERMISSION_TYPE
 * @param entityId The unique identifier for the item to which the permissions apply
 * @param value Whether this is allowed or not
 */
export const setContextPermission = (
  req: object,
  permissionType: PERMISSION_TYPE,
  entityId: string | number,
  value: boolean,
): void => {
  set(req, buildKey(permissionType, entityId), value);
};

/**
 * Retrieve a permission previously set with `setPermission`.
 *
 * @returns `true` if allowed, `false` if not allowed or `undefined` if unsure
 */
export const getContextPermission = (
  req: object,
  permissionType: PERMISSION_TYPE,
  entityId: string | number,
): boolean | undefined => {
  return get(req, buildKey(permissionType, entityId));
};
