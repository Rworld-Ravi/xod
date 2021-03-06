import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { foldEither, foldMaybe, maybePath } from 'xod-func-tools';
import { NODE_CORNER_RADIUS } from '../../nodeLayout';

const INPUT_PINKEY = '__in__';
const OUTPUT_PINKEY = '__out__';

const getDeducedTypeOfPin = R.curry((pinkey, pins) =>
  R.compose(
    foldMaybe('generic', R.identity),
    R.map(foldEither('error', R.identity)),
    maybePath([INPUT_PINKEY, 'deducedType'])
  )(pins)
);

const JumperNodeBody = ({ pins }) => {
  const inConnected = R.path([INPUT_PINKEY, 'isConnected'], pins);
  const outConnected = R.path([OUTPUT_PINKEY, 'isConnected'], pins);

  const type = R.cond([
    [() => inConnected, getDeducedTypeOfPin(INPUT_PINKEY)],
    [() => outConnected, getDeducedTypeOfPin(OUTPUT_PINKEY)],
    [R.T, R.always('generic')],
  ])(pins);

  const isConnected =
    inConnected || outConnected ? 'is-connected' : 'not-connected';

  return (
    <g>
      <rect
        className="clickable-area"
        width="100%"
        height="100%"
        rx={NODE_CORNER_RADIUS}
        ry={NODE_CORNER_RADIUS}
      />
      <line
        className={classNames('jumper-line', type, isConnected)}
        x1="50%"
        y1="0"
        x2="50%"
        y2="100%"
      />
    </g>
  );
};

JumperNodeBody.propTypes = {
  pins: PropTypes.object,
};

export default JumperNodeBody;
