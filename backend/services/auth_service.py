from datetime import UTC, datetime, timedelta

import jwt

from backend.config import AUTH_TOKEN_EXPIRE_MINUTES, AUTH_TOKEN_SECRET
from backend.firebase.token_verifier import verify_id_token


def _provider_name(decoded_token: dict) -> str | None:
    firebase_data = decoded_token.get("firebase", {})
    identities = firebase_data.get("identities", {})
    if "email" in identities:
        return "password"
    sign_in_provider = firebase_data.get("sign_in_provider")
    return sign_in_provider if sign_in_provider and sign_in_provider != "custom" else None


def sync_user_from_token(id_token: str) -> dict:
    decoded_token = verify_id_token(id_token)
    provider = _provider_name(decoded_token)

    return {
        "uid": decoded_token["uid"],
        "email": decoded_token.get("email"),
        "display_name": decoded_token.get("name"),
        "provider": provider,
    }


def create_access_token(user: dict) -> tuple[str, int]:
    expires_in = AUTH_TOKEN_EXPIRE_MINUTES * 60
    expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)
    payload = {
        "sub": user["uid"],
        "email": user.get("email"),
        "display_name": user.get("display_name"),
        "provider": user.get("provider"),
        "exp": expires_at,
        "iat": datetime.now(UTC),
    }
    token = jwt.encode(payload, AUTH_TOKEN_SECRET, algorithm="HS256")
    return token, expires_in


def verify_access_token(token: str) -> dict:
    payload = jwt.decode(token, AUTH_TOKEN_SECRET, algorithms=["HS256"])
    return {
        "uid": payload["sub"],
        "email": payload.get("email"),
        "display_name": payload.get("display_name"),
        "provider": payload.get("provider"),
    }


def get_user_from_authorization_header(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise ValueError("Missing Bearer token.")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise ValueError("Missing Bearer token.")

    try:
        return verify_access_token(token)
    except jwt.PyJWTError:
        return sync_user_from_token(token)
