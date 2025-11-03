import nextAuthMiddleware from "next-auth/middleware";

const proxy = nextAuthMiddleware;

export default proxy;

export const config = {
  matcher: ["/dashboard/:path*", "/api/expenses/:path*"],
};

