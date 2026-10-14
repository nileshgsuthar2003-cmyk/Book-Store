from flask import Flask
from flask_cors import CORS
from config import Config
from database import init_db
from app.routes import register_blueprints

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React frontend (Vite & production)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize MySQL schema
    try:
        init_db()
    except Exception as e:
        print(f"Warning during DB initialization: {e}")

    # Register all modular route blueprints
    register_blueprints(app)

    return app
