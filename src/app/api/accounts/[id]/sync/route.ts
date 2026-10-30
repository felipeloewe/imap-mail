import { syncAccount } from "@/services/imap/sync";
import { handleRouteError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await syncAccount(id);
    return jsonOk({ accountId: id, ...result });
  } catch (err) {
    return handleRouteError(err);
  }
}
