import { NextResponse } from "next/server";
import { hasCookies } from './services/cookies';

export default async function middleware(request) {
  const LoginURL = new URL("/sign", request.url);
  const LoggedURL = new URL("/logged/home", request.url);

  if(hasCookies("token")){
    if(request.nextUrl.pathname === "/sign" || request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/logged"){
      return NextResponse.redirect(LoggedURL);
    }
    return NextResponse.next();
  }

  if(request.nextUrl.pathname !== "/sign"){
    return NextResponse.redirect(LoginURL);
  }
}

export const config = {
  matcher: ['/', '/sign', '/logged/:path*']
};
