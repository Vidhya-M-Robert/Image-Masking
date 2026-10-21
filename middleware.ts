import { NextResponse, type NextRequest } from "next/server";

const USERNAME = "Grab";
const PASSWORD = "Grab@07";

export function middleware(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const separator = decoded.indexOf(":");
      const user = decoded.slice(0, separator);
      const pass = decoded.slice(separator + 1);

      if (separator !== -1 && user === USERNAME && pass === PASSWORD) {
        return NextResponse.next();
      }
    } catch {
      // Malformed base64, fall through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area", charset="UTF-8"' },
  });
}

export const config = {
  matcher: "/:path*",
};
