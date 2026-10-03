import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentSession } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const session = await getCurrentSession();
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!session?.isAdmin) throw new Error("Acc\u00e8s administrateur requis");
        return {
          allowedContentTypes: [
            "application/pdf",
            "application/epub+zip",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur d'envoi";
    return Response.json({ error: message }, { status: 400 });
  }
}