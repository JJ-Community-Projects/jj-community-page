import {oc} from '@orpc/contract'
import {z} from 'zod';
import {SocialImportResultSchema, SocialProviderSchema} from "../../schemas/social.ts";
import {socialUrlRegex} from "../../../../functions/socialUrlRegex.ts";
import {SocialSchema} from "../../schemas/users.ts";

// Add social contract
 const addSocialContract = oc
  .input(z.object({
    provider: SocialProviderSchema,
    url: z.string().url()
  }).refine((data) => {
    const regexes = socialUrlRegex();
    return regexes[data.provider]?.test(data.url);
  }, "Invalid URL format for the specified provider"))
  .output(SocialSchema);

// Remove social contract
 const removeSocialContract = oc
  .input(z.object({
    provider: SocialProviderSchema
  }))
  .output(SocialSchema);

/**
 * Get all social media links for the authenticated user
 * Uses authMiddleware to access user ID from context
 */
 const getSocialContract = oc
  .output(SocialSchema.array())


// Import from Tiltify contract
 const importFromTiltifyContract = oc
  .input(z.void()) // No input required, uses authenticated user context
  .output(SocialImportResultSchema.array());


// Platforms contract combining all platform operations
export const platformsContract = {
  addSocialContract,
  removeSocialContract,
  getSocialContract,
  importFromTiltifyContract,
}
