from flask import Flask
from .db import db,migrate
from .config import Config
from app.model import User, Player, Game, GamePlayer
from flask_bcrypt import Bcrypt 
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import timedelta
from app.routes import user_bp,game_bp,move_bp,house_bp
import os

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

    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-flask-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

    app.register_blueprint(user_bp,url_prefix="/user")
    app.register_blueprint(game_bp,url_prefix="/game")
    app.register_blueprint(move_bp,url_prefix="/game")
    app.register_blueprint(house_bp,url_prefix="/game")
    
    return app
