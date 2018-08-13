import React from 'react';
import PropTypes from 'prop-types';
import { PixelComponent } from '@pixel-inspiration/react-libs/components';
import { ClassNames } from '@pixel-inspiration/react-libs/common';
import { hot } from 'react-hot-loader';

import Styles from './css/Button.styl';

class Button extends PixelComponent{
	
	/**
	 * @memberOf Button
	 * @constructs
	 * @param {object} props 
	 */
	constructor(props){
		super(props);
		this.state = {
		}
	}

	/**
	 * @memberOf Button
	 * @function onClick
	 * @prop {Event}
	 * @returns null
	 */
	onClick = (evt) => {
	}

	/**
	 * @memberOf Button
	 * @function render
	 * @returns {JSXElement}
	 */
	render(props){
		var {data,className} = this.props;
		return (<div className={ClassNames(Styles.container,className)}>
			{JSON.stringify(data)}
		</div>)
	}
}

Button.propTypes = {
	className : PropTypes.string,
	//data : PropTypes.object.isRequired,
	//items : PropTypes.array.isRequired,
	//onClick : PropTypes.func.isRequired
}

Button.defaultProps = {
	//onClick : () => console.warn('onClick has not been implemented'),
}

export default hot(module)(Button);
export {Button,Styles as ButtonStyles};
