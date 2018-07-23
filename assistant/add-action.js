const _ = require('lodash');

const TASK_NAME = 'Add Action';

task( TASK_NAME )
.then( (assistant, options = {}) => {

	return assistant.ask([{
		name : 'name',
		message : `${TASK_NAME}: Name`,
		default : options.name
	}])
	.then( ( options ) => {
		//do something about this
		return options;
	})
	.then( ( options ) => {
		const {name} = options;
		//offer additional actions
		return assistant.choose( _.filter( [
			//offer to add a matching reducer if assistant not already actioned it
			{
				name: `Add a handler to Action '${name}'`, 
				value: () => assistant.task( 'add-action-handler', {action:name} )
			},
			assistant.completed( 'add-reducer', {name} ) == false && {
				name: `Add a '${name}' reducer`, 
				value: () => assistant.task( 'add-reducer', {name} )
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