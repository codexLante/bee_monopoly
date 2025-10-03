from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

db = SQLAlchemy()

game_players = db.Table('game_players',
    db.Column('game_id', db.Integer, db.ForeignKey('game.id'), primary_key=True),
    db.Column('player_id', db.Integer, db.ForeignKey('player.id'), primary_key=True)
)

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
    games = db.relationship('Game', backref='owner', lazy=True)

class Player(db.Model, SerializerMixin):
    __tablename__ = 'player'
    serialize_rules = ('-games.players',)
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False)
    position = db.Column(db.Integer, default=0)
    money = db.Column(db.Integer, default=1500)
    properties = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    games = db.relationship('Game', secondary=game_players, back_populates='players')

class Game(db.Model, SerializerMixin):
    __tablename__ = 'game'
    serialize_rules = ('-owner.games', '-players.games')
    
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.JSON, nullable=False)
    status = db.Column(db.String(20), default='active')
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    players = db.relationship('Player', secondary=game_players, back_populates='games')
