from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file
from flask_login import login_required, current_user
from functools import wraps
from services.admin_service import AdminService
from datetime import datetime, timedelta
import logging
from io import StringIO
import csv

logger = logging.getLogger(__name__)
admin_blueprint = Blueprint('admin', __name__, url_prefix='/admin')
admin_service = AdminService()

def admin_required(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not await admin_service.is_admin(current_user.telegram_id):
            flash('Доступ запрещен', 'danger')
            return redirect(url_for('main.index'))
        return await f(*args, **kwargs)
    return decorated_function

@admin_blueprint.route('/')
@login_required
@admin_required
async def dashboard():
    try:
        # Получаем общую статистику
        stats = await admin_service.get_statistics()
        
        # Получаем данные по продажам за последние 30 дней
        now = datetime.utcnow()
        sales_data = await admin_service.get_all_orders({
            'date_range': [now - timedelta(days=30), now],
            'status': 'completed'
        })
        
        # Форматируем данные для графика
        sales_by_date = {}
        for order in sales_data:
            date = order.created_at.strftime('%Y-%m-%d')
            sales_by_date[date] = sales_by_date.get(date, 0) + 1
        
        # Получаем популярные товары
        top_products = await admin_service.get_top_products(limit=5)
        
        # Получаем статистику тикетов
        support_stats = {
            'open': stats['support_stats']['open_tickets'],
            'in_progress': await admin_service.get_support_tickets(status='in_progress'),
            'closed': await admin_service.get_support_tickets(status='closed')
        }
        
        # Получаем последние действия
        recent_actions = await admin_service.get_recent_actions(limit=10)
        
        return render_template('admin/dashboard.html',
            stats=stats,
            sales_data={
                'labels': list(sales_by_date.keys()),
                'values': list(sales_by_date.values())
            },
            top_products=top_products,
            support_data=[
                support_stats['open'],
                len(support_stats['in_progress']),
                len(support_stats['closed'])
            ],
            recent_actions=recent_actions
        )
    except Exception as e:
        logger.error(f"Error in admin dashboard: {str(e)}")
        flash('Произошла ошибка при загрузке данных', 'danger')
        return redirect(url_for('main.index'))

@admin_blueprint.route('/users')
@login_required
@admin_required
async def users():
    try:
        filters = {}
        if request.args.get('active'):
            filters['active'] = request.args.get('active') == 'true'
        if request.args.get('search'):
            filters['search'] = request.args.get('search')
        
        users = await admin_service.get_all_users(filters)
        return render_template('admin/users.html', users=users)
    except Exception as e:
        logger.error(f"Error in admin users: {str(e)}")
        flash('Произошла ошибка при загрузке пользователей', 'danger')
        return redirect(url_for('admin.dashboard'))

@admin_blueprint.route('/orders')
@login_required
@admin_required
async def orders():
    try:
        filters = {}
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('user_id'):
            filters['user_id'] = int(request.args.get('user_id'))
        
        orders = await admin_service.get_all_orders(filters)
        return render_template('admin/orders.html', orders=orders)
    except Exception as e:
        logger.error(f"Error in admin orders: {str(e)}")
        flash('Произошла ошибка при загрузке заказов', 'danger')
        return redirect(url_for('admin.dashboard'))

@admin_blueprint.route('/tickets')
@login_required
@admin_required
async def tickets():
    try:
        filters = {}
        if request.args.get('priority'):
            filters['priority'] = request.args.get('priority')
        if request.args.get('status'):
            status = request.args.get('status')
        else:
            status = 'open'
        
        tickets = await admin_service.get_support_tickets(status, filters)
        return render_template('admin/tickets.html', tickets=tickets)
    except Exception as e:
        logger.error(f"Error in admin tickets: {str(e)}")
        flash('Произошла ошибка при загрузке тикетов', 'danger')
        return redirect(url_for('admin.dashboard'))

@admin_blueprint.route('/tickets/<int:ticket_id>/respond', methods=['POST'])
@login_required
@admin_required
async def respond_ticket(ticket_id):
    try:
        message = request.form.get('message')
        if not message:
            flash('Сообщение не может быть пустым', 'danger')
            return redirect(url_for('admin.tickets'))
        
        success = await admin_service.respond_to_ticket(
            ticket_id=ticket_id,
            admin_id=current_user.id,
            message=message
        )
        
        if success:
            flash('Ответ отправлен успешно', 'success')
        else:
            flash('Не удалось отправить ответ', 'danger')
        
        return redirect(url_for('admin.tickets'))
    except Exception as e:
        logger.error(f"Error in admin respond ticket: {str(e)}")
        flash('Произошла ошибка при отправке ответа', 'danger')
        return redirect(url_for('admin.tickets'))

@admin_blueprint.route('/products')
@login_required
@admin_required
async def products():
    try:
        products = await admin_service.get_all_products()
        return render_template('admin/products.html', products=products)
    except Exception as e:
        logger.error(f"Error in admin products: {str(e)}")
        flash('Произошла ошибка при загрузке товаров', 'danger')
        return redirect(url_for('admin.dashboard'))

@admin_blueprint.route('/products/<int:product_id>/update', methods=['POST'])
@login_required
@admin_required
async def update_product(product_id):
    try:
        data = {
            'name': request.form.get('name'),
            'price': float(request.form.get('price')),
            'description': request.form.get('description'),
            'active': request.form.get('active') == 'true'
        }
        
        success = await admin_service.update_product(product_id, data)
        
        if success:
            flash('Товар успешно обновлен', 'success')
        else:
            flash('Не удалось обновить товар', 'danger')
        
        return redirect(url_for('admin.products'))
    except Exception as e:
        logger.error(f"Error in admin update product: {str(e)}")
        flash('Произошла ошибка при обновлении товара', 'danger')
        return redirect(url_for('admin.products'))

@admin_blueprint.route('/categories')
@login_required
@admin_required
async def categories():
    try:
        categories = await admin_service.get_all_categories()
        return render_template('admin/categories.html', categories=categories)
    except Exception as e:
        logger.error(f"Error in admin categories: {str(e)}")
        flash('Произошла ошибка при загрузке категорий', 'danger')
        return redirect(url_for('admin.dashboard'))

@admin_blueprint.route('/categories/<int:category_id>')
@login_required
@admin_required
async def get_category(category_id):
    try:
        category = await admin_service.get_category(category_id)
        if not category:
            return jsonify({'error': 'Категория не найдена'}), 404
        return jsonify({
            'id': category.id,
            'name': category.name,
            'description': category.description
        })
    except Exception as e:
        logger.error(f"Error getting category: {str(e)}")
        return jsonify({'error': 'Произошла ошибка'}), 500

@admin_blueprint.route('/categories/<int:category_id>/update', methods=['POST'])
@login_required
@admin_required
async def update_category(category_id):
    try:
        data = {
            'name': request.form.get('name'),
            'description': request.form.get('description')
        }
        
        success = await admin_service.update_category(category_id, data)
        
        if success:
            flash('Категория успешно обновлена', 'success')
        else:
            flash('Не удалось обновить категорию', 'danger')
        
        return redirect(url_for('admin.categories'))
    except Exception as e:
        logger.error(f"Error in admin update category: {str(e)}")
        flash('Произошла ошибка при обновлении категории', 'danger')
        return redirect(url_for('admin.categories'))

@admin_blueprint.route('/categories/create', methods=['POST'])
@login_required
@admin_required
async def create_category():
    try:
        data = {
            'name': request.form.get('name'),
            'description': request.form.get('description')
        }
        
        category = await admin_service.create_category(data)
        
        if category:
            flash('Категория успешно создана', 'success')
        else:
            flash('Не удалось создать категорию', 'danger')
        
        return redirect(url_for('admin.categories'))
    except Exception as e:
        logger.error(f"Error in admin create category: {str(e)}")
        flash('Произошла ошибка при создании категории', 'danger')
        return redirect(url_for('admin.categories'))

@admin_blueprint.route('/products/export')
@login_required
@admin_required
async def export_products():
    try:
        products = await admin_service.get_all_products()

        output = StringIO()
        writer = csv.writer(output)

        # Write headers
        writer.writerow(['ID', 'Название', 'Категория', 'Цена', 'Статус', 'Продажи', 'Дата создания', 'Последнее обновление'])

        # Write product data
        for product in products:
            writer.writerow([
                product.id,
                product.name,
                product.category.name,
                product.price,
                'Активен' if product.active else 'Неактивен',
                len(product.orders),
                product.created_at.strftime('%Y-%m-%d %H:%M'),
                product.updated_at.strftime('%Y-%m-%d %H:%M')
            ])

        output.seek(0)
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'products_export_{datetime.utcnow().strftime("%Y%m%d_%H%M")}.csv'
        )
    except Exception as e:
        logger.error(f"Error exporting products: {str(e)}")
        flash('Произошла ошибка при экспорте товаров', 'danger')
        return redirect(url_for('admin.products'))

@admin_blueprint.route('/products/batch-update', methods=['POST'])
@login_required
@admin_required
async def batch_update_products():
    try:
        product_ids = request.form.getlist('ids[]')
        active = request.form.get('active') == 'true'

        if not product_ids:
            return jsonify({'error': 'No products selected'}), 400

        # Security check: verify all products exist and admin has access
        for product_id in product_ids:
            product = await admin_service.get_product(int(product_id))
            if not product:
                return jsonify({'error': f'Product {product_id} not found'}), 404

        # Perform batch update
        success = await admin_service.batch_update_products(product_ids, {'active': active})

        if success:
            return jsonify({'message': 'Products updated successfully'})
        else:
            return jsonify({'error': 'Failed to update products'}), 500

    except Exception as e:
        logger.error(f"Error in batch update products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_blueprint.route('/products/batch-delete', methods=['POST'])
@login_required
@admin_required
async def batch_delete_products():
    try:
        product_ids = request.form.getlist('ids[]')

        if not product_ids:
            return jsonify({'error': 'No products selected'}), 400

        # Security check: verify all products exist and admin has access
        for product_id in product_ids:
            product = await admin_service.get_product(int(product_id))
            if not product:
                return jsonify({'error': f'Product {product_id} not found'}), 404

            # Check if product has orders
            if product.orders:
                return jsonify({
                    'error': f'Product {product_id} has associated orders and cannot be deleted'
                }), 400

        # Perform batch delete
        success = await admin_service.batch_delete_products(product_ids)

        if success:
            return jsonify({'message': 'Products deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete products'}), 500

    except Exception as e:
        logger.error(f"Error in batch delete products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@admin_blueprint.route('/analytics')
@login_required
@admin_required
async def analytics():
    try:
        # Get sales trends for last 30 days
        sales_trends = await admin_service.get_sales_trends(30)

        # Get top products
        top_products = await admin_service.get_top_products(5)

        # Get general statistics
        stats = await admin_service.get_statistics()

        return render_template('admin/analytics.html',
            sales_trends=sales_trends,
            top_products=top_products,
            stats=stats
        )
    except Exception as e:
        logger.error(f"Error in admin analytics: {str(e)}")
        flash('Произошла ошибка при загрузке аналитики', 'danger')
        return redirect(url_for('admin.dashboard'))

@admin_blueprint.route('/analytics/export')
@login_required
@admin_required
async def export_analytics():
    try:
        sales_trends = await admin_service.get_sales_trends(30)
        top_products = await admin_service.get_top_products(10)

        output = StringIO()
        writer = csv.writer(output)

        # Write sales trends
        writer.writerow(['Дата', 'Количество продаж', 'Выручка'])
        for i, date in enumerate(sales_trends['dates']):
            writer.writerow([
                date,
                sales_trends['sales'][i],
                sales_trends['revenue'][i]
            ])

        writer.writerow([])  # Empty row as separator

        # Write top products
        writer.writerow(['ID товара', 'Название', 'Количество продаж', 'Выручка'])
        for product in top_products:
            writer.writerow([
                product['id'],
                product['name'],
                product['sales'],
                product['revenue']
            ])

        output.seek(0)
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'analytics_export_{datetime.utcnow().strftime("%Y%m%d_%H%M")}.csv'
        )
    except Exception as e:
        logger.error(f"Error exporting analytics: {str(e)}")
        flash('Произошла ошибка при экспорте аналитики', 'danger')
        return redirect(url_for('admin.analytics'))