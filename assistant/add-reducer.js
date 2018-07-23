const _ = require('lodash');

const TASK_NAME = 'Add Reducer';

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
			assistant.completed( 'add-action', {name} ) == false && {
				name: `Add a '${name}' action`, 
				value: () => assistant.task( 'add-action', {name} )
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