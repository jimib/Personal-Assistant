import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import App from './components/App';

import {AppContainer} from 'react-hot-loader';

//onload attach the react app
$( () => {
	if( $('[data-app="app"]').length == 0 ){
		var $root = $('<div>').attr('data-app','app').appendTo( $('body') );
		ReactDOM.render( <App />, $root.get(0) );
	}
} );