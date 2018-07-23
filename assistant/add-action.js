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
		return assistant.task('add-reducer', _.pick( result, 'name' ) );
	} )
} );