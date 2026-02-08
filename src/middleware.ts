import { withAuth } from "next-auth/middleware"

export default withAuth({
    callbacks: {
        authorized: ({ req, token }) => {
            // Protect /dashboard and /admin routes
            if (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/admin")) {
                return token !== null
            }
            return true
        },
    },
})

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
}
