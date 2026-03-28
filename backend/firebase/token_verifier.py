from firebase_admin import auth

from backend.firebase.client import get_firebase_app


def verify_id_token(id_token: str) -> dict:
    get_firebase_app()
    return auth.verify_id_token(id_token)
