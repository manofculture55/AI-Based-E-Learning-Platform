"""
Auth routes — handles user signup and login.

POST /api/auth/signup — Create a new user account
POST /api/auth/login  — Authenticate and receive JWT token
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from extensions import db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Create a new user account.

    Expects JSON: { username: str, password: str, age: int }
    Validates: username >= 3 chars, password >= 6 chars, age 1-100, unique username.
    Returns: { token: str, user: dict } with 201 on success.
    """
    data = request.get_json()

    username = data.get('username', '').strip()
    password = data.get('password', '')
    age = data.get('age')

    if not username or not password or not age:
        return jsonify({'error': 'Username, password and age are required'}), 400

    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if not isinstance(age, int) or age < 1 or age > 100:
        return jsonify({'error': 'Age must be between 1 and 100'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    user = User(username=username, age=age)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user and return a JWT token.

    Expects JSON: { username: str, password: str }
    Returns: { token: str, user: dict } with 200 on success, 401 on failure.
    """
    data = request.get_json()

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """
    Get the currently authenticated user based on the JWT token.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200