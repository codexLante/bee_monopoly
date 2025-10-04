from app.db import db
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

class GamePlayer(db.Model, SerializerMixin):
    __tablename__ = 'game_player'
    
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), primary_key=True)

    # Relationships
    game = db.relationship('Game')
    player = db.relationship('Player')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)