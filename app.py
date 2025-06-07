from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import random
import string
import json
import os
from config import Config
from models import db, User, Click, Withdrawal, IPLog

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

# Telegram Bot Setup
TELEGRAM_BOT_TOKEN = app.config['TELEGRAM_BOT_TOKEN']
bot_application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    web_app_url = os.environ.get('WEB_APP_URL', 'http://telegram-mining-game.onrender.com')
    await update.message.reply_text(
        'Oýny başlaň!',
        reply_markup={'keyboard': [[{'text': 'Oýny Aç', 'web_app': {'url': web_app_url}}]]}
    )

bot_application.add_handler(CommandHandler('start', start))

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        update = Update.de_json(request.get_json(), bot_application.bot)
        bot_application.process_update(update)
        return '', 200
    except Exception as e:
        print(f"Webhook error: {e}")
        return '', 500

# Generate referral code
def generate_referral_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

# Update mining coins
def update_mining():
    with app.app_context():
        users = User.query.all()
        for user in users:
            now = datetime.utcnow()
            minutes_passed = (now - user.last_mining_update).total_seconds() / 60
            if minutes_passed > 0:
                user.coins += int(minutes_passed * user.mining_rate)
                user.last_mining_update = now
        db.session.commit()

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(update_mining, 'interval', minutes=1)
scheduler.start()

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/')
@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/referrals')
def referrals():
    return render_template('referrals.html')

@app.route('/withdraw')
def withdraw():
    return render_template('withdraw.html')

@app.route('/api/auth', methods=['POST'])
def auth():
    init_data = request.form.get('init_data')
    user_data = json.loads(request.form.get('user', '{}'))
    telegram_id = str(user_data.get('id'))
    username = user_data.get('username', f"User{telegram_id[:8]}")

    if not telegram_id:
        return jsonify({'error': 'Invalid Telegram data'}), 401

    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        referral_code = generate_referral_code()
        user = User(telegram_id=telegram_id, username=username, referral_code=referral_code)
        db.session.add(user)
        db.session.commit()

    session['user_id'] = user.id
    ip_log = IPLog(user_id=user.id, ip_address=request.remote_addr, action='login')
    db.session.add(ip_log)
    db.session.commit()

    return jsonify({'user_id': user.id, 'username': user.username, 'coins': user.coins, 'referral_code': user.referral_code})

@app.route('/api/click', methods=['POST'])
def click():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    today = datetime.utcnow().date()
    click_record = Click.query.filter_by(user_id=user.id, date=today).first()
    now = datetime.utcnow()

    if not click_record:
        click_record = Click(user_id=user.id, click_count=0, last_click=now, date=today)
        db.session.add(click_record)

    if click_record.click_count >= 100:
        return jsonify({'error': 'Daily click limit reached'}), 400

    if click_record.last_click and (now - click_record.last_click).total_seconds() < 1:
        return jsonify({'error': 'Click too fast'}), 429

    click_record.click_count += 1
    click_record.last_click = now
    user.coins += 1
    db.session.commit()

    ip_log = IPLog(user_id=user.id, ip_address=request.remote_addr, action='click')
    db.session.add(ip_log)
    db.session.commit()

    return jsonify({'coins': user.coins, 'clicks_today': click_record.click_count})

@app.route('/api/referral/<code>', methods=['GET'])
def referral(code):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if user.referred_by:
        return jsonify({'error': 'Already referred'}), 400

    referrer = User.query.filter_by(referral_code=code).first()
    if not referrer or referrer.id == user.id or referrer.referral_count >= 100:
        return jsonify({'error': 'Invalid or maxed referral'}), 400

    user.referred_by = code
    referrer.referral_count += 1
    referrer.coins += 5
    db.session.commit()

    return jsonify({'message': 'Referral applied', 'referrer_coins': referrer.coins})

@app.route('/api/withdraw', methods=['POST'])
def withdraw_request():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user.invested:
        return jsonify({'error': 'Investment required'}), 400
    if user.coins < 500:
        return jsonify({'error': 'Minimum 500 coins required'}), 400

    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    amount = int(data.get('amount', 0))

    if not name or not phone or amount < 500 or amount > user.coins:
        return jsonify({'error': 'Invalid withdrawal data'}), 400

    withdrawal = Withdrawal(user_id=user.id, amount=amount, name=name, phone=phone)
    user.coins -= amount
    db.session.add(withdrawal)
    db.session.commit()

    return jsonify({'message': 'Withdrawal requested'})

@app.route('/api/user', methods=['GET'])
def user_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    today = datetime.utcnow().date()
    click_record = Click.query.filter_by(user_id=user.id, date=today).first()

    return jsonify({
        'username': user.username,
        'coins': user.coins,
        'referral_code': user.referral_code,
        'referral_count': user.referral_count,
        'clicks_today': click_record.click_count if click_record else 0
    })

@app.route('/admin/users', methods=['GET'])
def admin_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'telegram_id': u.telegram_id,
        'username': u.username,
        'coins': u.coins,
        'referral_count': u.referral_count
    } for u in users])

@app.route('/admin/withdrawals', methods=['GET', 'POST'])
def admin_withdrawals():
    if request.method == 'POST':
        data = request.json
        withdrawal = Withdrawal.query.get(data.get('id'))
        if withdrawal:
            withdrawal.status = data.get('status')
            db.session.commit()
        return jsonify({'message': 'Withdrawal updated'})

    withdrawals = Withdrawal.query.all()
    return jsonify([{
        'id': w.id,
        'user_id': w.user_id,
        'amount': w.amount,
        'name': w.name,
        'phone': w.phone,
        'status': w.status
    } for w in withdrawals])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))