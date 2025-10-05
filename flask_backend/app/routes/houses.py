from flask import Blueprint, jsonify, request
from app.model import Game
from app.db import db
from datetime import datetime
from flask_jwt_extended import jwt_required
from app.game.game_logic import can_build_house
from app.game.ai_player import MonopolyAI


house_bp=Blueprint("houses",__name__)
@house_bp.route('/<int:game_id>/build', methods=['POST'])
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

@house_bp.route('/<int:game_id>/ai-move', methods=['POST'])
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