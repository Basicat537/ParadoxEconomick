from typing import List, Optional
from sqlalchemy.exc import SQLAlchemyError
from models import Product, Category
from app import db
import logging

logger = logging.getLogger(__name__)

class ProductService:
    async def get_categories(self) -> List[Category]:
        try:
            return Category.query.all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching categories: {str(e)}")
            raise

    async def get_products_by_category(self, category_id: int) -> List[Product]:
        try:
            return Product.query.filter_by(
                category_id=category_id,
                active=True
            ).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching products: {str(e)}")
            raise

    async def get_product(self, product_id: int) -> Optional[Product]:
        try:
            return Product.query.get(product_id)
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching product: {str(e)}")
            raise

    async def create_product(self, data: dict) -> Product:
        try:
            product = Product(
                name=data['name'],
                description=data['description'],
                price=data['price'],
                category_id=data['category_id'],
                digital_content=data['digital_content']
            )
            db.session.add(product)
            db.session.commit()
            return product
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when creating product: {str(e)}")
            raise

    async def update_product(self, product_id: int, data: dict) -> Optional[Product]:
        try:
            product = await self.get_product(product_id)
            if not product:
                return None
                
            for key, value in data.items():
                setattr(product, key, value)
                
            db.session.commit()
            return product
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when updating product: {str(e)}")
            raise

    async def delete_product(self, product_id: int) -> bool:
        try:
            product = await self.get_product(product_id)
            if not product:
                return False
                
            product.active = False
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when deleting product: {str(e)}")
            raise

    async def search_products(self, query: str) -> List[Product]:
        try:
            return Product.query.filter(
                Product.name.ilike(f"%{query}%") |
                Product.description.ilike(f"%{query}%")
            ).filter_by(active=True).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when searching products: {str(e)}")
            raise