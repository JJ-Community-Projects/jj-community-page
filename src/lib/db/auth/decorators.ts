import { AuthorizationError } from "../errors";
import type {ScheduleService} from "../services/schedules/ScheduleService.ts";
import type {BaseService} from "../services/BaseService.ts";

type AuthorizationCheck = (userId: number, ...args: any[]) => Promise<boolean>;

export type ServiceAuthorizationCheck<T extends BaseService> = (service: T, userId: number, ...args: any[]) => Promise<boolean>;

/**
 * Creates a method decorator that performs an authorization check before executing the method
 * @param check - The authorization check function
 * @param errorMessage - The error message to throw if authorization fails
 */
export function requiresAuthorization(
  check: AuthorizationCheck,
  errorMessage: string = "You don't have permission to perform this action"
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // Extract userId from the method arguments (assuming it's the last parameter)
      const userId = args[args.length - 1];

      // Perform the authorization check
      const isAuthorized = await check.apply(this, [userId, ...args.slice(0, -1)]);

      if (!isAuthorized) {
        throw new AuthorizationError(errorMessage);
      }

      // Call the original method
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Creates a method decorator that requires the user to be an admin
 * @param errorMessage - The error message to throw if authorization fails
 */
export function requiresAdmin(
  errorMessage: string = "This action requires admin privileges"
) {
  return requiresAuthorization(
    async function(this: any, userId: number) {
      const user = await this.userRepo.findById(userId);
      return user && user.role === 'admin';
    },
    errorMessage
  );
}


/**
 * Creates a method decorator that performs an authorization check using a service instance
 * @param check - The authorization check function that receives the service instance
 * @param errorMessage - The error message to throw if authorization fails
 */
export function requiresService<T extends BaseService>(
  check: ServiceAuthorizationCheck<T>,
  errorMessage: string = "You don't have permission to perform this action"
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // Extract userId from the method arguments (assuming it's the last parameter)
      const userId = args[args.length - 1];

      // Pass the service instance (this), userId, and other arguments to the check function
      const isAuthorized = await check(this as T, userId, ...args.slice(0, -1));

      if (!isAuthorized) {
        throw new AuthorizationError(errorMessage);
      }

      // Call the original method
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
