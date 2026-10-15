import { getUserByEmail } from "../db/queries/users.js";
import { checkPasswordHash, makeJWT } from "../auth.js";
import { respondWithJSON } from "./json.js";

import type { Request, Response } from "express";
import { BadRequest, Unauthorized } from "./errors.js";
import { UserResponse } from "./users.js";
import { config } from "../config.js";

type LoginRespoonse = UserResponse & {
  token: string;
};

export async function handlerLogin(req: Request, res: Response): Promise<void> {
  type parameters = {
    email: string;
    password: string;
    expiresInSeconds?: number;
  };
  const params: parameters = req.body;
  if (!params.email || !params.password) {
    throw new BadRequest("Missing required fields!");
  }
  const user = await getUserByEmail(params.email);
  if (!user) {
    throw new Unauthorized("Incorrect email or password");
  }

  const isPasswordValid = await checkPasswordHash(params.password, user.hashedPassword);
  if (!isPasswordValid) {
    throw new Unauthorized("Incorrect email or password");
  }

  let duration = config.jwt.defaultDuration;

  if (params.expiresInSeconds && !(params.expiresInSeconds > config.jwt.defaultDuration)) {
    duration = params.expiresInSeconds;
  }

  const jwtToken = makeJWT(user.id, duration, config.jwt.secret);

  respondWithJSON(res, 200, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    token: jwtToken,
  } satisfies LoginRespoonse);
}
