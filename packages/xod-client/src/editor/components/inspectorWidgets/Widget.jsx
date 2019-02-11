import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { KEYCODE } from '../../../utils/constants';
import { noop } from '../../../utils/ramda';
import deepSCU from '../../../utils/deepSCU';
import { NODE_PROPERTY_KIND } from '../../../project/constants';

const commonKeyDownHandlers = {
  [KEYCODE.ESCAPE]: function escape(event) {
    if (this.state.value === this.props.value) {
      event.target.blur();
    } else {
      this.updateValue(this.props.value);
    }
  },
};

class Widget extends React.Component {
  constructor(props) {
    super(props);

    const { value, keyDownHandlers } = props;

    this.state = {
      value,
    };

    // Store latest commited value (or parsed value)
    // to avoid double dispatching of updating property
    this.lastCommitedValue = value;

    this.keyDownHandlers = R.compose(
      R.map(fn => fn.bind(this)),
      R.merge(commonKeyDownHandlers)
    )(keyDownHandlers);

    this.onChange = this.onChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  componentWillUnmount() {
    this.commit();
  }

  onBlur() {
    this.commit();
  }
  onChange(value) {
    this.updateValue(value);
  }
  onKeyDown(event) {
    const keycode = event.keycode || event.which;
    if (this.keyDownHandlers[keycode]) {
      this.keyDownHandlers[keycode].call(this, event);
    }
  }

  isDisabled() {
    return this.props.kind === NODE_PROPERTY_KIND.PIN && this.props.isConnected;
  }

  updateValue(value) {
    const commitCallback = this.props.commitOnChange
      ? this.commit.bind(this)
      : noop;

    this.setState({ value }, commitCallback);
  }

  commit() {
    // Prevent of commiting widgets without changes provided by User
    // E.G.
    // User changed one of few widgets, but all of them will be
    // unmnounted, so they try to commit values. Commit function parses
    // and converts value into literal, so it could differ from initial value.
    // This check will avoid unwanted commits.
    if (this.state.value === this.lastCommitedValue) return;

    const parsedValue = this.props.normalizeValue(this.state.value);

    // Prevent of commiting value twice on blur and on unmnount in widgets
    // that have a differences in `state.value` and `parsedValue`.
    // E.G.
    // Strings are represented in the inputs just as string 'hello'
    // But parsed value will be '"hello"'.
    if (parsedValue === this.lastCommitedValue) {
      // New parsed value could be dropped to default value if User
      // typed some wrong data. To avoid keep wrong data in the input
      // we have to update state of the component.
      // E.G.
      // Number widget has value: `0`
      // User typed: `bla-bla-bla` and it's not valid for Number type
      // We have to drop it back to the `0` value.
      this.setState({
        value: this.lastCommitedValue,
      });
      return;
    }

    // Store last commited value to avoid commiting the same value twice.
    this.lastCommitedValue = parsedValue;

    this.props.onPropUpdate(
      this.props.entityId,
      this.props.kind,
      this.props.keyName,
      parsedValue
    );
  }

  render() {
    const Component = this.props.component;

    const restProps = R.omit(
      [
        'children',
        'component',
        'onPropUpdate',
        'normalizeValue',
        'commitOnChange',
        'keyDownHandlers',
      ],
      this.props
    );

    return (
      <div className="InspectorWidget">
        <Component
          {...restProps}
          elementId={`widget_${this.props.keyName}`}
          value={this.state.value}
          disabled={this.isDisabled()}
          focused={this.props.focused && !this.isDisabled()}
          onBlur={this.onBlur}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
        />
      </div>
    );
  }
}

Widget.propTypes = {
  entityId: PropTypes.string.isRequired,
  keyName: PropTypes.string.isRequired, // one of NODE_PROPERTY_KEY or pin key
  kind: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.array,
  ]),
  isConnected: PropTypes.bool,
  focused: PropTypes.bool,
  component: PropTypes.func, // a `class` which we're making to extend React.Component is also a function
  keyDownHandlers: PropTypes.objectOf(PropTypes.func),
  commitOnChange: PropTypes.func,
  normalizeValue: PropTypes.func,
  // dispatchers
  onPropUpdate: PropTypes.func.isRequired,
};

Widget.defaultProps = {
  className: '',
  value: '',
  focused: false,
  isConnected: false,
  keyDownHandlers: {},
  normalizeValue: R.identity,
  onPropUpdate: noop,
  onPinModeSwitch: noop,
};

export default Widget;
