import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  if (!request.cookies.get("user")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/home";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
