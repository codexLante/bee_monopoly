from flask import Flask
from .db import db,migrate
from .config import Config
from app.model import User, Player, Game, GamePlayer
from flask_bcrypt import Bcrypt 
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.routes import user_bp

jwt = JWTManager()
cors = CORS()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize the database
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)
    bcrypt.init_app(app)

    app.register_blueprint(user_bp)
    # Register other blueprints here
    
    return app
