import { connect } from 'react-redux';

import {{name}}Component from '../components/{{name}}Component';

//START:MAP_PROPS
const mapStateToProps = state => ({
	items : state.items
});
//END:MAP_PROPS

//START:MAP_DISPATCH
const mapDispatchToProps = dispatch => ({
	//onInit : ( ) => {
	//	return dispatch( loadItems() )
	//}
});
//END:MAP_DISPATCH

export default connect(
	mapStateToProps,
	mapDispatchToProps
)( 
	{{name}}Component
);
