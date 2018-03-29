import React from 'react';
import PropTypes from 'prop-types';
import {
  classToModules,
  getClassName,
  createBubbleEffect,
  toggleMoveClasses,
} from '../../helpers/components';

const ROOTELM = 'aws-btn';
const ANIMATION_DELAY = 100;

/**
TODO: Extend the setup with CSS custom properties;
export const AwesomeButtonSetup = (setup = {}) => {
};
*/

const Anchor = props => (<a {... props} />);
const Button = props => (<button {... props} />);

export default class AwesomeButton extends React.Component {
  static propTypes = {
    action: PropTypes.func,
    bubbles: PropTypes.bool,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    element: PropTypes.func,
    href: PropTypes.string,
    placeholder: PropTypes.bool,
    title: PropTypes.string,
    rootElement: PropTypes.string,
    moveEvents: PropTypes.bool,
    size: PropTypes.string,
    style: PropTypes.object,
    cssModule: PropTypes.object,
    className: PropTypes.string,
    target: PropTypes.string,
    to: PropTypes.string,
    type: PropTypes.string,
    visible: PropTypes.bool,
    active: PropTypes.bool,
    blocked: PropTypes.bool,
  };
  static defaultProps = {
    action: null,
    bubbles: false,
    blocked: false,
    cssModule: null,
    children: null,
    disabled: false,
    title: null,
    element: null,
    href: null,
    className: null,
    moveEvents: true,
    placeholder: false,
    rootElement: ROOTELM,
    size: null,
    style: {},
    target: null,
    to: null,
    type: 'primary',
    visible: true,
    active: false,
  };
  constructor(props) {
    super(props);
    this.rootElement = props.rootElement || ROOTELM;
    this.animationStage = 0;
    this.extraProps = {};
    this.state = {
      disabled: props.disabled || (props.placeholder && !props.children),
    };
    this.checkProps(props);
  }
  componentDidMount() {
    this.container = this.button && this.button.parentNode;
  }
  componentWillReceiveProps(newProps) {
    this.checkPlaceholder(newProps);
    this.checkProps(newProps);
    this.checkActive(newProps);
  }
  getRootClassName() {
    const { rootElement } = this;
    const {
      type,
      size,
      placeholder,
      children,
      visible,
      cssModule,
    } = this.props;
    const {
      disabled,
      pressPosition,
    } = this.state;
    const className = [
      this.rootElement,
      type && `${rootElement}--${type}`,
      size && `${rootElement}--${size}`,
      visible && `${rootElement}--visible`,
      (placeholder && !children && `${rootElement}--placeholder`) || null,
    ];
    if (disabled === true) {
      className.push(`${rootElement}--disabled`);
    }
    if (pressPosition) {
      className.push(pressPosition);
    }
    if (this.props.className) {
      className.push(...this.props.className.split(' '));
    }
    if (cssModule && cssModule['aws-btn']) {
      return classToModules(className, cssModule);
    }
    return className.join(' ').trim().replace(/[\s]+/ig, ' ');
  }
  checkActive(newProps) {
    if (newProps.active !== this.props.active) {
      if (newProps.active === true) {
        this.setState({
          pressPosition: `${this.rootElement}--active`,
        });
      } else {
        this.clearPress(true);
      }
    }
  }
  checkProps(newProps) {
    const {
      to,
      href,
      target,
      element,
    } = newProps;
    this.extraProps.to = to || null;
    this.extraProps.href = href || null;
    this.extraProps.target = target || null;
    this.renderComponent = element || (this.props.href ? Anchor : Button);
  }
  checkPlaceholder(newProps) {
    const { disabled, placeholder, children } = newProps;
    if (placeholder === true) {
      if (!children) {
        this.setState({
          disabled: true,
        });
      } else {
        this.setState({
          disabled: false,
        });
      }
    } else {
      this.setState({
        disabled,
      });
    }
  }
  clearPress(force) {
    toggleMoveClasses({
      element: this.container,
      root: this.rootElement,
      cssModule: this.props.cssModule,
    });
    const pressPosition = this.props.active && !force ? `${this.rootElement}--active` : null;
    this.setState({
      pressPosition,
    });
  }
  action() {
    if (this.props.action && this.button) {
      this.props.action(this.container);
    }
  }
  createBubble(event) {
    createBubbleEffect({
      event,
      button: this.button,
      content: this.content,
      className: getClassName(`${this.rootElement}__bubble`, this.props.cssModule),
    });
  }
  moveEvents() {
    const events = {
      onMouseLeave: () => {
        this.clearPress();
      },
      onMouseDown: (event) => {
        if (this.state.disabled === true ||
          this.props.blocked === true ||
          (event && event.nativeEvent.which !== 1)
        ) {
          return;
        }
        this.pressed = new Date().getTime();
        this.setState({
          pressPosition: `${this.rootElement}--active`,
        });
      },
      onMouseUp: (event) => {
        if (this.state.disabled === true ||
          this.props.blocked === true) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (this.clearTimer) {
          clearTimeout(this.clearTimer);
        }
        const diff = new Date().getTime() - this.pressed;
        if (this.props.bubbles === true) {
          this.createBubble(event);
        }
        if (typeof window !== 'undefined' && this.button) {
          const eventTrigger = new Event('action');
          this.button.dispatchEvent(eventTrigger);
        }
        this.action();
        this.clearTimer = setTimeout(() => {
          this.clearPress();
        }, ANIMATION_DELAY - diff);
      },
    };
    if (this.props.moveEvents === true) {
      events.onMouseMove = (event) => {
        if (this.state.disabled === true) {
          return;
        }
        const { button } = this;
        const { left } = button.getBoundingClientRect();
        const width = button.offsetWidth;
        const state = event.pageX < (left + (width * 0.3))
          ? 'left'
          : event.pageX > (left + (width * 0.65))
            ? 'right'
            : 'middle';
        toggleMoveClasses({
          element: this.container,
          root: this.rootElement,
          cssModule: this.props.cssModule,
          state,
        });
      };
    } else {
      events.onMouseEnter = () => {
        this.container.classList.add(classToModules([`${this.rootElement}--middle`], this.props.cssModule));
      };
    }
    return events;
  }
  render() {
    const RenderComponent = this.renderComponent;
    const {
      title,
      style,
      cssModule,
      children,
    } = this.props;
    return (
      <RenderComponent
        style={style}
        className={this.getRootClassName()}
        role="button"
        title={title}
        {... this.extraProps}
        {... this.moveEvents()}
      >
        <span
          ref={(button) => { this.button = button; }}
          className={getClassName(`${this.rootElement}__wrapper`, cssModule)}
        >
          <span
            ref={(content) => { this.content = content; }}
            className={getClassName(`${this.rootElement}__content`, cssModule)}
          >
            <span ref={(child) => { this.child = child; }}>{children}</span>
          </span>
        </span>
      </RenderComponent>
    );
  }
}
