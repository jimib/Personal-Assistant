const _ = require('lodash');

const TASK_NAME = 'Add Action';

task( TASK_NAME )
.then( (assistant, options = {}) => {

	return assistant.ask([{
		name : 'name',
		message : `${TASK_NAME}: Name`,
		default : options.name
	}])
	.then( ( result ) => {
		//do something about this
		
	})
	.then( ( result ) => {
		const {name} = result;
		return assistant.choose( _.filter( [
			assistant.completed( 'add-reducer', {name} ) == false && {
				name: `Add a '${result.name}' reducer`, 
				value: () => assistant.task( 'add-reducer', {name} )
			},
			{
				name: `Other`, 
				value: () => null
			}
		] ) )
		.then( result => {
			//action the chosen option
			return result();
		} );
	} )
} );