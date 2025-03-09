import os
from flask import Flask
from extensions import db

app = Flask(__name__)

# Configure the Flask app
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Initialize the app with the extension
db.init_app(app)

with app.app_context():
    # Import all models
    from models import User, Role, Category, Product, Order, SupportTicket, TicketResponse
    # Create all tables
    db.create_all()
    print("Database tables created successfully")