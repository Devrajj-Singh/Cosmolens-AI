import firebase_admin
from firebase_admin import firestore

from backend.config import FIREBASE_PROJECT_ID


def get_firebase_app():
    try:
        return firebase_admin.get_app()
    except ValueError:
        return firebase_admin.initialize_app(options={"projectId": FIREBASE_PROJECT_ID})


def get_firestore_client():
    app = get_firebase_app()
    return firestore.client(app=app)
