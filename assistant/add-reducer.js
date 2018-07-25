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
		const {name} = options;
		//do something about this
		return assistant.template( `./tests/example/reducers/${_.capitalize(name)}Reducer.js`, 'reducer.js', options )
		//return the options - not the result of the template
		.then( result => options );
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