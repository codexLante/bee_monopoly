from flask import Blueprint, jsonify, request
from app.model import User,Player,Game
from app.db import db
from flask_bcrypt import Bcrypt
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity

bcrypt = Bcrypt()

BOARD_POSITIONS = {
    0: "Go", 1: "Mediterranean Avenue", 2: "Community Chest 1", 3: "Baltic Avenue", 4: "Income Tax",
    5: "Reading Railroad", 6: "Oriental Avenue", 7: "Chance 1", 8: "Vermont Avenue", 9: "Connecticut Avenue",
    10: "Jail", 11: "St. Charles Place", 12: "Electric Company", 13: "States Avenue", 14: "Virginia Avenue",
    15: "Pennsylvania Railroad", 16: "St. James Place", 17: "Community Chest 2", 18: "Tennessee Avenue",
    19: "New York Avenue", 20: "Free Parking", 21: "Kentucky Avenue", 22: "Chance 2", 23: "Indiana Avenue",
    24: "Illinois Avenue", 25: "B. & O. Railroad", 26: "Atlantic Avenue", 27: "Ventnor Avenue", 28: "Water Works",
    29: "Marvin Gardens", 30: "Go to Jail", 31: "Pacific Avenue", 32: "North Carolina Avenue", 33: "Community Chest 3",
    34: "Pennsylvania Avenue", 35: "Short Line", 36: "Chance 3", 37: "Park Place", 38: "Luxury Tax", 39: "Boardwalk"
}




game_bp = Blueprint("game",__name__)

@game_bp.route('/create', methods=['POST'])
@jwt_required()
def create_game():
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    data = request.get_json()
    
    num_human_players = data.get('numHumanPlayers', 1)
    num_computer_players = data.get('numComputerPlayers', 0)
    player_names = data.get('playerNames', [user.username])
    player_colors = data.get('playerColors', ['red', 'blue', 'green', 'yellow'])

    players_list = []
    for i in range(num_human_players):
        player_name = player_names[i] if i < len(player_names) else f"Player {i+1}"
        player_color = player_colors[i] if i < len(player_colors) else 'red'
        player = Player(name=player_name, color=player_color, is_computer=False)
        db.session.add(player)
        db.session.flush()
        players_list.append(player)

    computer_colors = ['purple', 'orange', 'pink', 'brown']
    for i in range(min(num_computer_players, 3)):
        color_index = (num_human_players + i) % len(computer_colors)
        computer_player = Player(
            name=f"Computer {i+1}",
            color=computer_colors[color_index],
            is_computer=True
        )
        db.session.add(computer_player)
        db.session.flush()
        players_list.append(computer_player)

    board = {}
    from app.game.game_logic import BOARD_SPACES
    for position, space_info in BOARD_SPACES.items():
        space_name = space_info['name']
        space_type = space_info.get('type')
        if space_type in ['property', 'railroad', 'utility']:
            board[space_name] = {
                'position': position,
                'price': space_info.get('price', 0),
                'owner': None,
                'houses': 0,
                'type': space_type
            }
        else:
            board[space_name] = {
                'position': position,
                'type': space_type
            }

    initial_state = {
        'currentPlayer': 0,
        'players': [p.to_dict() for p in players_list],  # ✅ Now includes is_computer
        'turn': 1,
        'board': board
    }

    game = Game(state=initial_state, owner=user)
    for p in players_list:
        game.players.append(p)
    db.session.add(game)
    db.session.commit()
    
    return jsonify({'game_id': game.id, 'game': game.to_dict()}), 201


@game_bp.route('/<int:game_id>', methods=['GET'])
@jwt_required()
def get_game(game_id):
    """
    Loads a saved game from the database
    This is how players resume their games - all progress is preserved
    """
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    return jsonify(game.to_dict()), 200


@game_bp.route('<int:game_id>/state', methods=['PUT', 'PATCH'])
@jwt_required()
def update_game(game_id):
    """
    Updates and saves the game state
    This is called after every move, purchase, or action to preserve progress
    """
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    data = request.get_json()
    game.state = data.get('state', game.state)
    game.updated_at = datetime.utcnow()  # Track when the game was last played
    db.session.commit()  # Save to database - this is what allows resuming later
    return jsonify({'message': 'Game updated', 'game': game.to_dict()}), 200


@game_bp.route('/<int:game_id>', methods=['DELETE'])
@jwt_required()
def delete_game(game_id):
    """Deletes a game from the database"""
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    game = Game.query.get(game_id)
    
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    if game.owner_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(game)
    db.session.commit()
    return jsonify({'message': 'Game deleted'}), 200


@game_bp.route('/my-games', methods=['GET'])
@jwt_required()
def my_games():
    """
    Gets all games owned by the current user
    Shows both active games (can be resumed) and finished games
    """
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    user_games = Game.query.filter_by(owner=user).all()
    return jsonify({'games': [g.to_dict() for g in user_games]}), 200