import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSelf } from "./requests/user";

export async function middleware(request: NextRequest) {
  try {
    const userReponse = await getSelf();
    if (userReponse.ok) return NextResponse.next();
  } catch (error) {
    console.error(error);
  }
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  // Add your pages where you need to be logged in.
  matcher: ["/create-post", "/create-game", "/inbox", "/theme-voting"],
};
