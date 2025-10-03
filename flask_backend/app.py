# Simple Flask backend for Monopoly game
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import timedelta, datetime

app = Flask(__name__)

# Secret key for JWT tokens (change this in production!)
app.config['JWT_SECRET_KEY'] = 'change-this-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Token lasts 1 hour
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)  # Refresh lasts 30 days

# Allow frontend to talk to backend
CORS(app)

jwt = JWTManager(app)

# Simple storage (use a real database in production)
users = {}  # Stores all users
games = {}  # Stores all games
logged_out_tokens = set()  # Tracks logged out tokens

# Check if token was logged out
@jwt.token_in_blocklist_loader
def check_token(jwt_header, jwt_payload):
    return jwt_payload['jti'] in logged_out_tokens

# REGISTER - Create new account
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Check if user already exists
    if email in users:
        return jsonify({'error': 'User already exists'}), 409
    
    # Save new user
    users[email] = {
        'username': username,
        'email': email,
        'password': password  # In production, hash this!
    }
    
    # Create tokens
    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {'username': username, 'email': email}
    }), 201

# LOGIN - Sign in to existing account
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Check if user exists and password matches
    user = users.get(email)
    if not user or user['password'] != password:
        return jsonify({'error': 'Wrong email or password'}), 401
    
    # Create tokens
    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {'username': user['username'], 'email': user['email']}
    }), 200

# REFRESH - Get new access token
@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    email = get_jwt_identity()
    new_token = create_access_token(identity=email)
    return jsonify({'access_token': new_token}), 200

# LOGOUT - Sign out
@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    token_id = get_jwt()['jti']
    logged_out_tokens.add(token_id)
    return jsonify({'message': 'Logged out'}), 200

# GET USER - Get current user info
@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_user():
    email = get_jwt_identity()
    user = users.get(email)
    return jsonify({'username': user['username'], 'email': user['email']}), 200

# CREATE GAME - Start new game
@app.route('/api/game/create', methods=['POST'])
@jwt_required()
def create_game():
    email = get_jwt_identity()
    data = request.get_json()
    
    # Generate game ID
    game_id = f"game_{len(games) + 1}"
    player_name = data.get('playerName', users[email]['username'])
    
    # Create new game
    games[game_id] = {
        'id': game_id,
        'owner': email,
        'state': {
            'currentPlayer': 0,
            'players': [{
                'id': email,
                'name': player_name,
                'position': 0,
                'money': 1500,
                'properties': []
            }],
            'turn': 1
        },
        'status': 'active',
        'created': datetime.now().isoformat()
    }
    
    return jsonify({'game_id': game_id, 'game': games[game_id]}), 201

# GET GAME - Load game by ID
@app.route('/api/game/<game_id>', methods=['GET'])
@jwt_required()
def get_game(game_id):
    game = games.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    return jsonify(game), 200

# UPDATE GAME - Save game progress
@app.route('/api/game/<game_id>/state', methods=['PUT'])
@jwt_required()
def update_game(game_id):
    game = games.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    game['state'] = data.get('state')
    game['updated'] = datetime.now().isoformat()
    
    return jsonify(game), 200

# SAVE GAME - Pause and save
@app.route('/api/game/<game_id>/save', methods=['POST'])
@jwt_required()
def save_game(game_id):
    game = games.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    game['state'] = data.get('state')
    game['status'] = 'saved'
    game['updated'] = datetime.now().isoformat()
    
    return jsonify({'message': 'Game saved', 'game': game}), 200

# RESUME GAME - Continue saved game
@app.route('/api/game/<game_id>/resume', methods=['POST'])
@jwt_required()
def resume_game(game_id):
    game = games.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    game['status'] = 'active'
    return jsonify({'message': 'Game resumed', 'game': game}), 200

# DELETE GAME - Remove game
@app.route('/api/game/<game_id>', methods=['DELETE'])
@jwt_required()
def delete_game(game_id):
    if game_id in games:
        del games[game_id]
    return jsonify({'message': 'Game deleted'}), 200

# MY GAMES - Get all user's games
@app.route('/api/game/my-games', methods=['GET'])
@jwt_required()
def my_games():
    email = get_jwt_identity()
    user_games = [g for g in games.values() if g['owner'] == email]
    return jsonify({'games': user_games}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
