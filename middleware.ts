import { NextResponse } from "next/server";

export function middleware(req: any) {
  // placeholder: aggiungerai controllo ruolo
  return NextResponse.next();
}