from app.db import db
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

class Player(db.Model, SerializerMixin):
    __tablename__ = 'player'
    serialize_rules = ('-games.players',)
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False)
    position = db.Column(db.Integer, default=0)
    money = db.Column(db.Integer, default=1500)
    properties = db.Column(db.JSON, default=list)
    is_computer = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Many-to-many: one player can be in multiple games
    games = db.relationship('Game', secondary='game_player', back_populates='players')


    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'money': 1500,
            'position': 0,
            'is_computer': self.is_computer,  # ✅ This is the fix
            'properties': [],
            'in_jail': False,
            'jail_turns': 0
        }
