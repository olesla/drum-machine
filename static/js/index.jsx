import React from 'react';
import ReactDOM from 'react-dom';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import App from './App.jsx';

ReactDOM.render(<App/>, document.getElementById('content'));

// class HelloMessage extends React.Component {
//   render () {
//     return (
//       <div>
//         Hello {this.props.name}
//       </div>
//     );
//   }
// }

// ReactDOM.render(
//   <App/>,
//   document.getElementById('content'),
// );

// ReactDOM.render(
//   <HelloMessage name='Gompen'/>,
//   document.getElementById('content')
// )
