import { getUserByEmail } from "../db/queries/users.js";
import { checkPasswordHash, getBearerToken, makeJWT, makeRefreshToken } from "../auth.js";
import { respondWithJSON } from "./json.js";

import type { Request, Response } from "express";
import { BadRequest, Unauthorized } from "./errors.js";
import { UserResponse } from "./users.js";
import { config } from "../config.js";
import { revokeRefreshToken, saveRefreshToken, userForRefreshToken } from "../db/queries/refresh.js";

type LoginRespoonse = UserResponse & {
  token: string;
  refreshToken: string;
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

  const accessToken = makeJWT(
    user.id,
    config.jwt.defaultDuration,
    config.jwt.secret,
  );
  const refreshToken = makeRefreshToken();

  const saved = await saveRefreshToken(user.id, refreshToken);
  if (!saved) {
    throw new Unauthorized("could not save refresh token");
  }
  // let duration = config.jwt.defaultDuration;
  // if (params.expiresInSeconds && !(params.expiresInSeconds > config.jwt.defaultDuration)) {
  //   duration = params.expiresInSeconds;
  // }
  // const jwtToken = makeJWT(user.id, duration, config.jwt.secret);
  respondWithJSON(res, 200, {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    token: accessToken,
    refreshToken: refreshToken,
    isChirpyRed: user.isChirpyRed,
  } satisfies LoginRespoonse);
}

export async function handlerRefresh(req: Request, res: Response) {
  let refreshToken = getBearerToken(req);

  const result = await userForRefreshToken(refreshToken);
  if (!result) {
    throw new Unauthorized("invalid refresh token");
  }
  const user = result.user;
  const accessToken = makeJWT(
    user.id,
    config.jwt.defaultDuration,
    config.jwt.secret,
  );

  type response = {
    token: string;
  }

  respondWithJSON(res, 200, {
    token: accessToken,
  } satisfies response);
}

export async function handlerRevoke(req: Request, res: Response) {
  const refreshToken = getBearerToken(req);
  await revokeRefreshToken(refreshToken);
  res.status(204).send();
}
