from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, get_jwt, create_access_token, create_refresh_token
)
from models import db, User, Game, Player
from datetime import datetime

routes = Blueprint('routes', __name__)
logged_out_tokens = set()

# ------------------ BOARD MAPPING ------------------
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

# ------------------ AUTH ------------------
@routes.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username, email, password = data.get('username'), data.get('email'), data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 409

    user = User(username=username, email=email, password=password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(only=('id', 'username', 'email'))
    }), 201


@routes.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email, password = data.get('email'), data.get('password')
    user = User.query.filter_by(email=email).first()

    if not user or user.password != password:
        return jsonify({'error': 'Wrong email or password'}), 401

    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {'username': user.username, 'email': user.email}
    }), 200


@routes.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    email = get_jwt_identity()
    new_token = create_access_token(identity=email)
    return jsonify({'access_token': new_token}), 200


@routes.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    token_id = get_jwt()['jti']
    logged_out_tokens.add(token_id)
    return jsonify({'message': 'Logged out'}), 200


@routes.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_user():
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    return jsonify(user.to_dict(only=('id', 'username', 'email'))), 200


# ------------------ GAMES ------------------
@routes.route('/api/game/create', methods=['POST'])
@jwt_required()
def create_game():
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    data = request.get_json()
    player_name = data.get('playerName', user.username)
    player_color = data.get('playerColor', 'red')

    player = Player(name=player_name, color=player_color)
    db.session.add(player)
    db.session.flush()

    # Initialize board
    board = {}
    for pos in range(40):
        name = BOARD_POSITIONS.get(pos, f"Space {pos}")
        if "Avenue" in name or "Railroad" in name or name in ["Electric Company", "Water Works", "Boardwalk", "Park Place"]:
            board[name] = {"price": 60 + pos*10, "owner": None, "houses": 0, "position": pos}
        else:
            board[name] = {"position": pos}

    initial_state = {
        'currentPlayer': 0,
        'players': [player.to_dict()],
        'turn': 1,
        'board': board
    }

    game = Game(state=initial_state, owner=user)
    game.players.append(player)
    db.session.add(game)
    db.session.commit()
    
    return jsonify({'game_id': game.id, 'game': game.to_dict()}), 201


@routes.route('/api/game/<int:game_id>', methods=['GET'])
@jwt_required()
def get_game(game_id):
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    return jsonify(game.to_dict()), 200


@routes.route('/api/game/<int:game_id>/state', methods=['PUT', 'PATCH'])
@jwt_required()
def update_game(game_id):
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    data = request.get_json()
    game.state = data.get('state', game.state)
    game.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Game updated', 'game': game.to_dict()}), 200


@routes.route('/api/game/<int:game_id>', methods=['DELETE'])
@jwt_required()
def delete_game(game_id):
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


@routes.route('/api/game/my-games', methods=['GET'])
@jwt_required()
def my_games():
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    user_games = Game.query.filter_by(owner=user).all()
    return jsonify({'games': [g.to_dict() for g in user_games]}), 200


# ------------------ MOVE PLAYER ------------------
@routes.route('/api/game/<int:game_id>/move', methods=['POST'])
@jwt_required()
def move_player(game_id):
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    data = request.get_json()
    player_id = data.get('player_id')
    dice_roll = data.get('dice')

    if not dice_roll or not isinstance(dice_roll, list) or not all(isinstance(d, int) for d in dice_roll):
        return jsonify({'error': 'Invalid dice roll'}), 400

    player = next((p for p in game.state['players'] if p['id'] == player_id), None)
    if not player:
        return jsonify({'error': 'Player not found in game'}), 404

    move = sum(dice_roll)
    new_position = (player['position'] + move) % 40
    player['position'] = new_position
    landed_name = next((name for name, p in game.state['board'].items() if p.get('position') == new_position), None)
    messages = [f"{player['name']} moved {move} spaces to {landed_name}"]

    # Handle rent
    prop = game.state['board'].get(landed_name)
    if prop and prop.get("owner") and prop["owner"] != player_id:
        owner = next((p for p in game.state['players'] if p['id'] == prop["owner"]), None)
        rent = prop['price'] // 10 + prop.get('houses', 0) * 50
        if player['money'] < rent:
            owner['money'] += player['money']
            player['money'] = 0
            game.state['players'] = [p for p in game.state['players'] if p['id'] != player_id]
            messages.append(f"{player['name']} went bankrupt! {owner['name']} receives remaining money.")
        else:
            player['money'] -= rent
            owner['money'] += rent
            messages.append(f"{player['name']} paid ${rent} rent to {owner['name']}.")

    # Rotate turn
    game.state['currentPlayer'] = (game.state['currentPlayer'] + 1) % len(game.state['players'])
    game.state['turn'] += 1
    game.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'messages': messages, 'state': game.state}), 200


# ------------------ BUILD HOUSES/HOTELS ------------------
@routes.route('/api/game/<int:game_id>/build', methods=['POST'])
@jwt_required()
def build_property(game_id):
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    data = request.get_json()
    player_id = data.get('player_id')
    property_name = data.get('property')

    player = next((p for p in game.state['players'] if p['id'] == player_id), None)
    if not player:
        return jsonify({'error': 'Player not found'}), 404

    board = game.state.get('board', {})
    prop = board.get(property_name)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404
    if prop.get('owner') != player_id:
        return jsonify({'error': 'You do not own this property'}), 400

    build_cost = 100
    current_houses = prop.get('houses', 0)
    if current_houses < 4:
        cost = build_cost
        prop['houses'] = current_houses + 1
        upgrade = "house"
    else:
        cost = build_cost * 5
        prop['houses'] = 5
        upgrade = "hotel"

    if player['money'] < cost:
        return jsonify({'error': 'Not enough money to build'}), 400

    player['money'] -= cost
    game.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': f"{player['name']} built a {upgrade} on {property_name}", 'state': game.state}), 200
