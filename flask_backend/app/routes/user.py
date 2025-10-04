from flask import Blueprint, jsonify, request
from app.model import User
from app.db import db
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from datetime import timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt


bcrypt = Bcrypt()
user_bp = Blueprint("user", __name__)

# Register user
@user_bp.route("/add", methods=["POST"])
def register_user():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    exists = User.query.filter_by(email=email).first()
    if exists:
        return jsonify({"error": "Email already in use"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    new_user = User(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "created_at": new_user.created_at
        }
    }), 201


# Login user
@user_bp.route("/login", methods=["POST"])
@jwt_required(optional=True)
def login_user():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 401

    check_pass = bcrypt.check_password_hash(user.password, password)
    if not check_pass:
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(
        identity={"id": user.id, "username": user.username},
        expires_delta=timedelta(minutes=30)  # adjust as needed
    )

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200


@user_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    email = get_jwt_identity()
    new_token = create_access_token(identity=email)
    return jsonify({'access_token': new_token}), 200


@user_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    token_id = get_jwt()['jti']
    logged_out_tokens.add(token_id)
    return jsonify({'message': 'Logged out'}), 200


@user_bp.route('/get_user', methods=['GET'])
@jwt_required()
def get_user():
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    return jsonify(user.to_dict(only=('id', 'username', 'email'))), 200

