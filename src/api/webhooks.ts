import type { Request, Response } from "express";
import { updateChirpyRed } from "../db/queries/users.js";
import { getAPIKey } from "../auth.js";
import { config } from "../config.js";
import { Unauthorized } from "./errors.js";

export async function handlerWebhook(req: Request, res: Response) {
  type parameters = {
    event: string;
    data: {
      userId: string;
    };
  };

  let apiKey = getAPIKey(req);
  if (apiKey !== config.api.polkaKey) {
    throw new Unauthorized("invalid api key");
  }

  const params: parameters = req.body;

  if (params.event !== "user.upgraded") {
    res.status(204).send();
    return;
  }

  const upgradedUser = await updateChirpyRed(params.data.userId);
  if (!upgradedUser) {
    res.status(404).send();
    return;
  }

  res.status(204).send();
}
