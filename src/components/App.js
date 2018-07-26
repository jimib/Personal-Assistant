// App.js
import React, {Component,Fragment} from 'react'
import { hot } from 'react-hot-loader'
import util from 'util'
import _ from 'lodash'

import { Button } from 'semantic-ui-react';

import Styles from './css/App.styl'
import { getEventTargetAttrs } from '../util/Event';

class App extends Component{

	state = {
		answers : [],
		questions : [],
		resolve : null,
		reject : null
	}

	componentDidMount(){
		console.log('componentDidMount', util.isFunction(window.onAppReady));
		window.ask = this.ask;
	}

	ask = ( questions ) => {
		return new Promise( ( resolve, reject ) => {
			this.setState({
				resolve,reject,questions,answers:[]
			})
		} );
	}

	onChoiceClick = ( evt ) => {
		const value = getEventTargetAttrs( evt, 'data-value' );
		this.setState({
			answers : _.concat( this.state.answers, value )
		}, ( ) => {
			const {answers,questions,resolve} = this.state;
			if( answers.length >= questions.length ){
				var result = {};
				_.each( questions, ( question, index ) => {
					result[question.name] = answers[index];
				} );
				resolve( result );
			}
		} )
	}

	render(){
		const {questions,answers} = this.state;
		const question = questions[answers.length];

		return <div className={Styles.container}>
			<p>{questions.length}: {answers.length}: {JSON.stringify(question)}</p>
			<img className={Styles.header} src='assets/assistant.png' />
			{ !util.isNullOrUndefined( question ) && (
				<Fragment>
				<h1>{question.message}</h1>
				<ul>
					{_.map(question.choices, (choice, index) => {
						return <li><Button key={index} data-value={choice.value} content={choice.name} onClick={this.onChoiceClick} /></li>
					} )}
				</ul>
				</Fragment>
			) }
			
		</div>
	}
}

export default hot(module)(App);