import $ from 'jquery';

export function getEventTargetAttrs( evt ){
	var target = evt.currentTarget;
	var $target = $( target );
	var result = {};

	for( var i = 1; i < arguments.length; i++ ){
		var id = arguments[i];
		var prop = id.split('data-').join('');
		switch( id ){
			case 'value':
				result[prop] = target.type === 'checkbox' ? target.checked : $target.val();
			break;
			default:
				result[prop] = $target.attr( id );		
			break;
		}
	}

	return result;
}