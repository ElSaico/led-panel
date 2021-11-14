import { testProp, fc } from 'ava-fast-check';

import LEDPanel from '../../src/index';

testProp.skip(
    'TODO: property-test led-panel',
    [
        // arbitraries
        fc.nat(),
    ],
    (
        t,
        // test arguments
        natural,
    ) => {
        // ava test here
    },
    {
        verbose: true,
    },
)
