from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

# Initialize the database object
db = SQLAlchemy()
migrate = Migrate()

# This allows multiple players to be in multiple games
# game_players = db.Table('game_players',
#     db.Column('game_id', db.Integer, db.ForeignKey('game.id'), primary_key=True),
#     db.Column('player_id', db.Integer, db.ForeignKey('player.id'), primary_key=True)
# )

class User(db.Model, SerializerMixin):
    """
    User model - represents a registered user who can create and play games
    SerializerMixin automatically converts this model to JSON format
    """
    __tablename__ = 'user'
    # Don't include password or circular references when converting to JSON
    serialize_rules = ('-games.owner', '-password')
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    auth_provider = db.Column(db.String(50), nullable=True)
    google_id = db.Column(db.String(255), nullable=True)
    github_id = db.Column(db.String(255), nullable=True)

    # One user can own many games
    # games = db.relationship('Game', backref='owner', lazy=True)

class Player(db.Model, SerializerMixin):
    """
    Player model - represents a player in a game (can be human or computer)
    Each player has their own money, position, and properties
    """
    __tablename__ = 'player'
    serialize_rules = ('-games.players',)
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False)
    position = db.Column(db.Integer, default=0)  # Position on the board (0-39)
    money = db.Column(db.Integer, default=1500)  # Starting money
    properties = db.Column(db.JSON, default=list)  # List of owned properties
    is_computer = db.Column(db.Boolean, default=False)  # True if this is an AI player
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Many-to-many: one player can be in multiple games
    # games = db.relationship('Game', secondary=game_players, back_populates='players')

class Game(db.Model, SerializerMixin):
    """
    Game model - represents a Monopoly game session
    The 'state' field stores the entire game state as JSON, allowing players to resume later
    """
    __tablename__ = 'game'
    serialize_rules = ('-owner.games', '-players.games')
    
    id = db.Column(db.Integer, primary_key=True)
    # This is what allows the game to be saved and resumed later
    state = db.Column(db.JSON, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, paused, or finished
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # This helps track when the game was last played
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    player_id=db.Column(db.Integer, db.ForeignKey('player.id'), nullable=True)
    # Many-to-many: one game can have multiple players
    # players = db.relationship('Player', secondary=game_players, back_populates='games')
