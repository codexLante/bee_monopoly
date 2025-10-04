from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, get_jwt, create_access_token, create_refresh_token
)
from datetime import datetime
from flask_backend.app.ai_player import MonopolyAI
from flask_backend.app.game_logic import BOARD_SPACES, handle_landing, can_build_house, handle_jail, check_winner

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

# ------------------ GAMES ------------------
@routes.route('/api/game/create', methods=['POST'])
@jwt_required()
def create_game():
    """
    Creates a new Monopoly game with human and/or computer players
    The game state is automatically saved to the database
    """
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    data = request.get_json()
    
    num_human_players = data.get('numHumanPlayers', 1)
    num_computer_players = data.get('numComputerPlayers', 0)
    player_names = data.get('playerNames', [user.username])
    player_colors = data.get('playerColors', ['red', 'blue', 'green', 'yellow'])

    # Create human players
    players_list = []
    for i in range(num_human_players):
        player_name = player_names[i] if i < len(player_names) else f"Player {i+1}"
        player_color = player_colors[i] if i < len(player_colors) else 'red'
        player = Player(name=player_name, color=player_color, is_computer=False)
        db.session.add(player)
        db.session.flush()
        players_list.append(player)

    # Properties have prices and can be owned, other spaces are just positions
    board = {}
    for pos in range(40):
        name = BOARD_POSITIONS.get(pos, f"Space {pos}")
        if "Avenue" in name or "Railroad" in name or name in ["Electric Company", "Water Works", "Boardwalk", "Park Place"]:
            board[name] = {"price": 60 + pos*10, "owner": None, "houses": 0, "position": pos}
        else:
            board[name] = {"position": pos}

    # Create computer players if requested
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

    # This entire state object is saved to the database and can be loaded later
    initial_state = {
        'currentPlayer': 0,  # Index of whose turn it is
        'players': [p.to_dict() for p in players_list],  # All player data
        'turn': 1,  # Current turn number
        'board': board  # All board spaces and their properties
    }

    # Create and save the game
    game = Game(state=initial_state, owner=user)
    for p in players_list:
        game.players.append(p)
    db.session.add(game)
    db.session.commit()  # This saves the game to the database
    
    return jsonify({'game_id': game.id, 'game': game.to_dict()}), 201


@routes.route('/api/game/<int:game_id>', methods=['GET'])
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


@routes.route('/api/game/<int:game_id>/state', methods=['PUT', 'PATCH'])
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


@routes.route('/api/game/<int:game_id>', methods=['DELETE'])
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


@routes.route('/api/game/my-games', methods=['GET'])
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


# ------------------ MOVE PLAYER ------------------
@routes.route('/api/game/<int:game_id>/move', methods=['POST'])
@jwt_required()
def move_player(game_id):
    """
    Moves a player and handles all game logic (rent, jail, properties, etc.)
    """
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    data = request.get_json()
    player_id = data.get('player_id')
    dice_roll = data.get('dice')

    if not dice_roll or len(dice_roll) != 2:
        return jsonify({'error': 'Invalid dice roll'}), 400

    # Find the player
    player = next((p for p in game.state['players'] if p['id'] == player_id), None)
    if not player:
        return jsonify({'error': 'Player not found'}), 404

    messages = []
    
    can_move, jail_messages = handle_jail(player, dice_roll)
    messages.extend(jail_messages)
    
    if not can_move:
        # Player stays in jail, move to next turn
        game.state['currentPlayer'] = (game.state['currentPlayer'] + 1) % len(game.state['players'])
        game.state['turn'] += 1
        game.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'messages': messages, 'state': game.state}), 200
    
    old_position = player['position']
    move_spaces = dice_roll[0] + dice_roll[1]
    new_position = (old_position + move_spaces) % 40
    player['position'] = new_position
    
    if new_position < old_position:
        player['money'] += 200
        messages.append(f"{player['name']} passed Go! Collected $200")
    
    landing_messages, actions = handle_landing(player, new_position, game.state)
    messages.extend(landing_messages)
    
    if actions.get('bankrupt'):
        # Remove player from game
        game.state['players'] = [p for p in game.state['players'] if p['id'] != player_id]
        messages.append(f"{player['name']} is out of the game!")
        
        # Check for winner
        winner = check_winner(game.state)
        if winner:
            messages.append(f"🎉 {winner['name']} wins the game!")
            game.state['winner'] = winner['id']
    
    # Move to next player
    if len(game.state['players']) > 1:
        game.state['currentPlayer'] = (game.state['currentPlayer'] + 1) % len(game.state['players'])
        game.state['turn'] += 1
    
    game.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'messages': messages,
        'state': game.state,
        'actions': actions
    }), 200


@routes.route('/api/game/<int:game_id>/buy', methods=['POST'])
@jwt_required()
def buy_property(game_id):
    """
    Allows a player to buy a property they landed on
    """
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    player_id = data.get('player_id')
    property_name = data.get('property')
    
    player = next((p for p in game.state['players'] if p['id'] == player_id), None)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    property_data = game.state['board'].get(property_name)
    if not property_data:
        return jsonify({'error': 'Property not found'}), 404
    
    if property_data.get('owner') is not None:
        return jsonify({'error': 'Property already owned'}), 400
    
    price = property_data.get('price', 0)
    if player['money'] < price:
        return jsonify({'error': 'Not enough money'}), 400
    
    # Buy the property
    player['money'] -= price
    property_data['owner'] = player_id
    
    # Add to player's properties list
    if 'properties' not in player:
        player['properties'] = []
    player['properties'].append(property_name)
    
    game.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': f"{player['name']} bought {property_name} for ${price}",
        'state': game.state
    }), 200


# ------------------ BUILD HOUSES/HOTELS ------------------
@routes.route('/api/game/<int:game_id>/build', methods=['POST'])
@jwt_required()
def build_property(game_id):
    """
    Builds a house or hotel on a property
    """
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    data = request.get_json()
    player_id = data.get('player_id')
    property_name = data.get('property')

    player = next((p for p in game.state['players'] if p['id'] == player_id), None)
    if not player:
        return jsonify({'error': 'Player not found'}), 404

    can_build, reason = can_build_house(player, property_name, game.state)
    if not can_build:
        return jsonify({'error': reason}), 400

    property_data = game.state['board'][property_name]
    house_cost = 100
    
    # Build the house
    player['money'] -= house_cost
    property_data['houses'] = property_data.get('houses', 0) + 1
    
    building_type = "house" if property_data['houses'] < 5 else "hotel"
    
    game.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': f"{player['name']} built a {building_type} on {property_name}",
        'state': game.state
    }), 200

@routes.route('/api/game/<int:game_id>/ai-action', methods=['POST'])
@jwt_required()
def ai_action(game_id):
    """Handle AI player actions"""
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    action_type = data.get('action')  # 'buy', 'build', or 'decide'
    player_id = data.get('player_id')
    
    player = next((p for p in game.state['players'] if p['id'] == player_id), None)
    if not player or not player.get('is_computer'):
        return jsonify({'error': 'Invalid AI player'}), 400
    
    result = {'action': 'pass'}
    
    if action_type == 'buy':
        property_name = data.get('property')
        prop = game.state['board'].get(property_name)
        if prop and MonopolyAI.should_buy_property(player, prop):
            # Buy property
            if player['money'] >= prop['price']:
                player['money'] -= prop['price']
                prop['owner'] = player_id
                player['properties'] = player.get('properties', []) + [property_name]
                result = {'action': 'buy', 'property': property_name}
                game.updated_at = datetime.utcnow()
                db.session.commit()
    
    elif action_type == 'build':
        property_name = MonopolyAI.choose_property_to_build(player, game.state['board'])
        if property_name:
            prop = game.state['board'][property_name]
            if MonopolyAI.should_build(player, prop, game.state['board']):
                build_cost = 100 if prop.get('houses', 0) < 4 else 500
                if player['money'] >= build_cost:
                    player['money'] -= build_cost
                    prop['houses'] = prop.get('houses', 0) + 1
                    result = {'action': 'build', 'property': property_name}
                    game.updated_at = datetime.utcnow()
                    db.session.commit()
    
    return jsonify(result), 200
