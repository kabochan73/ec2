// ブラウザ → POST /bff/admin/products/{id}/images（multipart）→ Laravel /api/admin/products/{id}/images。

import { NextResponse } from "next/server";

import { uploadProductImage } from "@/lib/admin/images";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("image");
  const alt = formData.get("alt");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "画像ファイルを選択してください。" }, { status: 422 });
  }

  try {
    const image = await uploadProductImage(
      token,
      Number(id),
      file,
      typeof alt === "string" && alt ? alt : undefined,
    );
    return NextResponse.json({ data: image }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
