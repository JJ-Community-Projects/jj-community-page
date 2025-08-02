// src/lib/db/newRepos/team/sections/TeamSection.ts
import {eq} from "drizzle-orm";
import {BaseSection} from "../../base/BaseSection";
import type {RepoEnv} from "../../../../db/RepoEnv";
import {teamsTable} from "../../../../db/schema/jj-schema";
import type {Team, TeamInsert, TeamUpdateInput} from "../../../../db/types/team";
import {NotFoundError} from "../../../../db/errors";

/**
 * Section for managing teams
 */
export class TeamSection extends BaseSection<Team, TeamInsert> {
  /** The table this section operates on */
  protected table = teamsTable;

  /**
   * Creates a new TeamSection instance
   * @param env - The Cloudflare environment
   * @param repoEnv - The repository environment
   */
  constructor(env: Env, repoEnv: RepoEnv) {
    super(env, repoEnv);
  }

  /**
   * Finds a team by ID
   * @param id - The team ID
   * @returns The team or undefined if not found
   */
  async findById(id: number): Promise<Team | undefined> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .get();
    } catch (error) {
      this.handleError(`Failed to find team with ID: ${id}`, error);
    }
  }

  /**
   * Finds all teams
   * @returns An array of teams
   */
  async findAll(): Promise<Team[]> {
    try {
      return this.db.select()
        .from(this.table)
        .all();
    } catch (error) {
      this.handleError("Failed to find all teams", error);
    }
  }

  /**
   * Creates a new team
   * @param data - The team data
   * @returns The created team
   */
  async create(data: TeamInsert): Promise<Team> {
    try {
      const result = await this.db.insert(this.table)
        .values(data)
        .returning()
        .get();

      return result;
    } catch (error) {
      this.handleError("Failed to create team", error);
    }
  }

  /**
   * Updates a team
   * @param id - The team ID
   * @param data - The team data to update
   * @returns The updated team
   */
  async update(id: number, data: TeamUpdateInput): Promise<Team> {
    try {
      const result = await this.db.update(this.table)
        .set(data)
        .where(eq(this.table.id, id))
        .returning()
        .get();

      if (!result) {
        throw new NotFoundError(`Team with ID ${id} not found`);
      }

      return result;
    } catch (error) {
      this.handleError(`Failed to update team with ID: ${id}`, error);
    }
  }

  /**
   * Deletes a team
   * @param id - The team ID
   * @returns The deleted team
   */
  async delete(id: number): Promise<Team> {
    try {
      const result = await this.db.delete(this.table)
        .where(eq(this.table.id, id))
        .returning()
        .get();

      if (!result) {
        throw new NotFoundError(`Team with ID ${id} not found`);
      }

      return result;
    } catch (error) {
      this.handleError(`Failed to delete team with ID: ${id}`, error);
    }
  }

  /**
   * Finds a team by slug
   * @param slug - The team slug
   * @returns The team or undefined if not found
   */
  async findBySlug(slug: string): Promise<Team | undefined> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.slug, slug))
        .get();
    } catch (error) {
      this.handleError(`Failed to find team with slug: ${slug}`, error);
    }
  }

  /**
   * Finds teams by owner ID
   * @param ownerId - The owner ID
   * @returns An array of teams
   */
  async findByOwnerId(ownerId: number): Promise<Team[]> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.ownerId, ownerId))
        .all();
    } catch (error) {
      this.handleError(`Failed to find teams for owner: ${ownerId}`, error);
    }
  }

  /**
   * Finds visible teams
   * @returns An array of visible teams
   */
  async findVisible(): Promise<Team[]> {
    try {
      return this.db.select()
        .from(this.table)
        .where(eq(this.table.visible, true))
        .all();
    } catch (error) {
      this.handleError("Failed to find visible teams", error);
    }
  }

  /**
   * Checks if a slug is available
   * @param slug - The slug to check
   * @returns True if the slug is available, false otherwise
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      const team = await this.findBySlug(slug);
      return !team;
    } catch (error) {
      this.handleError(`Failed to check if slug is available: ${slug}`, error);
    }
  }

}
