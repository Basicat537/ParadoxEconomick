from typing import List, Dict, Any, Optional
from sqlalchemy.exc import SQLAlchemyError
from models import User, Product, Order, SupportTicket, TicketResponse, Category # Added Category import
from app import db
from config import Config
import logging
from datetime import datetime, timedelta
from sqlalchemy import func, and_

logger = logging.getLogger(__name__)

class AdminService:
    async def is_admin(self, telegram_id: int) -> bool:
        try:
            user = User.query.filter_by(telegram_id=telegram_id).first()
            return user and user.username in Config.ADMIN_USERNAMES
        except SQLAlchemyError as e:
            logger.error(f"Database error when checking admin status: {str(e)}")
            raise

    async def get_all_users(self, filters: Dict[str, Any] = None) -> List[User]:
        """Get users with optional filtering"""
        try:
            query = User.query
            if filters:
                if 'active' in filters:
                    query = query.filter_by(active=filters['active'])
                if 'created_after' in filters:
                    query = query.filter(User.created_at >= filters['created_after'])
                if 'search' in filters:
                    search = f"%{filters['search']}%"
                    query = query.filter(
                        (User.username.ilike(search)) | (User.email.ilike(search))
                    )
            return query.all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching users: {str(e)}")
            raise

    async def get_all_orders(self, filters: Dict[str, Any] = None) -> List[Order]:
        """Get orders with optional filtering"""
        try:
            query = Order.query
            if filters:
                if 'status' in filters:
                    query = query.filter_by(status=filters['status'])
                if 'user_id' in filters:
                    query = query.filter_by(user_id=filters['user_id'])
                if 'date_range' in filters:
                    start_date, end_date = filters['date_range']
                    query = query.filter(
                        and_(Order.created_at >= start_date, Order.created_at <= end_date)
                    )
            return query.order_by(Order.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching orders: {str(e)}")
            raise

    async def get_support_tickets(self, status: str = None, filters: Dict[str, Any] = None) -> List[SupportTicket]:
        """Get support tickets with enhanced filtering"""
        try:
            query = SupportTicket.query
            if status:
                query = query.filter_by(status=status)
            if filters:
                if 'priority' in filters:
                    query = query.filter_by(priority=filters['priority'])
                if 'user_id' in filters:
                    query = query.filter_by(user_id=filters['user_id'])
                if 'date_range' in filters:
                    start_date, end_date = filters['date_range']
                    query = query.filter(
                        and_(SupportTicket.created_at >= start_date, 
                             SupportTicket.created_at <= end_date)
                    )
            return query.order_by(SupportTicket.created_at.desc()).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching support tickets: {str(e)}")
            raise

    async def respond_to_ticket(self, ticket_id: int, admin_id: int, message: str) -> bool:
        """Respond to support ticket with enhanced tracking"""
        try:
            ticket = SupportTicket.query.get(ticket_id)
            if not ticket:
                return False

            # Create response with timestamp
            response = TicketResponse(
                ticket_id=ticket_id,
                admin_id=admin_id,
                message=message,
                created_at=datetime.utcnow()
            )
            db.session.add(response)

            # Update ticket status and response time
            ticket.status = 'answered'
            ticket.last_response_at = datetime.utcnow()
            db.session.commit()

            logger.info(f"Admin {admin_id} responded to ticket {ticket_id}")
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when responding to ticket: {str(e)}")
            raise

    async def get_statistics(self) -> Dict[str, Any]:
        """Get enhanced platform statistics with detailed metrics"""
        try:
            now = datetime.utcnow()
            day_ago = now - timedelta(days=1)
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)

            # Basic statistics
            basic_stats = {
                'total_users': User.query.count(),
                'active_users': User.query.filter_by(active=True).count(),
                'total_orders': Order.query.count(),
                'completed_orders': Order.query.filter_by(status='completed').count(),
                'pending_tickets': SupportTicket.query.filter_by(status='open').count(),
                'active_products': Product.query.filter_by(active=True).count()
            }

            # Revenue statistics
            revenue_stats = db.session.query(
                func.sum(Product.price).label('total_revenue')
            ).join(Order).filter(Order.status == 'completed').first()

            # Time-based metrics
            time_stats = {
                'new_users_24h': User.query.filter(User.created_at >= day_ago).count(),
                'new_users_7d': User.query.filter(User.created_at >= week_ago).count(),
                'new_users_30d': User.query.filter(User.created_at >= month_ago).count(),
                'orders_24h': Order.query.filter(Order.created_at >= day_ago).count(),
                'orders_7d': Order.query.filter(Order.created_at >= week_ago).count(),
                'orders_30d': Order.query.filter(Order.created_at >= month_ago).count(),
            }

            # Support metrics
            support_stats = {
                'open_tickets': SupportTicket.query.filter_by(status='open').count(),
                'average_response_time': self._calculate_average_response_time(),
                'tickets_24h': SupportTicket.query.filter(
                    SupportTicket.created_at >= day_ago
                ).count(),
            }

            # Combine all statistics
            return {
                **basic_stats,
                'total_revenue': float(revenue_stats[0] or 0),
                'time_stats': time_stats,
                'support_stats': support_stats
            }
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching statistics: {str(e)}")
            raise

    async def update_product(self, product_id: int, data: Dict[str, Any]) -> bool:
        """Update product with enhanced validation and logging"""
        try:
            product = Product.query.get(product_id)
            if not product:
                return False

            # Track changes for logging
            changes = []
            for key, value in data.items():
                if hasattr(product, key):
                    old_value = getattr(product, key)
                    if old_value != value:
                        setattr(product, key, value)
                        changes.append(f"{key}: {old_value} -> {value}")

            if changes:
                db.session.commit()
                logger.info(f"Product {product_id} updated: {', '.join(changes)}")
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when updating product: {str(e)}")
            raise

    def _calculate_average_response_time(self) -> float:
        """Calculate average response time for support tickets"""
        try:
            tickets = SupportTicket.query.filter(
                SupportTicket.status == 'answered'
            ).all()

            if not tickets:
                return 0.0

            total_response_time = sum(
                (ticket.last_response_at - ticket.created_at).total_seconds()
                for ticket in tickets
                if ticket.last_response_at
            )
            return total_response_time / len(tickets) / 3600  # Convert to hours
        except Exception as e:
            logger.error(f"Error calculating average response time: {str(e)}")
            return 0.0

    async def get_all_categories(self) -> List[Category]:
        """Get all categories with product counts"""
        try:
            return Category.query.order_by(Category.name).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching categories: {str(e)}")
            raise

    async def get_category(self, category_id: int) -> Optional[Category]:
        """Get single category by ID"""
        try:
            return Category.query.get(category_id)
        except SQLAlchemyError as e:
            logger.error(f"Database error when fetching category: {str(e)}")
            raise

    async def create_category(self, data: Dict[str, Any]) -> Optional[Category]:
        """Create new category with validation"""
        try:
            # Validate name
            if not data.get('name'):
                logger.error("Category name is required")
                return None

            # Check for duplicate names
            existing = Category.query.filter_by(name=data['name']).first()
            if existing:
                logger.error(f"Category with name {data['name']} already exists")
                return None

            category = Category(
                name=data['name'],
                description=data.get('description', '')
            )
            db.session.add(category)
            db.session.commit()

            logger.info(f"Created new category: {category.name}")
            return category

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when creating category: {str(e)}")
            raise

    async def update_category(self, category_id: int, data: Dict[str, Any]) -> bool:
        """Update category with validation and logging"""
        try:
            category = await self.get_category(category_id)
            if not category:
                return False

            # Validate name
            if not data.get('name'):
                logger.error("Category name is required")
                return False

            # Check for duplicate names
            existing = Category.query.filter(
                Category.name == data['name'],
                Category.id != category_id
            ).first()
            if existing:
                logger.error(f"Category with name {data['name']} already exists")
                return False

            # Track changes for logging
            changes = []
            if category.name != data['name']:
                changes.append(f"name: {category.name} -> {data['name']}")
                category.name = data['name']

            if category.description != data.get('description'):
                changes.append(f"description updated")
                category.description = data.get('description')

            if changes:
                db.session.commit()
                logger.info(f"Updated category {category_id}: {', '.join(changes)}")
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error when updating category: {str(e)}")
            raise

    async def batch_update_products(self, product_ids: List[int], data: Dict[str, Any]) -> bool:
        """Update multiple products with enhanced security and validation"""
        try:
            # Validate input
            if not product_ids or not data:
                logger.error("Invalid input for batch update")
                return False

            products = []
            changes = []

            # Fetch all products and validate
            for product_id in product_ids:
                product = Product.query.get(product_id)
                if not product:
                    logger.error(f"Product not found: {product_id}")
                    return False
                products.append(product)

            # Update all products
            for product in products:
                product_changes = []
                for key, value in data.items():
                    if hasattr(product, key):
                        old_value = getattr(product, key)
                        if old_value != value:
                            setattr(product, key, value)
                            product_changes.append(f"{key}: {old_value} -> {value}")

                if product_changes:
                    changes.append(f"Product {product.id}: {', '.join(product_changes)}")
                    product.updated_at = datetime.utcnow()

            if changes:
                db.session.commit()
                logger.info(f"Batch updated products: {', '.join(changes)}")
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in batch update products: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in batch update products: {str(e)}")
            return False

    async def batch_delete_products(self, product_ids: List[int]) -> bool:
        """Delete multiple products with security checks"""
        try:
            # Validate input
            if not product_ids:
                logger.error("No product IDs provided for batch delete")
                return False

            products = []

            # Fetch all products and validate
            for product_id in product_ids:
                product = Product.query.get(product_id)
                if not product:
                    logger.error(f"Product not found: {product_id}")
                    return False

                # Check for existing orders
                if product.orders:
                    logger.error(f"Cannot delete product {product_id} with existing orders")
                    return False

                products.append(product)

            # Delete all products
            for product in products:
                db.session.delete(product)

            db.session.commit()
            logger.info(f"Batch deleted products: {product_ids}")
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error in batch delete products: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in batch delete products: {str(e)}")
            return False