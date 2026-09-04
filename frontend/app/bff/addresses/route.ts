// ブラウザ → GET/POST /bff/addresses → Laravel /api/addresses。
// 住所録の CRUD はクライアント（AddressBook）から叩くので BFF 経由。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { createAddress, fetchAddresses } from "@/lib/addresses";
import { getSessionToken } from "@/lib/auth";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await fetchAddresses(token) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const address = await createAddress(token, body);
    return NextResponse.json({ data: address }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
