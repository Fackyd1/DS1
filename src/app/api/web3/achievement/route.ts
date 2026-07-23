import { encodeFunctionData } from "viem";
import { readSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/http";
import { getOrCreatePlayer } from "@/services/game-service";

const ABI = [
  {
    type: "function",
    name: "mintAchievement",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenUri", type: "string" },
      { name: "achievementId", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return fail("Unauthorized", 401);
  }

  const body = (await request.json()) as {
    walletAddress?: string;
    tokenUri?: string;
  };

  if (!body.walletAddress || !body.tokenUri) {
    return fail("walletAddress and tokenUri are required", 400);
  }

  const player = getOrCreatePlayer(session.playerTag, session.userId);
  if (!player.achievements.includes("REALM_COMPLETED")) {
    return fail("Complete the realm before minting this achievement.", 403);
  }

  const data = encodeFunctionData({
    abi: ABI,
    functionName: "mintAchievement",
    args: [body.walletAddress as `0x${string}`, body.tokenUri, "REALM_BUILDER"],
  });

  return ok({
    contractAddress: process.env.CONTRACT_ADDRESS || "",
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "11155111",
    data,
    message: "Transaction payload generated. Sign and send from connected wallet.",
  });
}
