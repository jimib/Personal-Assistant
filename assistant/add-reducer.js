const _ = require('lodash');

const TASK_NAME = 'Add Reducer';

task('Add Reducer')
.then( (assistant, options = {}) => {

	return assistant.ask([{
		name : 'name',
		message : `${TASK_NAME}: Name`,
		default : options.name
	}])
	.then( ( result ) => {
		return assistant.completed( result );
	})
	.then( ( result ) => {
		const {name} = result;
		if( !_.find( assistant.completedTasks, task => {
			return task.id == 'add-action' && task.options.name == name ? true : false;
		} ) ){
			return assistant.task('add-action', {name} );
		}else{
			console.log('already added action');
		}
	} )
} );