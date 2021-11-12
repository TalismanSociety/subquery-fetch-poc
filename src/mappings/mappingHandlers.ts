import { SubstrateBlock } from "@subql/types";
import https from "https";
import { ChainManifest } from "../types";

// A period of 1800 blocks at a rate of 6 blocks per second
// 1800 / 6 = 300 seconds = execute once every 5 minutes
const execPeriod = 1800;

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  const blockNumber = block.block.header.number.toNumber();

  // skip any block which isn't a multiple of execPeriod
  if (blockNumber % execPeriod !== 0) return;

  const id = "0";
  const result = await new Promise<string>((resolve, reject) =>
    https
      .get(
        `https://raw.githubusercontent.com/TalismanSociety/chaindata/multi-relay-chain-future/${id}/manifest.json`,
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => resolve(data));
        }
      )
      .on("error", (error) => reject(error))
  );

  const manifest = JSON.parse(result);

  const chainManifest =
    (await ChainManifest.get(id)) || ChainManifest.create({ id });

  chainManifest.name = manifest.name;
  chainManifest.description = manifest.description;
  chainManifest.nativeToken = manifest.nativeToken;
  chainManifest.tokenDecimals = manifest.tokenDecimals;
  chainManifest.isRelay = manifest.isRelay;
  chainManifest.rpcs = manifest.rpcs;

  // save
  await chainManifest.save();
}
