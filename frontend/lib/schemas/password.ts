import { z } from "zod";

// backend/app/Http/Requests/Auth/UpdatePasswordRequest.php のルールと揃える。
// current_password の照合は Laravel（current_password:sanctum）。zod では形式だけ。
export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "現在のパスワードを入力してください"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    password_confirmation: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "パスワードが一致しません",
    path: ["password_confirmation"],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;
