from flask import Blueprint, jsonify, request
from app.model import User, Player, Game
from app.db import db
from datetime import datetime
from flask_jwt_extended import jwt_required
from app.game.game_logic import handle_jail, handle_landing, check_winner
from sqlalchemy.orm.attributes import flag_modified

move_bp = Blueprint("move", __name__)

@move_bp.route('/<int:game_id>/move', methods=['POST'])
@jwt_required()
def move_player(game_id):
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    data = request.get_json()
    player_id = data.get('player_id')
    dice_roll = data.get('dice')

    if not dice_roll or len(dice_roll) != 2:
        return jsonify({'error': 'Invalid dice roll'}), 400

    player = next((p for p in game.state['players'] if p['id'] == player_id), None)
    if not player:
        return jsonify({'error': 'Player not found'}), 404

    messages = []
    actions = {}

    # Jail check
    can_move, jail_messages = handle_jail(player, dice_roll)
    messages.extend(jail_messages)

    if not can_move:
        game.state['currentPlayer'] = (game.state['currentPlayer'] + 1) % len(game.state['players'])
        game.state['turn'] += 1
        flag_modified(game, 'state')
        game.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'messages': messages, 'state': game.state}), 200

    # Move player
    old_position = player['position']
    move_spaces = sum(dice_roll)
    new_position = (old_position + move_spaces) % 40
    player['position'] = new_position

    if new_position < old_position:
        player['money'] += 200
        messages.append(f"{player['name']} passed Go! Collected $200")

    # Handle landing
    landing_messages, actions = handle_landing(player, new_position, game.state)
    messages.extend(landing_messages)

    # Bankrupt check
    if actions.get('bankrupt'):
        game.state['players'] = [p for p in game.state['players'] if p['id'] != player_id]
        messages.append(f"{player['name']} is out of the game!")

        winner = check_winner(game.state)
        if winner:
            messages.append(f"🎉 {winner['name']} wins the game!")
            game.state['winner'] = winner['id']

    # Advance turn
    if len(game.state['players']) > 1:
        game.state['currentPlayer'] = (game.state['currentPlayer'] + 1) % len(game.state['players'])
        game.state['turn'] += 1

    flag_modified(game, 'state')
    game.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'messages': messages,
        'state': game.state,
        'actions': actions
    }), 200


@move_bp.route('/<int:game_id>/buy', methods=['POST'])
@jwt_required()
def buy_property(game_id):
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

    if 'properties' not in player:
        player['properties'] = []
    player['properties'].append(property_name)

    flag_modified(game, 'state')
    game.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': f"{player['name']} bought {property_name} for ${price}",
        'state': game.state
    }), 200
