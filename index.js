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
	this.completed = [];

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
		this.choose( 'What can I do for you?', _.map( this.tasks, ( task, id ) => ({name:task.name,value:id}) ) )
		.then( answer => {
			this.task( answer );
		} )
	} )
}

Assistant.prototype.choose = function( message, choices ){
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


Assistant.prototype.task = function( id, options = {} ){
	//this.status.updateBottomBar(`Task: ${this.tasks[id].name}`)
	this.completed.push({id,options})
	return this.tasks[id].func( this, options );
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