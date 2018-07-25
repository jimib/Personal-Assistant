/**REDUCER {{name}} */
import produce from 'immer';
import util from 'util';

const INIT_STATE = {
}

const reducer = (state = INIT_STATE, action) => {
	if( util.isNullOrUndefined( action.type )  ){
		throw new Error('Undefined action type received');
	}
	return produce( state, state => {
		switch ( action.type ) {
			case {{handler}}:
				//state.x = action.x;
				return state;
			break;
		}
	});
	
}

export default reducer;