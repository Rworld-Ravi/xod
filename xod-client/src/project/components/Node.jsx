import R from 'ramda';
import React from 'react';
import classNames from 'classnames';
import Pin from './Pin';
import NodeText from './NodeText';
import { noop } from 'xod-client/utils/ramda';

import { SIZE } from '../constants';

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;

    this.pins = {};

    this.width = this.props.width;
    this.originalWidth = this.props.width;
    this.height = this.props.height;

    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onPinMouseUp = this.onPinMouseUp.bind(this);
  }

  componentDidMount() {
    this.updateNodeWidth();
  }

  shouldComponentUpdate(newProps) {
    return R.not(R.equals(newProps, this.props));
  }

  componentDidUpdate() {
    this.updateNodeWidth();
  }

  onMouseUp() {
    this.props.onMouseUp(this.id);
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.id);
  }

  onPinMouseUp(pinId) {
    this.props.onPinMouseUp(this.id, pinId);
  }

  getOriginPosition() {
    const position = R.clone(this.props.position);

    position.x -= SIZE.NODE.padding.x + (this.width / 2);
    position.y -= SIZE.NODE.padding.y + (this.height / 2);

    return position;
  }

  getRectProps() {
    return {
      width: this.width,
      height: this.height,
      x: SIZE.NODE.padding.x,
      y: SIZE.NODE.padding.y,
    };
  }

  getBlockProps() {
    return {
      x: 0,
      y: 0,
      width: this.getRectProps().width + (SIZE.NODE.padding.x * 2),
      height: this.getRectProps().height + (SIZE.NODE.padding.y * 2),
    };
  }

  getTextProps() {
    const rectSize = this.getRectProps();
    return {
      x: rectSize.x + rectSize.width / 2,
      y: rectSize.y + rectSize.height / 2,
    };
  }

  updateNodeWidth() {
    const nodeText = this.refs.text;
    const textWidth = nodeText.getWidth();
    let newWidth = textWidth + (SIZE.NODE_TEXT.margin.x * 2);

    if (newWidth < SIZE.NODE.minWidth) {
      newWidth = SIZE.NODE.minWidth;
    }
    if (this.width !== newWidth && newWidth >= this.originalWidth) {
      this.width = newWidth;
      this.forceUpdate();
    }
  }

  render() {
    const position = this.getOriginPosition();
    const pins = R.pipe(
      R.values,
      R.map(pin =>
        R.assoc('position', {
          x: pin.position.x - position.x,
          y: pin.position.y - position.y,
        }, pin)
      )
    )(this.props.pins);
    const textPosition = this.getTextProps();

    const cls = classNames('Node', {
      'is-selected': this.props.isSelected,
      'is-ghost': this.props.isGhost,
    });

    return (
      <svg
        className={cls}
        {...position}
        key={this.id}
        onMouseDown={this.onMouseDown}
      >
        <g
          onMouseOver={this.handleOver}
          onMouseOut={this.handleOut}
          onMouseUp={this.onMouseUp}
        >
          <rect className="body" {...this.getRectProps()} ref="rect" />
          <NodeText
            ref="text"
            position={textPosition}
            label={this.props.label}
          />
        </g>
        <g className="pinlist">
          {pins.map((pin) =>
            <Pin
              nodeId={this.id}
              keyName={pin.key}
              key={pin.key}
              {...pin}
              onMouseUp={this.onPinMouseUp}
            />
          )}
        </g>
      </svg>
    );
  }
}

Node.propTypes = {
  id: React.PropTypes.number.isRequired,
  label: React.PropTypes.string.isRequired,
  pins: React.PropTypes.any.isRequired,
  position: React.PropTypes.object.isRequired,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  isSelected: React.PropTypes.bool,
  isGhost: React.PropTypes.bool,
  onMouseUp: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
  onPinMouseUp: React.PropTypes.func,
};
Node.defaultProps = {
  width: SIZE.NODE.minWidth,
  height: SIZE.NODE.minHeight,
  isSelected: false,
  isGhost: false,
  onMouseUp: noop,
  onMouseDown: noop,
  onPinMouseUp: noop,
};

export default Node;
