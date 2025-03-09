import os
from flask import Flask
from extensions import db
from flask_login import LoginManager
from routes.admin import admin_blueprint
import logging

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    level=logging.DEBUG
)

app = Flask(__name__)

# Configure the Flask app
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'main.login'

# Register blueprints
app.register_blueprint(admin_blueprint)

# Initialize login manager
@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

with app.app_context():
    # Import all models
    from models import User, Role, Category, Product, Order, SupportTicket, TicketResponse
    # Create all tables
    db.create_all()
    print("Database tables created successfully")