
describe('Test the command line interface', () => {
	it('Should assert ok', () => {
		require('../bin/assistant');
		console.assert( true, 'not ok' );
	} )
} );