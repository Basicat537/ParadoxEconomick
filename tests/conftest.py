import os
import pytest
from app import app, db
from config import Config

@pytest.fixture(scope='session')
def test_app():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    return app

@pytest.fixture(scope='function')
def test_client(test_app):
    return test_app.test_client()

@pytest.fixture(scope='function')
def init_database():
    # Setup
    db.create_all()
    yield db  # this is where the testing happens
    # Teardown
    db.session.remove()
    db.drop_all()
