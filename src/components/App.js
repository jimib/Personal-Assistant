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
import HotKeys from 'react-hot-keys';

import 'brace/mode/javascript';
import 'brace/theme/dracula';

const KEYS_SUBMIT = 'command+enter,ctrl+enter';
class App extends Component {

	state = {
		enabled: true,
		acceptedAnswer : false,
		answers: [],
		questions: [],
		resolve: ( answers ) => console.log(`Complete`, answers),
		reject: ( err ) => console.error('Error', err)
	}

	componentDidMount() {
		//expose our ask method to the window so that puppeteer can call it
		window.ask = this.ask;

		setTimeout( () => {
			if( _.isEmpty( this.state.questions ) ){
				this.ask( DEMO_QUESTIONS );
			}
		}, 1000 );
	}

	ask = (questions) => {
		console.log('Ask',  questions);
		return new Promise((resolve, reject) => {
			this.setState({
				resolve, reject, questions, answers: [], acceptedAnswer: false
			})
		});
	}

	onAnswer = ( answer ) => {
		const {questions, resolve, enabled, acceptedAnswer} = this.state;

		console.log('onAnswer', enabled, acceptedAnswer );
		//we are using the keyboard and the answer is already given
		if( !enabled && acceptedAnswer )return;
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

	onReleaseSubmit = () => {
		SubmitButton.enabled = true;
	}

	renderQuestion( question ){
		if( !util.isNullOrUndefined( question ) ){
			const {name} = question; 
			switch( question.type ){
				case 'alert':
					return <Alert key={name} message={question.message} onAnswer={this.onAnswer} />
				break;
				case 'multiselect':
					return <QuestionMultiSelect key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
				case 'choose':
					return <QuestionChoose key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
				case 'code':
					return <QuestionCode key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
				case 'password':
					return <QuestionInput key={name} name={name} type='password' options={question.options} onAnswer={this.onAnswer} />
				break;
				case 'input':
				default: //if type is undefined it's a simple question object that the QuestionInput can handle
					return <QuestionInput key={name} name={name} options={question.options} onAnswer={this.onAnswer} />
				break;
				/*
				default:
					throw new Error(`Unexpected question type '${question.type}'`);
				break;
				*/
			}
		}
	}

	render() {
		const { questions, answers, enabled } = this.state;
		const question = questions[ _.size( answers ) ];

		return <div className={ClassNames(Styles.container,enabled?Styles.enabled:Styles.disabled)}>
			{ question && question.message ? <h1>{question.message}</h1> : null }
			{this.renderQuestion( question )}
			{<HotKeys keyName={KEYS_SUBMIT} onKeyUp={this.onReleaseSubmit} />}
		</div>
	}
}

export default hot(module)(App);

class Alert extends Component{
	
	onDismiss = () => {
		this.props.onAnswer();
	}

	render(){
		const {message} = this.props;
		return <div className={Styles.alert}>
			<SubmitButton onSubmit={this.onDismiss} />
		</div>
	}
}

Alert.propTypes = {
	message : PropTypes.string
}

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

class QuestionMultiSelect extends Question{
	state = {
		values : []
	}

	componentDidMount(){
		this.initQuestion( );
	}
	
	initQuestion(){
		const {options = {}} = this.props;
		const values = _.filter( _.map( options.items, item => {
			return item.enabled ? item.value : null;
		} ) );
		this.setState({values});
	}

	onSelect = ( evt, {value} ) => {
		const {options={}} = this.props;

		let values = _.clone( this.state.values );
		if( _.includes( values, value ) ){
			values = _.without( values, value );
		}else{
			values.push( value );
		}

		this.setState({values});
	}

	onAnswer = ( evt ) => {
		const {values} = this.state;
		const {options={},onAnswer} = this.props;
		
		onAnswer( values );
	}
	
	render(){
		const {options={}} = this.props;

		const {values, other} = this.state;
		const {items} = options;
		return (
			<div className={Styles.select}>
				{_.map(items, (item, index) => {
					item = util.isString( item ) ? {name:item,value:item} : item;
					const label = item.label || item.name;
					switch( item.type ){
						case 'seperator':
							return <hr key={index} />
						break;
						case 'title':
						case 'header':
							return <h2 key={index}>{label}</h2>
						break;
						default:
							return (
							<Form.Field key={index}>
								<Checkbox label={label} value={item.value} checked={_.includes(values,item.value)} onChange={this.onSelect} />
							</Form.Field>
							)
						break;
					}
				})}
				<SubmitButton onSubmit={this.onAnswer} />
			</div>
		)
	}
}

class QuestionChoose extends Question{
	state = {
		values : []
	}

	componentDidMount(){
		this.initQuestion( );
	}
	
	initQuestion(){
	}

	onAnswer = ( evt, info ) => {
		const {value} = info.data;
		this.props.onAnswer( value );
	}
	
	onAnswerOther = ( value ) => {
		console.log('onAnswerOther', value);
		this.props.onAnswer( value );
	}
	
	render(){
		const {options={}} = this.props;

		const {values, other} = this.state;
		const {items,allowOther=false} = options;
		return (
			<div className={Styles.choose}>
				{_.map(items, (item, index) => {
					item = util.isString( item ) ? {label:item,value:item} : item;
					const label = item.label || item.name;
					return <Button key={index} color={item.color} className={Styles.button} fluid data={item} onClick={this.onAnswer} content={label} />
				})}
				{allowOther ? 
				<Fragment>
					<QuestionInput label='Other:' onAnswer={this.onAnswerOther} />
				</Fragment>
				: null }

			</div>
		)
	}
}

class QuestionInput extends Question{
	state = {
		value : ''
	}

	componentDidMount = () => {
		this.initQuestion();
		if( this.props.options && this.props.options.value ){
			this.setState({
				value: this.props.options.value
			})
		}
	}

	initQuestion = () => {

	}

	onChange = ( evt ) => {
		this.setState({
			value : $( evt.currentTarget ).val()
		})
	}

	onAnswer = ( evt ) => {
		console.log('onAnswer');
		const {value} = this.state;
		const {options={},onAnswer} = this.props;
		onAnswer( value );
	}

	render(){
		const {value} = this.state;
		const {options, label, type='input'} = this.props;
		const {allowEmpty = false} = options;
		
		const disabled = allowEmpty || _.size(value) == 0 ? true : false;

		return (
			<div className={Styles.input}>
				<Form.Input autoFocus fluid label={label} type={type} value={value} onChange={this.onChange} />
				<SubmitButton disabled={disabled} onSubmit={this.onAnswer} />
			</div>
		)
	}
}

class QuestionCode extends Question{
	state = {
		value : '',
		valuePre : '',
		valuePost : '',
		editor : {}
	}

	componentWillReceiveProps( props ){
		if( props.options != this.props.options ){
			this.updateValue( props );
		}
	}
	
	componentDidMount( ){
		this.updateValue( this.props.options );
		this.initQuestion();
	}
	
	resetComponent( options ){
		console.log('resetComponent', options );
		const {value='',line=0,column=0} = options;
	}

	initQuestion(){
		const {line = 1,column = 1} = this.props.options;
		console.log( line, column );
		this.ace.editor.focus();
		setTimeout( () => {
			if( this.ace ){
				this.ace.editor.gotoLine(line,column);
			}
		}, 10 );
	}
	
	updateValue( {value,valuePre,valuePost} ){
		console.log('updateValue', value, valuePre, valuePost, this.props.options);
		this.setState({
			value,
			valuePre,
			valuePost
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

			/**
			 * SET THE AUTO COMPLETE
			 * var staticWordCompleter = {
				getCompletions: function(editor, session, pos, prefix, callback) {
					var wordList = ["foo", "bar", "baz"];
					callback(null, wordList.map(function(word) {
						return {
							caption: word,
							value: word,
							meta: "static"
						};
					}));

				}
			}

			langTools.setCompleters([staticWordCompleter])
			// or 
			editor.completers = [staticWordCompleter]
			 */
			
			this.setState({editor});
		} );
	}
	
	onChange = ( value ) => {
		const {valuePre,valuePost} = this.state;
		this.updateValue({
			value,
			valuePre,
			valuePost
		});
	}
	
	onAnswer = () => {
		const annotations = this.ace.editor.getSession().getAnnotations();

		const numErrors = _.size( _.filter( annotations, {type:'error'} ) );
		const numWarnings = _.size( _.filter( annotations, {type:'warning'} ) );

		if( numErrors + numWarnings == 0 || confirm(`There are ${numErrors} errors and ${numWarnings} warnings. Are you sure you want to commit?`) ){
			//either no issues or the user has decided to push on
			const {value} = this.state;
			const {options={},onAnswer} = this.props;
			onAnswer( value );
		}
		
	}
	
	render(){
		const {value,valuePre,valuePost,editor} = this.state;
		const {options = {}, type='input'} = this.props;

		const {numLinesPre = 0, numLinesPost = 0, numLines = 1, lineHeight = 16} = editor || {};
		const {language = 'javascript'} = options;

		return (
			<div className={Styles.code}>
				<div className={Styles.editor}>
					<AceEditor
						ref={ref=>this.acePre=ref}
						mode={language}
						theme="dracula"
						name="editor-pre"
						width={'100%'}
						height={`${numLinesPre*lineHeight}px`}
						style={{opacity:0.5,pointerEvents:'none'}}
						value={valuePre || ''}
						/>
					<AceEditor
						ref={ref=>this.ace=ref}
						mode={language}
						theme="dracula"
						onChange={this.onChange}
						name="editor"
						width={'100%'}
						height={`${numLines*lineHeight}px`}
						value={value}
						/>
					<AceEditor
						ref={ref=>this.acePost=ref}
						mode={language}
						theme="dracula"
						name="editor-post"
						width={'100%'}
						height={`${numLinesPost*lineHeight}px`}
						style={{opacity:0.5,pointerEvents:'none'}}
						value={valuePost || ''}
					/>
				</div>
				<SubmitButton onSubmit={this.onAnswer} />
			</div>
		)
	}
}


class SubmitButton extends Component{

	onKeyDown = () => {
		const {disabled,onSubmit} = this.props;
		if( !disabled && !SubmitButton.enabled ){
			SubmitButton.enabled = false;
			this.props.onSubmit();
		}
	}
	
	onKeyUp = () => {
		SubmitButton.enabled = true;
	}

	render = ( ) => {
		const {disabled,onSubmit} = this.props;
		return <Fragment>
			{!disabled && <HotKeys keyName={KEYS_SUBMIT} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} />}
			<Button className={Styles.submit} primary disabled={disabled} content='Submit' onClick={onSubmit} />
		</Fragment>
	}
} 

SubmitButton.enabled = false;

SubmitButton.propTypes = {
	onSubmit : PropTypes.func.isRequired,
	disabled : PropTypes.bool
}

SubmitButton.defaultProp = {
	disabled : false
}

function ClassNames() {
	return _.filter(arguments, className => {
		return className ? true : false;
	}).join(' ');
}

const DEMO_QUESTIONS = [
	{
		type: 'alert',
		message : 'This is a dismissable alert'
	},
	{
		type: 'choose',
		name: 'q2',
		message : 'Choose',
		options: {
			allowOther: true,
			items: [
				{label : 'Option 1', value: 1},
				{label : 'Option 2', value: 2},
				{label : 'Option 3', value: 3},
				{label : 'Option 4', value: 4}
			]
		}
	},
	{
		type: 'multiselect',
		name: 'q1',
		message : 'Multiselect',
		options: {
			items: [
				{label : 'Option 1', value: 1, enabled: true},
				{label : 'Option 2', value: 2, enabled: true},
				{type : 'seperator'},
				{type : 'header',label:'Other'},
				{label : 'Option 3', value: 3},
				{label : 'Option 4', value: 4}
			]
		}
	},
	{
		message : 'Password',
		type: 'password',
		name: 'q4'
	},
	{
		message : 'Question',
		type: 'input',
		name: 'q3'
	},
	{
		message : 'Question with initial value',
		type: 'input',
		name: 'q4',
		options : {
			value : 'Is this prediction right?'
		}
	},
	{
		message : 'Code',
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
			column : 11,
			language : 'javascript'
		}
	}
]