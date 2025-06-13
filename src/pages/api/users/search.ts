import type { APIRoute } from "astro";
import { validateSessionToken } from "../../../functions/session.ts";
import { server } from "../../../actions";

export const GET: APIRoute = async (ctx) => {
  // Get the search term from query parameters
  const url = new URL(ctx.request.url);
  const searchTerm = url.searchParams.get('q');

  if (!searchTerm) {
    return new Response('Search term is required', { status: 400 });
  }

  // Check authentication from session cookie
  const token = ctx.cookies.get("session")?.value;
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Validate the session token
  const { user, session } = await validateSessionToken(ctx, token);
  if (!session || !user) {
    return new Response('Unauthorized: Invalid session', { status: 401 });
  }

  try {
    // Use the users.search action to perform the search
    const result = await server.users.search(searchTerm);

    // Return the results as JSON
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error searching users:', error);

    // Check if it's an ActionError with a specific code
    if (error.code === 'UNAUTHORIZED') {
      return new Response('Unauthorized', { status: 401 });
    }

    return new Response('Internal Server Error', { status: 500 });
  }
};
