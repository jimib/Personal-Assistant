import React from 'react';
import PropTypes from 'prop-types';
import { PixelComponent } from '@pixel-inspiration/react-libs/components';
import { ClassNames } from '@pixel-inspiration/react-libs/common';
import { hot } from 'react-hot-loader';

import Styles from './css/{{name}}Component.styl';

class {{name}}Component extends PixelComponent{
	
	/**
	 * @memberOf {{name}}
	 * @constructs
	 * @param {object} props 
	 */
	constructor(props){
		super(props);
		this.state = {
		}
	}

	/**
	 * @memberOf {{name}}Component
	 * @function onClick
	 * @prop {Event}
	 * @returns null
	 */
	onClick = (evt) => {
	}

	/**
	 * @memberOf {{name}}Component
	 * @function render
	 * @returns {JSXElement}
	 */
	/*START:RENDER*/
	render(props){
		var {data,className} = this.props;
		return (<div className={ClassNames(Styles.container,className)}>
			{JSON.stringify(data)}
		</div>)
	}
	/*END:RENDER*/
}

/*START:PROPTYPES*/
{{name}}Component.propTypes = {
	className : PropTypes.string,
	//data : PropTypes.object.isRequired,
	//items : PropTypes.array.isRequired,
	//onClick : PropTypes.func.isRequired
}

{{name}}Component.defaultProps = {
	//onClick : () => console.warn('onClick has not been implemented'),
}
/*END:PROPTYPES*/

export default hot(module)({{name}}Component);
export { {{name}}Component,Styles as {{name}}Styles };