const _ = require('lodash');

const TASK_NAME = 'Add Test';

task( TASK_NAME )
.then( (assistant, options = {}) => {
	return assistant.choose([
		{name : 'Test Reducer Handler', value: () => testReducer( assistant ) },
		{name : 'Test Action Handler', value: () => testAction( assistant ) }
	])
	.then( actionSelected => actionSelected() )
});

function testReducer( assistant ){
	//list all the reducers
	return assistant.list('./tests/reducers', ['.js'])
	.then( items => {
		console.log( 'items', _.map(items, item => item.match[1]) );
	} )
}

function testAction( assistant ){
	//list all the actions
	return assistant.list('./tests/actions', ['.js'])
	.then( items => {
		console.log( 'items', _.map(items, item => item.match[1]) );
	} )
}