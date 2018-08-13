// App.js
import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { hot } from 'react-hot-loader'
import util from 'util'
import _ from 'lodash'

import { Button, Form, Checkbox, Radio } from 'semantic-ui-react';

import $ from 'jquery';

import Styles from './css/App.styl'
import { getEventTargetAttrs } from '../util/Event';

import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/javascript';
import 'brace/theme/dracula';

class App extends Component {

	state = {
		answers: [],
		questions: [
			{
				type: 'code',
				name: 'q5',
				options: {
					value : `
it('Should ', () => {
	return Promise.resolve()
	.then( ( result ) => {
		console.assert( result, 'Expected a result' );
	} );
})`,
					line : 2,
					column : 11
				}
			},
			{
				type: 'select',
				name: 'q1',
				message : 'What do you want?',
				options: {
					multiselect: false,
					items: [
						{label : 'Option 1', value: 1},
						{label : 'Option 2', value: 2},
						{label : 'Option 3', value: 3},
						{label : 'Option 4', value: 4},
						{other: true},
					]
				}
			},
			{
				type: 'select',
				name: 'q2',
				options: {
					multiselect: true,
					items: [
						{label : 'Option 1', value: 1},
						{label : 'Option 2', value: 2},
						{label : 'Option 3', value: 3},
						{label : 'Option 4', value: 4},
						{label : 'Other', other: true},
					]
				}
			},
			{
				type: 'password',
				name: 'q4'
			},
			{
				type: 'input',
				name: 'q3'
			},
			{
				type: 'code',
				name: 'q5',
				options: {
					value : `
it('Should ', () => {
	return Promise.resolve()
	.then( ( result ) => {
		console.assert( result, 'Expected a result' );
	} );
})`,
					line : 2,
					column : 11
				}
			}
		],
		resolve: ( answers ) => console.log(`Complete`, answers),
		reject: ( err ) => console.error('Error', err)
	}

	componentDidMount() {
		//expose our ask method to the window so that puppeteer can call it
		window.ask = this.ask;
	}

	ask = (questions) => {
		console.log('Ask',  questions);
		return new Promise((resolve, reject) => {
			this.setState({
				resolve, reject, questions, answers: []
			})
		});
	}

	onAnswer = ( answer ) => {
		const {questions, resolve} = this.state;
		//add the answer to the stack
		let answers = _.clone( this.state.answers );
		answers.push( answer );
		
		//apply the answer
		this.setState(
			{answers}, 
			() => {
				//respond to the change
				if( _.size( answers ) >= _.size( questions ) ){
					const result = _.map( questions, (question, index ) => {
						return {
							name:question.name,
							value:answers[index]
						}
					} );

					resolve( _.mapValues( _.keyBy( result, 'name' ), 'value' ) );
				}
			} 
		);

	}

	renderQuestion( question ){
		if( !util.isNullOrUndefined( question ) ){
			const {name} = question; 
			switch( question.type ){
				case 'select':
					return <QuestionSelect key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
				case 'input':
					return <QuestionInput key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
				case 'password':
					return <QuestionInput key={name} name={name} type='password' options={question.options} onAnswer={this.onAnswer} />
				break;
				case 'code':
					console.log('code');
					return <QuestionCode key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
				default:
					return <QuestionInput key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
			}
		}
	}

	render() {
		const { questions, answers } = this.state;
		const question = questions[ _.size( answers ) ];

		return <div className={Styles.container}>
			{ question && question.message ? <h1>{question.message}</h1> : null }
			{this.renderQuestion( question )}
		</div>
	}
}

export default hot(module)(App);

class Question extends Component{

	render(){
		return <p>Overwrite this render function</p>
	}
}

Question.propTypes = {
	options : PropTypes.object
}

Question.defaultProps = {
	options : {}
}

class QuestionSelect extends Question{
	state = {
		values : [],
		other : null
	}

	onSelect = ( evt, {value} ) => {
		const {options={}} = this.props;
		const {multiselect=true} = options;

		let values = _.clone( this.state.values );
		if( _.includes( values, value ) ){
			values = _.without( values, value );
		}else{
			if( multiselect ){
				values.push( value );
			}else{
				values = [value];
			}
		}

		this.setState({values});
	}

	onAnswer = ( evt ) => {
		const {values} = this.state;
		
		const {options={},onAnswer} = this.props;
		const {multiselect=true} = options;
		
		if( multiselect ){
			onAnswer( values );
		}else{
			onAnswer( _.first( values ) );
		}
	}
	
	onChangeOther = ( evt, info={} ) => {
		const {value=''} = info;
		this.setState({
			other: value
		})
	}

	render(){
		const {options={}} = this.props;
		const {multiselect=true} = options;

		const {values, other} = this.state;
		const {items} = options;

		const Input = multiselect ? Checkbox : Radio;

		return (
			<div className={Styles.select}>
				{_.map(items, (item, index) => {
					item = util.isString( item ) ? {name:item,value:item} : item;
					return (
					<Form.Field key={index}>
						<Input label={item.label || item.name} value={item.value} checked={_.includes(values,item.value)} onChange={this.onSelect} />
						{item.other ? <Form.Input value={other||''} onFocus={this.onChangeOther} onChange={this.onChangeOther} placeholder={'Other:'} /> : <Button data-value={item.value} onClick={this.onAnswer} icon='arrow right' /> }
					</Form.Field>
					)
				})}
				{values.length > 0 ? <Button primary content='Submit' onClick={this.onAnswer} /> : null }
			</div>
		)
	}
}

class QuestionInput extends Question{
	state = {
		value : ''
	}

	onChange = ( evt ) => {
		this.setState({
			value : $( evt.currentTarget ).val()
		})
	}

	onAnswer = ( evt ) => {
		const {value} = this.state;
		const {options={},onAnswer} = this.props;
		console.log('onAnswer', value);
		onAnswer( value );
	}

	render(){
		const {value} = this.state;
		const {options, type='input'} = this.props;
		
		return (
			<div className={Styles.input}>
				<input type={type} value={value} onChange={this.onChange} />
				{ _.size( value ) > 0 ? <Button primary content='Submit' onClick={this.onAnswer} /> : null }
			</div>
		)
	}
}

class QuestionCode extends Question{
	state = {
		value : '',
		editor : {}
	}

	componentWillReceiveProps( props ){
		if( props.value != this.props.value ){
			this.updateValue( props.value );
		}
	}
	
	componentDidMount( ){
		this.updateValue( this.props.value );
		this.initEditor();
	}
	
	resetComponent( options ){
		console.log('resetComponent', options );
		const {value='',line=0,column=0} = options;
	}

	initEditor(){
		const {line = 1,column = 1} = this.props.options;
		this.ace.editor.focus();
		this.ace.editor.gotoLine(line,column);	
		this.ace.editor.commands.addCommand({
			name: "myCommand",
			bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
			exec: () => {
				this.onAnswer();
			}
		});
	}
	
	updateValue( value ){
		this.setState({
			value
		}, () => {
			let editor = {
				numLinesPre : this.acePre.editor.getSession().getScreenLength(),
				numLines : this.ace.editor.getSession().getScreenLength(),
				numLinesPost : this.acePost.editor.getSession().getScreenLength(),
				lineHeight : this.ace.editor.renderer.lineHeight
			}
			
			//this.ace.editor.setOption("autoScrollEditorIntoView", true);
			this.ace.editor.setOption("firstLineNumber", 1 + editor.numLinesPre);
			this.acePost.editor.setOption("firstLineNumber", 1 + editor.numLinesPre + editor.numLines);
			
			this.acePre.editor.setOption('showLineNumbers', false);
			this.ace.editor.setOption('showLineNumbers', false);
			this.acePost.editor.setOption('showLineNumbers', false);
			
			this.acePre.editor.setOption("useWorker", false);
			this.acePost.editor.setOption("useWorker", false);
			
			this.setState({editor});
		} );
	}
	
	onChange = ( value ) => {
		this.updateValue(value);
	}
	
	onAnswer = () => {
		const annotations = this.ace.editor.getSession().getAnnotations();

		const numErrors = _.size( _.filter( annotations, {type:'error'} ) );
		const numWarnings = _.size( _.filter( annotations, {type:'warning'} ) );

		console.log( numErrors, numWarnings );
		if( numErrors + numWarnings == 0 || confirm(`There are ${numErrors} errors and ${numWarnings} warnings. Are you sure you want to commit?`) ){
			//either no issues or the user has decided to push on
			const {value} = this.state;
			const {options={},onAnswer} = this.props;
			onAnswer( value );
		}
		
	}
	
	render(){
		const {value,editor} = this.state;
		const {options, type='input'} = this.props;

		const {numLinesPre = 0, numLinesPost = 0, numLines = 1, lineHeight = 16} = editor || {};

		return (
			<div className={Styles.code}>
				<AceEditor
					ref={ref=>this.acePre=ref}
					mode="javascript"
					theme="dracula"
					name="editor-pre"
					width={'100%'}
					height={`${numLinesPre*lineHeight}px`}
					style={{opacity:0.5,pointerEvents:'none'}}
					value={'intro...'}
					/>
				<AceEditor
					ref={ref=>this.ace=ref}
					mode="javascript"
					theme="dracula"
					onChange={this.onChange}
					name="editor"
					width={'100%'}
					height={`${numLines*lineHeight}px`}
					value={value}
					/>
				<AceEditor
					ref={ref=>this.acePost=ref}
					mode="javascript"
					theme="dracula"
					name="editor-post"
					width={'100%'}
					height={`${numLinesPost*lineHeight}px`}
					style={{opacity:0.5,pointerEvents:'none'}}
					value={'outro....\n\n\n'}
				/>
				<Button primary content='Submit' onClick={this.onAnswer} />
			</div>
		)
	}
}

