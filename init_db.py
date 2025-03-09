from app import app, db
from models import Category, Product, Role, User

def init_db():
    with app.app_context():
        # Create test category
        category = Category(
            name="Цифровые товары",
            description="Электронные товары и услуги"
        )
        db.session.add(category)
        db.session.commit()

        # Create test product
        product = Product(
            name="Тестовый продукт",
            description="Описание тестового продукта",
            price=9.99,
            category_id=category.id,
            digital_content="test_content",
            active=True
        )
        db.session.add(product)
        
        # Create admin role
        admin_role = Role(name='admin', description='Administrator')
        db.session.add(admin_role)
        db.session.commit()

        print("Test data added successfully")

if __name__ == "__main__":
    init_db()
