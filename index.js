const fs = require('fs-extra-promise');
const path = require('path');
const _ = require('lodash');
const util = require('util');
const Promise = require('bluebird');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const DIR_PROMPT = path.resolve('.');

const ACTIONS = Object.freeze({
	EXIT : 'ACTION:EXIT'
})


//look for an assistant directory
getAssistantStores( DIR_PROMPT )
.then( dirs => {
	if( _.isEmpty( dirs ) ){
		throw new Error('Assistant Store could not be found');
	}
	
	new Assistant( dirs );
} )

function Assistant( dirStores ){
	//variables
	this.dirStores = dirStores;
	this.tasks = {};
	this.tasksCompleted = [];

	return this.init()
	.then( result => {
		return Promise.mapSeries( dirStores, dirStore => {
			return this.list( dirStore, {extensions:['.js']} )
			.then( items => _.map( items, item => path.join( dirStore, item ) ) );
		} )
		.then( result => _.flatten( result ) );
	})
	/*.then( scripts => {
		//const pathToList = path.resolve( this.currentTask.dir, 'list.json' ) ;
		return fs.existsAsync( pathToList )
		.then( listExists => {
			if( listExists ){
				//load in the list and reorder scripts based on that
				return fs.readJSONAsync( pathToList )
				.then( list => {
					let iscripts = [];
					//rearrange the script
					_.each( list, item => {
						if( !path.extname( item ) ){
							item = `${item}.js`
						}

						//add this in at the start of iscripts - if it exists in scripts
						if( _.includes( scripts, item ) ){
							//move the items
							iscripts.push( item );
							scripts = _.without( scripts, item );
						}
					} )
					//combine the lists
					return _.concat( iscripts, scripts );
				} );

			}else{
				return scripts;
			}
		} )
	})*/
	.then( scripts => {

		//loop each script and get a list of tasks
		_.each( scripts, script => {
			const id = path.basename( script, path.extname( script ) );
			const refTask = this.tasks[id] = {
				id, 
				script, 
				dir:path.dirname(script) 
			};
			
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
			console.log('requiring', script);
			try{
				require( path.resolve( script ) );
			}catch( err ){
				console.error('Error with script', err);
			}
			
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

Assistant.prototype.init = async function(){
	this.browser = await puppeteer.launch(
		{
			headless:false,
			devtools:false,
			//defaultViewport : {width:300,height:500},
			args: ['--disable-infobars']
		}
	);
	this.popup = await this.browser.pages().then( pages => _.first( pages ) );
	await this.popup.goto( `file:${path.resolve( __dirname, 'dist', 'index.html')}` );
	
	//await this.popup.goto('http://localhost:8080/index.html');
	return Promise.delay( 500 );
}

Assistant.prototype.services = function( message ){
	return this.choose( message || 'What can I do for you?', _.concat(
		_.map( this.tasks, ( task, id ) => ({label:task.name,value:id}) ),
		{label:'Exit',color:'red',value:ACTIONS.EXIT }
	) )
	.then( answer => {
		switch( answer ){
			case ACTIONS.EXIT:
				process.exit();
			break;
			default:
				this.start( answer );
			break;
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
			type : 'choose',
			options : {
				items: choices
			}
		}
	])
	.then( result => result.choice );
}

Assistant.prototype.ask = function( questions ){
	return this.popup.evaluate( (questions) => {
		return window.ask( questions );
	}, questions )
	.catch( err => {
		console.log( err );
	} );
}


Assistant.prototype.start = function( id, options = {} ){
	console.log('start', id, options);
	//this.status.updateBottomBar(`Task: ${this.tasks[id].name}`)
	if( this.currentTask ){
		throw new Error(`Task '${this.currentTask.id}' is still running`);
	}else if( !id ){
		throw new Error('Task id required');
	}else{
		this.currentTask = _.assign(options || {},this.tasks[id]);
		const promise = this.currentTask.func( this, options );

		if( !util.isNullOrUndefined( promise ) ){
			if( util.isFunction( promise.then ) ){
				//wait until it completes
				promise.then( result => {
					console.log('completed', result);
					completedCurrentTask();
					//check for additional task
					checkForTask( result );
				} )
				.catch( err => console.error('Unable to complete task', err ) );
			}else{
				completedCurrentTask();
				checkForTask( promise );
			}
		}
	}

	const completedCurrentTask = () => {
		console.log('completedCurrentTask');
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
			this.services( 'Anything else I can do for you?' );
		}
	}
}

Assistant.prototype.find = function( file, search ){
	search = new RegExp( search, 'g' );

	file = path.resolve( DIR_PROMPT, file );
	return fs.existsAsync( file )
	.then( exists => {
		return !exists ? [] : 
		fs.readFileAsync( file )
		.then( data => {
			const results = [];
			let index = 0;
			let match = null;
			while( match = search.exec( data ) ){
				results.push({
					file,match
				});
			}
			return results;
		} )
	} )
}

Assistant.prototype.findOne = function( file, search ){
	return this.find( file, search )
	.then( results => _.first( results ) );
}

Assistant.prototype.search = function( dir, search, options={} ){
	return this.list( dir, options )
	.then( files => {
		return Promise.mapSeries( files, file => this.find( path.resolve( dir, file ), search ) );
	} )
	.then( results => _.filter( _.flatten( results ) ) );
}

Assistant.prototype.list = function( dir = '', options = {} ){
	const pathToSearch = path.resolve( DIR_PROMPT, dir );
	console.log('list', pathToSearch );
	//retrieve a list of tasks
	return fs.readdirAsync( pathToSearch )
	//filter out any non-scripts
	.then( scripts => {
		//console.log();
		return !options.extensions ? scripts : 
		_.filter( scripts, script => {
			return _.includes( options.extensions, path.extname(script) )
		})
	})
}

Assistant.prototype.render = function( template, options={} ){
	//where is the template
	const pathToTemplate = path.resolve( this.currentTask.dir, template );

	return fs.readFileAsync( pathToTemplate, 'utf8' )
	.then( templateContent => {
		//create contents from the file
		return Handlebars.compile( templateContent )( options );
	} );	
}

Assistant.prototype.template = function( target, template, options={} ){
	//where is the template
	const pathToTemplate = path.resolve( this.currentTask.dir, template );
	const pathToTarget = path.resolve( DIR_PROMPT, target );

	return fs.existsAsync( pathToTarget )
	.then( exists => {
		if( exists ){
			throw new Error(`'${target}' already exists!`);
		}else{
			return this.render( template, options )
			//make sure the directory exists before we continue
			.then( content => fs.ensureDirAsync( path.dirname( pathToTarget ) ).then( result => content ) )
			//write out the file
			.then( content => fs.writeFileAsync( pathToTarget, content ) );
		}
	} )
	
}

Assistant.prototype.templateInsert = function( target, index, template, options={} ){
	//where is the template
	const pathToTemplate = path.resolve( this.currentTask.dir, template );

	return fs.readFileAsync( pathToTemplate, 'utf8' )
	.then( templateContent => {
		return Handlebars.compile( templateContent )( options );
	} )
	.then( content => this.insert( target, index, content ) );
}

Assistant.prototype.editCodeBlock = function( target, blockName, options = {} ){
	return fs.readFileAsync( target, 'utf8' )
	.then( codeContent => {
		const codeLines = codeContent.split('\n');
		const indexStart = _.findIndex( codeLines, (line, index) => {
			return (line.indexOf(`START:${blockName}`) > -1 ? true : false );
		});
		const indexEnd = _.findIndex( codeLines, (line, index) => {
			return (line.indexOf(`END:${blockName}`) > -1 ? true : false );
		});

		if( indexStart > -1 && indexEnd > -1 ){
			const codeEdit = _.slice( codeLines, indexStart + 1, indexEnd ).join('\n');
			return this.ask([
				{
					message : `Edit '${path.basename(target)} [${blockName}]'`,
					type: 'code',
					name: 'code',
					options: {
						value : codeEdit,
						language : options.language
					}
				}
			])
			.then( result => {
				const {code} = result;
				const output = `${_.slice( codeLines, 0, indexStart + 1 ).join('\n')}
${code}
${_.slice( codeLines, indexEnd ).join('\n')}`

				return fs.writeFileAsync( target, output, 'utf8');
			} )
		}else{
			return null;
		}
	} )
}

Assistant.prototype.editCode = function( target, options = {} ){
	return fs.readFileAsync( target, 'utf8' )
	.then( codeContent => {
		return this.ask([
			{
				message : `Edit '${path.basename(target)}'`,
				type: 'code',
				name: 'code',
				options: {
					value : codeContent,
					language : options.language
				}
			}
		])
		.then( result => {
			const {code} = result;
			return fs.writeFileAsync( target, code, 'utf8');
		} )
	} )
}

Assistant.prototype.insertCodeBlock = function( target, blockName, code, options = {} ){
	return fs.readFileAsync( target, 'utf8' )
	.then( codeContent => {
		const codeLines = codeContent.split('\n');
		let indexInject = _.findIndex( codeLines, (line, index) => {
			return (line.indexOf(`INJECT:${blockName}`) > -1 ? true : false );
		});

		indexInject = indexInject == -1 ? _.size( codeLines ) : indexInject;
		this.insert( target, indexInject, code );
	} )
}

Assistant.prototype.prepend = function( target, content ){
	this.insert( target, 0, content );
}

Assistant.prototype.append = function( target, content ){
	this.insert( target, 0, content );
}

Assistant.prototype.insert = function( target, index, insert ){
	//where is the template
	const pathToTarget = path.resolve( DIR_PROMPT, target );

	return fs.readFileAsync( pathToTarget, 'utf8' )
	.then( content => {
		//count from the end of the file
		if( index < 0 ){
			index = content.length + index;
		}

		content = `${content.substring( 0, index )}${insert}${content.substring( index )}`;
		return fs.writeFileAsync( pathToTarget, content );
	} );
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
/*
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
				return getAssistantStores( dirParent );
			}
		}
	} )
}*/

function getAssistantStores( dir ){
	dir = path.resolve( dir );
	const dirParts = dir.split( path.sep );
	const numParts = _.size( dirParts );
	return Promise.mapSeries( _.times( numParts ), ( index ) => {
		return Promise.resolve( numParts - index )
		.then( end => _.slice( dirParts, 0, end ).join( path.sep ) )
		.then( dir => getProjectTasks( dir ) )
	} )
	.then( result => {
		return _.uniq( _.flatten( result ) )
	})
	/*
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
				return getAssistantStores( dirParent );
			}
		}
	} )
	*/
}

function getProjectTasks( dir ){
	return new Promise( ( resolve, reject ) => {
		const pathToPackage = path.resolve( dir, 'package.json' );
		return fs.existsAsync( pathToPackage )
		.then( exists => {
			return !exists ? [] : fs.readJSONAsync( pathToPackage )
			.then( data => {
				const {assistant} = data;
				const {tasks} = assistant || {};
				
				return _.isEmpty( tasks ) ? [] : Promise.mapSeries( tasks, task => {
					return path.resolve( dir, task );
				} );
			} )
		} ) 
		.then( resolve )
	} );
}