from flask import Flask, render_template, request, jsonify

# venv/bin/activate.fish
# export FLASK_APP=server.py
# flask run

app = Flask(
  __name__,
  static_folder='static/dist',
  template_folder='static/templates'
)

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def hello():
  if request.method == 'GET':
    return render_template('index.html')

  if (request.json['email'] == 'slaattene@gmail.com'
      and request.json['password'] == '1234'
  ):
    return 'You are logged in'

  return 'Wrong credentials'

@app.route('/drum-machine', methods=['GET'])
def drumMachine():
  return render_template('index.html')

if __name__ == '__main__':
  app.run(debug=True)
