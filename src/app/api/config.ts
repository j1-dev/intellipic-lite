// List of paths that don't require authentication
export const publicPaths = [
  '/api/replicate-webhook/:predictionId*',
  '/api/stripe-webhook',
  '/api/auth',
  '/login',
  '/signup',
];

// Function to check if a path is public
export function isPublicPath(path: string) {
  return publicPaths.some((pattern) => {
    // Convert the pattern to a regex
    const regexPattern = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/:[\w]+/g, '[^/]+') + '$'
    );
    return regexPattern.test(path);
  });
}
