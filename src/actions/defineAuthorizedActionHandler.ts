import {z} from "zod";
import {type ActionAccept, type ActionAPIContext, type ActionHandler, defineAction} from "astro:actions";
import {handleUnauthorized} from "./utils.ts";

/**
 * Creates an action handler that requires authentication.
 * This function wraps the provided handler with an authentication check.
 * If the user is not authenticated, it throws an ActionError with code 'UNAUTHORIZED'.
 *
 * @param options - The options for the action
 * @returns An action client that can be used to call the action
 */
export function defineAuthorizedAction<
  TOutput,
  TAccept extends ActionAccept | undefined = undefined,
  TInputSchema extends z.ZodType | undefined = TAccept extends 'form' ? z.ZodType<FormData> : undefined
>({
  input,
  accept,
  handler,
}: {
  input?: TInputSchema;
  accept?: TAccept;
  handler: ActionHandler<TInputSchema, TOutput>;
}) {
  // Create a wrapped handler that performs authentication check
  // Use a type assertion to ensure the wrapped handler matches the ActionHandler type
  const wrappedHandler = (async (input: TInputSchema extends z.ZodType ? z.infer<TInputSchema> : any, ctx: ActionAPIContext) => {
    // Perform authentication check
    const {user} = handleUnauthorized(ctx);

    // If authentication passes, run the original handler
    return handler(input, ctx);
  }) as ActionHandler<TInputSchema, TOutput>;

  // Return the result of calling defineAction with the wrapped handler
  return defineAction({
    input,
    accept,
    handler: wrappedHandler,
  });
}

// Example usage:
export const exampleAction = defineAuthorizedAction({
  input: z.object({ name: z.string() }),
  handler: async (input, ctx) => {
    // This code will only run if the user is authenticated
    // The user is already available from the handleUnauthorized function
    return {
      success: true,
      data: input.name,
      userId: ctx.locals.user.id
    };
  }
});
