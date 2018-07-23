const clear = require('cli-clear');
const inquirer = require('inquirer');
const fs = require('fs-extra-promise');
const path = require('path');
const _ = require('lodash');
const util = require('util');

const DIR_PROMPT = path.resolve('.');

//look for an assistant directory
getAssistantStore( DIR_PROMPT )
.then( dir => {
	if( !dir ){
		throw new Error('Assistant Store could not be found');
	}
	
	new Assistant( dir );
} )

function Assistant( dirStore ){
	//variables
	this.dirStore = dirStore;
	this.tasks = {};
	this.prompt = inquirer.createPromptModule();
	this.status = new inquirer.ui.BottomBar();
	this.tasksCompleted = [
		{id:'x',options:{name:'Test'}}
	];

	//retrieve a list of tasks
	fs.readdirAsync( this.dirStore )
	//filter out any non-scripts
	.then( scripts => _.filter( scripts, script => _.includes(['.js'], path.extname(script) ) ) )
	.then( scripts => {
		//loop each script and get a list of tasks
		_.each( scripts, script => {
			const id = path.basename( script, path.extname( script ) );
			const refTask = this.tasks[id] = {id};
			
			//expose function to the imported script
			global.task = function( name ){
				refTask.name = name;
				return {
					then : ( func ) => {
						refTask.func = func
					}
				}
			}
			//now require it
			require( path.resolve( this.dirStore, script ) );

			if( !util.isFunction( refTask.func ) ){
				console.warn(`Task for '${id}' was not defined`)
				delete this.tasks[id];
			}
		} );

		global.task = null;
	} )
	.then( () => {
		
		// limit the width for rendering
		this.services();
	} )
}

Assistant.prototype.services = function( message, choices ){
	return this.choose( 'What can I do for you?', _.concat(
		_.map( this.tasks, ( task, id ) => ({name:task.name,value:id}) ),
		{name:'Exit',value:() => this.exit() }
	) )
	.then( answer => {
		if( util.isFunction( answer ) ){
			return answer();
		}else{
			this.start( answer );
		}
	} );
}

Assistant.prototype.choose = function( message, choices ){
	if( util.isArray( message ) ){
		choices = message;
		message = null;
	}

	return this.ask([
		{
			name : 'choice',
			message : message,
			type : 'list',
			choices : choices
		}
	])
	.then( result => result.choice );
}

Assistant.prototype.ask = function( questions ){
	return this.prompt( questions );
}


Assistant.prototype.start = function( id, options = {} ){
	//this.status.updateBottomBar(`Task: ${this.tasks[id].name}`)
	if( this.currentTask ){
		throw new Error(`Task '${this.currentTask.id}' is still running`);
	}else if( !id ){
		throw new Error('Task id required');
	}else{
		this.currentTask = {id,options};
		const promise = this.tasks[id].func( this, options );

		if( !util.isNullOrUndefined( promise ) ){
			if( util.isFunction( promise.then ) ){
				//wait until it completes
				promise.then( result => {
					completedCurrentTask();
					//check for additional task
					checkForTask( result );
				} );
			}else{
				completedCurrentTask();
				checkForTask( promise );
			}
		}
	}

	const completedCurrentTask = () => {
		if( this.currentTask ){
			this.tasksCompleted.push( this.currentTask );
			this.currentTask = null;			
		}
	}

	const checkForTask = ( result ) => {
		//did we exit with another task
		const {task} = result || {};
		if( task ){
			this.start( task.id, task.options );
		}else{
			this.services();
		}
	}
}

Assistant.prototype.task = function( id, options = {} ){
	//stop promise - we return a formatted object - the previous task now needs to exit
	return {task:{id,options}}
}

Assistant.prototype.completed = function( id, options = {} ){
	//check all the completed tasks and see if they match
	return !_.every( this.tasksCompleted, (task) => {
		//return TRUE if doesn't match
		//return FALSE if does match
		if( id == task.id && _.every( options, (value, id) => {
			//check only the supplid options to see if they match
			return task.options[id] == value; 
		}) ){
			return false;
		}
		
		return true;
	} );
}

Assistant.prototype.exit = function( ){
	console.log('Thank you!');
}

//HELPERS
function getAssistantStore( dir ){
	const dirAssistant = path.resolve( dir, 'assistant' );
	return fs.existsAsync( dirAssistant )
	.then( exists => {
		if( exists ){
			return dirAssistant;
		}else{
			//should we explore parent directory
			const dirParent = path.dirname( dir );
			if( !dirParent || dirParent == dir ){
				return null;
			}else if( dirParent ){
				return getAssistantStore( dirParent );
			}
		}
	} )
}