const path = require('path');

// Constant with our paths
const paths = {
  DIST: path.resolve(__dirname, 'dist'),
  SRC: path.resolve(__dirname, 'src')
};

// Webpack configuration
module.exports = {
  mode: 'development',
  entry: path.join(paths.SRC, 'index.js'),
  output: {
    path: paths.DIST,
    filename: 'app.bundle.js',
  },
  // Dev server configuration -> ADDED IN THIS STEP
  // Now it uses our "src" folder as a starting point
  devServer: {
    contentBase: paths.SRC,
  },
  // Loaders configuration telling webpack to use "babel-loader" for .js and .jsx files
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [
          path.resolve( paths.SRC )
        ],
        use: ['babel-loader?compact=false'],
      },
      // CSS loader to CSS files
      {
        test: /\.disable.css|styl$/,
        include: [
			path.resolve( paths.SRC )
        ],
        use: [
          'style-loader', 
          'css-loader?-url&importLoader=1&modules&localIdentName=[path]___[name]__[local]___[hash:base64:5]', 
          'stylus-loader'
        ]
      }
    ],
  },

  // Enable importing JS files without specifying their extenstions
  // So we can write: import MyComponent from './my-component';
  // Instead of: import MyComponent from './my-component.jsx';
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devServer: {
	headers: {
		"Access-Control-Allow-Origin": "file:///Users/jamesbailey/Work/gitsrc/Jimi/Projects/PersonalAssistant/dist/index.html",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Headers": "Content-Type, Authorization, x-id, Content-Length, X-Requested-With",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
	},
	contentBase: paths.DIST
  }
};