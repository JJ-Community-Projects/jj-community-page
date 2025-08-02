// src/lib/db/newRepos/user/sections/TokenSection.ts
import { and, eq } from "drizzle-orm";
import { BaseSection } from "../../base/BaseSection";
import type { RepoEnv } from "../../../../db/RepoEnv";
import { tokens } from "../../../schema/auth-schema";
import { NotFoundError } from "../../../errors";

/**
 * Type for token entity from database schema
 */
export interface Token {
  userId: number;
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Type for token insert
 */
export interface TokenInsert {
  userId: number;
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Section for token table operations
 */
export class TokenSection extends BaseSection<Token, TokenInsert> {
  /**
   * Creates a new TokenSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a token by its primary key (userId, provider)
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns The token or undefined if not found
   */
  async findById(userId: number, provider: string): Promise<Token | undefined> {
    try {
      return this.db.select()
        .from(tokens)
        .where(and(
          eq(tokens.userId, userId),
          eq(tokens.provider, provider)
        ))
        .get();
    } catch (error) {
      this.handleError(`Failed to find token for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds all tokens
   * @returns An array of tokens
   */
  async findAll(): Promise<Token[]> {
    try {
      return await this.db.select()
        .from(tokens)
        .all();
    } catch (error) {
      this.handleError("Failed to find all tokens", error);
    }
  }

  /**
   * Creates a new token
   * @param data - The data for the new token
   * @returns The created token
   */
  async create(data: TokenInsert): Promise<Token> {
    try {
      const [token] = await this.db.insert(tokens)
        .values(data)
        .returning();
      return token as Token;
    } catch (error) {
      this.handleError("Failed to create token", error);
    }
  }

  /**
   * Updates a token
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @param data - The data to update
   * @returns The updated token
   */
  async update(userId: number, provider: string, data: Partial<TokenInsert>): Promise<Token> {
    try {
      const [token] = await this.db.update(tokens)
        .set(data)
        .where(and(
          eq(tokens.userId, userId),
          eq(tokens.provider, provider)
        ))
        .returning();

      if (!token) {
        throw new NotFoundError(`Token for user: ${userId} and provider: ${provider} not found`);
      }

      return token as Token;
    } catch (error) {
      this.handleError(`Failed to update token for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Deletes a token
   * @param userId - The ID of the user
   * @param provider - The provider name
   */
  async delete(userId: number, provider: string): Promise<void> {
    try {
      const result = await this.db.delete(tokens)
        .where(and(
          eq(tokens.userId, userId),
          eq(tokens.provider, provider)
        ))
        .returning({ userId: tokens.userId });

      if (result.length === 0) {
        throw new NotFoundError(`Token for user: ${userId} and provider: ${provider} not found`);
      }
    } catch (error) {
      this.handleError(`Failed to delete token for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Finds tokens by user ID
   * @param userId - The ID of the user
   * @returns An array of tokens
   */
  async findByUserId(userId: number): Promise<Token[]> {
    try {
      return this.db.select()
        .from(tokens)
        .where(eq(tokens.userId, userId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find tokens for user: ${userId}`, error);
    }
  }

  /**
   * Finds tokens by provider
   * @param provider - The provider name
   * @returns An array of tokens
   */
  async findByProvider(provider: string): Promise<Token[]> {
    try {
      return this.db.select()
        .from(tokens)
        .where(eq(tokens.provider, provider))
        .all();
    } catch (error) {
      this.handleError(`Failed to find tokens for provider: ${provider}`, error);
    }
  }

  /**
   * Finds a token by user ID and provider
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns The token or undefined if not found
   */
  async findByUserIdAndProvider(userId: number, provider: string): Promise<Token | undefined> {
    try {
      return this.findById(userId, provider);
    } catch (error) {
      this.handleError(`Failed to find token for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Updates a token's access token and refresh token
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @param accessToken - The new access token
   * @param refreshToken - The new refresh token
   * @param expiresAt - The new expiration date
   * @returns The updated token
   */
  async updateTokens(
    userId: number,
    provider: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<Token> {
    try {
      return this.update(userId, provider, {
        accessToken,
        refreshToken,
        expiresAt
      });
    } catch (error) {
      this.handleError(`Failed to update tokens for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Checks if a token exists
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns True if the token exists
   */
  async exists(userId: number, provider: string): Promise<boolean> {
    try {
      const token = await this.findById(userId, provider);
      return !!token;
    } catch (error) {
      this.handleError(`Failed to check if token exists for user: ${userId} and provider: ${provider}`, error);
    }
  }

  /**
   * Checks if a token is expired
   * @param userId - The ID of the user
   * @param provider - The provider name
   * @returns True if the token is expired
   */
  async isExpired(userId: number, provider: string): Promise<boolean> {
    try {
      const token = await this.findById(userId, provider);
      if (!token) {
        return true;
      }

      return new Date() > token.expiresAt;
    } catch (error) {
      this.handleError(`Failed to check if token is expired for user: ${userId} and provider: ${provider}`, error);
    }
  }
}
