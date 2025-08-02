// src/lib/db/newRepos/user/sections/UserSection.ts
import {eq} from "drizzle-orm";
import type {RepoEnv} from "../../../../db/RepoEnv";
import {users} from "../../../schema/auth-schema";
import type {User, UserInsert} from "../../../types/user";
import {NotFoundError} from "../../../errors";
import {BaseUserSection} from "../base/BaseUserSection.ts";

/**
 * Section for user table operations
 */
export class UserSection extends BaseUserSection<User, UserInsert> {
  /**
   * Creates a new UserSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a user by their ID
   * @param id - The ID of the user to find
   * @returns The user or undefined if not found
   */
  async findById(id: number): Promise<User | undefined> {
    try {
      return this.db.select()
        .from(users)
        .where(eq(users.id, id))
        .get();
    } catch (error) {
      this.handleError(`Failed to find user by id: ${id}`, error);
    }
  }

  /**
   * Finds all users
   * @returns An array of users
   */
  async findAll(): Promise<User[]> {
    try {
      return await this.db.select()
        .from(users)
        .all();
    } catch (error) {
      this.handleError("Failed to find all users", error);
    }
  }

  /**
   * Creates a new user
   * @param data - The data for the new user
   * @returns The created user
   */
  async create(data: UserInsert): Promise<User> {
    try {
      const [user] = await this.db.insert(users)
        .values(data)
        .returning();
      return user as User;
    } catch (error) {
      this.handleError("Failed to create user", error);
    }
  }

  /**
   * Updates a user
   * @param id - The ID of the user to update
   * @param data - The data to update
   * @returns The updated user
   */
  async update(id: number, data: Partial<UserInsert>): Promise<User> {
    try {
      const [user] = await this.db.update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();

      if (!user) {
        throw new NotFoundError(`User with id ${id} not found`);
      }

      return user as User;
    } catch (error) {
      this.handleError(`Failed to update user with id: ${id}`, error);
    }
  }

  /**
   * Deletes a user
   * @param id - The ID of the user to delete
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (result.length === 0) {
        throw new NotFoundError(`User with id ${id} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete user with id: ${id}`, error);
    }
  }

  /**
   * Finds users by role
   * @param role - The role to search for
   * @returns An array of users with the specified role
   */
  async findByRole(role: "user" | "admin"): Promise<User[]> {
    try {
      return this.db.select()
        .from(users)
        .where(eq(users.role, role))
        .all();
    } catch (error) {
      this.handleError(`Failed to find users by role: ${role}`, error);
    }
  }

  /**
   * Finds users by primary live stream platform
   * @param platform - The platform to search for
   * @returns An array of users with the specified primary live stream platform
   */
  async findByPrimaryLiveStream(platform: string): Promise<User[]> {
    try {
      return this.db.select()
        .from(users)
        .where(eq(users.primaryLiveStream, platform))
        .all();
    } catch (error) {
      this.handleError(`Failed to find users by primary live stream: ${platform}`, error);
    }
  }

  /**
   * Updates a user's role
   * @param userId - The ID of the user to update
   * @param role - The new role
   * @returns The updated user
   */
  async updateRole(userId: number, role: "user" | "admin"): Promise<User> {
    try {
      return this.update(userId, { role });
    } catch (error) {
      this.handleError(`Failed to update role for user: ${userId}`, error);
    }
  }

  /**
   * Updates a user's primary live stream platform
   * @param userId - The ID of the user to update
   * @param platform - The new platform
   * @returns The updated user
   */
  async updatePrimaryLiveStream(userId: number, platform: string): Promise<User> {
    try {
      return this.update(userId, { primaryLiveStream: platform });
    } catch (error) {
      this.handleError(`Failed to update primary live stream for user: ${userId}`, error);
    }
  }

  /**
   * Checks if a user exists
   * @param userId - The ID of the user to check
   * @returns True if the user exists
   */
  async exists(userId: number): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      return !!user;
    } catch (error) {
      this.handleError(`Failed to check if user exists: ${userId}`, error);
    }
  }

  /**
   * Counts the number of users
   * @returns The number of users
   */
  async count(): Promise<number> {
    try {
      const result = await this.db.select({ count: users.id })
        .from(users)
        .all();
      return result.length;
    } catch (error) {
      this.handleError("Failed to count users", error);
    }
  }
}
