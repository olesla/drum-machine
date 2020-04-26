from flask import Flask, render_template, request
app = Flask(__name__)

@app.errorhandler(404)
def page_not_found(error):
  return render_template('page_not_found.html'), 404

@app.route('/')
def index():
  return 'Hello, Flask'

@app.route('/greeter/<name>')
def greeter(name):
  return render_template('index.html', name=name)

@app.route('/login', methods=['GET', 'POST'])
def login():
  error = None
  
  if request.method == 'POST':
    if request.form['email'] and request.form['password']:
      return 'You are logged in'
    else:
      error = 'missing email or password broski'

  return render_template('login.html', error=error)

@app.route('/data', methods=['GET'])
def data():
  return {
    'name': 'Ole Christian',
    'desc': 'A pretty cool dude',
    'age' : 32,
  }
