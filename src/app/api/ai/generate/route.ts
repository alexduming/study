import { envConfigs } from "@/config";
import { respData, respErr } from "@/shared/lib/resp";
import { getAIService } from "@/shared/services/ai";
import { consumeCredits, getRemainingCredits } from "@/shared/services/credit";
import { getUserInfo } from "@/shared/services/user";

export async function POST(request: Request) {
  try {
    let { provider, mediaType, model, prompt, options } = await request.json();

    if (!provider || !mediaType || !model || !prompt) {
      throw new Error("invalid params");
    }

    const aiService = await getAIService();

    // check generate type
    if (!aiService.getGenerateTypes().includes(mediaType)) {
      throw new Error("invalid mediaType");
    }

    // check ai provider
    const aiProvider = aiService.getProvider(provider);
    if (!aiProvider) {
      throw new Error("invalid provider");
    }

    // get current user
    const user = await getUserInfo();
    if (!user) {
      throw new Error("no auth, please sign in");
    }

    // todo: get cost credits from settings
    const costCredits = 1;

    // check credits
    const remainingCredits = await getRemainingCredits(user.id);
    if (remainingCredits < costCredits) {
      throw new Error("insufficient credits");
    }

    const callbackUrl = `${envConfigs.app_url}/api/ai/notify`;

    // generate content
    const result = await aiService.generate({
      mediaType,
      provider: provider,
      model,
      prompt,
      callbackUrl,
      options,
    });

    // if (!result?.taskId) {
    //   throw new Error(
    //     `ai generate failed, type: ${type}, provider: ${provider}, model: ${model}`
    //   );
    // }

    // consume credits
    await consumeCredits({
      userId: user.id,
      credits: costCredits,
      scene: `ai-${mediaType}-generator`,
      description: `generate ${mediaType}`,
    });

    return respData(result);
  } catch (e: any) {
    return respErr(e.message);
  }
}
