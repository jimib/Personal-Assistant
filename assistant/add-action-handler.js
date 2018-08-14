const _ = require('lodash');

const TASK_NAME = 'Add Action Handler';

task( TASK_NAME )
.then( (assistant, options = {}) => {
	
	let {action} = options;

	return Promise.resolve( options.action )
	.then( action => {
		return action ? action : 
		assistant.choose([
			'Action1',
			'Action2',
			'Action3',
			'Action4'
		])
	} )
	.then( action => {
		return {action}
	})
	.then( ( state ) => {
		return assistant.ask([{
			name : 'handler',
			message : `${TASK_NAME}: Name`,
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
		const {name, action} = options;
		//offer additional actions
		return assistant.choose( _.filter( [
			//offer to add a matching reducer if assistant not already actioned it
			{
				name: `Add another handler to Action '${action}'`, 
				value: () => assistant.task( 'add-action-handler', {action} )
			},
			assistant.completed( 'add-reducer', {name:action} ) == false && {
				name: `Add a '${action}' reducer`, 
				value: () => assistant.task( 'add-reducer', {name:action} )
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