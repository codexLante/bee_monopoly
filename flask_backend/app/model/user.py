from app.db import db
from sqlalchemy_serializer import SerializerMixin

class User(db.Model, SerializerMixin):
    __tablename__ = 'user'
    serialize_rules = ('-games.owner', '-password')
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    auth_provider = db.Column(db.String(50), nullable=True)
    google_id = db.Column(db.String(255), nullable=True)
    github_id = db.Column(db.String(255), nullable=True)

    # One user can own many games
    games = db.relationship('Game', back_populates='owner', lazy=True)
