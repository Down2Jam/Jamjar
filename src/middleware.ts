import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSelf } from "./requests/user";
import { BASE_URL } from "./requests/config";

export async function middleware(request: NextRequest) {
  try {
    const userCookie = request.cookies.get("user")?.value;
    const tokenCookie = request.cookies.get("token")?.value;
    const refreshCookie = request.cookies.get("refreshToken")?.value;

    const userResponse = await fetch(
      `${BASE_URL}/self?username=${userCookie}`,
      {
        headers: {
          authorization: `Bearer ${tokenCookie}`,
          refresh: refreshCookie || "",
        },
      }
    );

    if (userResponse.ok) return NextResponse.next();
  } catch (error) {
    console.error(error);
  }
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  // Add your pages where you need to be logged in.
  matcher: ["/create-post", "/create-game", "/inbox", "/theme-voting"],
};
