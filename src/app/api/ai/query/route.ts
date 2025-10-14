import { respData, respErr } from "@/shared/lib/resp";
import { getAIService } from "@/shared/services/ai";

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json();
    if (!taskId) {
      return respErr("invalid params");
    }

    const provider = "kie";

    const aiService = await getAIService();

    const result = await aiService.query({
      provider,
      taskId,
    });

    return respData(result);
  } catch (e: any) {
    console.log("query failed");
    return respErr(e.message);
  }
}
