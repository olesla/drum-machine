import React from 'react';
const axios = require('axios');

class Login extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      email   : '',
      password: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleLogin  = this.handleLogin.bind(this);
  }
  
  render () {
    return (
      <div>
        <input
          onChange={this.handleChange} 
          name='email' 
          type='text' 
          placeholder='Your e-mail address'
        />
        <input
          onChange={this.handleChange} 
          name='password' 
          type='password' 
          placeholder='Enter password'
        />
        <button onClick={this.handleLogin}>Submit</button>
      </div>
    );
  }

  handleChange (event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  async handleLogin () {
    // Have to figure out how to configure babel to allow async\await 
    const result = await axios.post('/login', {
      email   : this.state.email,
      password: this.state.password,
    });
    console.log(result);
  }
}

export default Login;
