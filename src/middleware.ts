import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/api/webhook", "/api/uploadthing", "/", "/search(.*)", "/courses(.*)," , "/testseries(.*)"]
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)",  "/(api|trpc)(.*)"],
};
