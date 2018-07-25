const _ = require('lodash');

const TASK_NAME = 'Add Reducer Handler';

task( TASK_NAME )
.then( (assistant, options = {}) => {
	
	let {reducer} = options;

	return Promise.resolve( options.action )
	.then( reducer => {
		return reducer ? reducer : 
		assistant.list('./tests/example/reducers',{extensions:['.js']})
		.then( reducers => assistant.choose( reducers ) )
	} )
	.then( reducer => {
		return {reducer}
	})
	.then( ( state ) => {
		return assistant.ask([{
			name : 'handler',
			message : `${TASK_NAME}: What SHOULD it do`,
			default : options.name
		}])
		.then( input => _.merge( state, input ) )
	} )
	.then( ( options ) => {
		console.log( options );
		//do something about this
		return options;
	})
	.then( ( options ) => {
		const {name, reducer} = options;
		//offer additional actions
		return assistant.choose( _.filter( [
			//offer to add a matching reducer if assistant not already actioned it
			{
				name: `Add another handler to Reducer '${reducer}'`, 
				value: () => assistant.task( 'add-reducer-handler', {reducer} )
			},
			assistant.completed( 'add-action', {name:reducer} ) == false && {
				name: `Add a '${reducer}' action`, 
				value: () => assistant.task( 'add-action', {name:reducer} )
			},
			{
				name: `Skip`, 
				value: () => null
			}
		] ) )
		//action what ever they selected (the value is a function)
		.then( actionSelected => actionSelected() );
	} )
} );