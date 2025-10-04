from app.db import db
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

class Game(db.Model, SerializerMixin):
    __tablename__ = 'game'
    serialize_rules = ('-owner.games', '-players.games')
    
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.JSON, nullable=False)
    status = db.Column(db.String(20), default='active')
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = db.relationship('User', back_populates='games')
    players = db.relationship('Player', secondary='game_player', back_populates='games')

