import { z } from "zod";

// backend/app/Http/Requests/Admin/Category/{Store,Update}CategoryRequest.php のルールと揃える。
export const adminCategorySchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(50),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "半角小文字英数字とハイフンのみ使えます"),
});

export type AdminCategoryFormValues = z.infer<typeof adminCategorySchema>;
