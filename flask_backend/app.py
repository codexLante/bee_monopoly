from app import create_app
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# from routes import routes, logged_out_tokens

# from auth_social import auth_social_bp
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# ------------------ Config ------------------
# app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "change-this-secret-key")
# app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # seconds
# app.config['JWT_REFRESH_TOKEN_EXPIRES'] = 30 * 24 * 3600  # 30 days
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ------------------ Extensions ------------------
# CORS(app)
# jwt = JWTManager(app)
# db.init_app(app)
# migrate.init_app(app, db)

# ------------------ Create DB tables ------------------
# with app.app_context():
#  db.create_all()

# ------------------ JWT Blocklist ------------------
# @jwt.token_in_blocklist_loader
# def check_token(jwt_header, jwt_payload):
#     return jwt_payload['jti'] in logged_out_tokens

# # ------------------ Register Blueprints ------------------
# app.register_blueprint(routes)           # REST API routes
# app.register_blueprint(auth_social_bp)  # Social login (Google/GitHub)

# ------------------ Run Server ------------------
if __name__ == '__main__':
    app=create_app()
    app.run(debug=True, port=5000)
