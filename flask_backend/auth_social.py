from flask import Blueprint, redirect, jsonify
from authlib.integrations.flask_client import OAuth
from flask_jwt_extended import create_access_token, create_refresh_token
# from models import db, User
import os

auth_social_bp = Blueprint('auth_social', __name__)
oauth = OAuth()

# Google OAuth config
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# GitHub OAuth config
oauth.register(
    name='github',
    client_id=os.environ.get('GITHUB_CLIENT_ID'),
    client_secret=os.environ.get('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'}
)

# -------------------- Google --------------------
@auth_social_bp.route('/api/auth/google')
def google_login():
    redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
    return oauth.google.authorize_redirect(redirect_uri)

@auth_social_bp.route('/api/auth/google/callback')
def google_callback():
    token = oauth.google.authorize_access_token()
    user_info = token.get('userinfo')
    if not user_info:
        return jsonify({'error': 'Failed to get user info'}), 400

    email = user_info.get('email')
    name = user_info.get('name')

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=name, email=email, auth_provider='google', google_id=user_info.get('sub'))
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    frontend_url = os.environ.get('FRONTEND_URL')
    return redirect(f'{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}')

# -------------------- GitHub --------------------
@auth_social_bp.route('/api/auth/github')
def github_login():
    redirect_uri = os.environ.get('GITHUB_REDIRECT_URI')
    return oauth.github.authorize_redirect(redirect_uri)

@auth_social_bp.route('/api/auth/github/callback')
def github_callback():
    token = oauth.github.authorize_access_token()
    resp = oauth.github.get('user', token=token)
    user_info = resp.json()
    email = user_info.get('email')

    # Get primary email if not public
    if not email:
        emails_resp = oauth.github.get('user/emails', token=token)
        emails = emails_resp.json()
        email = next((e['email'] for e in emails if e['primary']), None)

    if not email:
        return jsonify({'error': 'Failed to get email'}), 400

    name = user_info.get('name') or user_info.get('login')
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=name, email=email, auth_provider='github', github_id=user_info.get('id'))
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=email)
    refresh_token = create_refresh_token(identity=email)
    frontend_url = os.environ.get('FRONTEND_URL')
    return redirect(f'{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}')
