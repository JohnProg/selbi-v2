import React, { Component } from 'react';
import { View, Text } from 'react-native';

import colors from '../../colors';

export default class EmojiAlignedText extends Component {
  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Text style={[this.props.style, { width: 40, textAlign: 'center', color: colors.black }]}>
          {`${this.props.emoji} `}
        </Text>
        <Text style={[this.props.style, { flex: 1, flexWrap: 'wrap', color: colors.black }]}>
          {this.props.children}
        </Text>
      </View>
    );
  }
}

EmojiAlignedText.propTypes = {
  style: React.PropTypes.any,
  children: React.PropTypes.node,
  emoji: React.PropTypes.string,
  initialIsOpen: React.PropTypes.bool,
};

EmojiAlignedText.defaultProps = {
  initialIsOpen: false,
};
