
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { BadRequest, Unauthorized } from "./api/errors.js";
import { Request } from "express";

const TOKEN_ISSUER = "chirpy";

export async function hashPassword(password: string): Promise<string> {
  //TODO hash the password using argon2.hash
  const hash = await argon2.hash(password);
  return hash;
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  //TODO use argon2 to verify the password
  if (await argon2.verify(hash, password)) {
    return true;
  } else {
    return false;
  }
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  // use jwt.sign(payload, secret, [options])
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expiresIn;
  const token = jwt.sign(
    {
      iss: TOKEN_ISSUER,
      sub: userID,
      iat: issuedAt,
      exp: expiresAt,
    } satisfies payload,
    secret,
    { algorithm: "HS256" }
  );
  return token;
};

export function validateJWT(tokenString: string, secret: string): string {
  // use jwt.verify(token, secret)
  let decoded: payload;
  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch (error) {
    throw new Unauthorized("Invalid token");
  }
  if (decoded.iss !== TOKEN_ISSUER) {
    throw new Unauthorized("Invalid issuer");
  }
  if (!decoded.sub) {
    throw new Unauthorized("No user ID in token");
  }
  return decoded.sub;
};

export function getBearerToken(req: Request) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new BadRequest("Malformed authorization header");
  }

  return extractBearerToken(authHeader);
}

export function extractBearerToken(header: string) {
  const splitAuth = header.split(" ");
  if (splitAuth.length < 2 || splitAuth[0] !== "Bearer") {
    throw new BadRequest("Malformed authorization header");
  }
  return splitAuth[1];
}
