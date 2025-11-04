import nextAuthMiddleware from "next-auth/middleware";

const proxy = nextAuthMiddleware;

export default proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/api/expenses/:path*",
    "/api/users/:path*",
  ],
};

