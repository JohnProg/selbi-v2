import React, { Component } from 'react';
import { ScrollView, View, Text, ListView, RefreshControl } from 'react-native';

import ChatListItem from './ChatListItem';

import styles from '../../styles';

import { reportButtonPress } from '../SelbiAnalytics';

export default class ChatListComponent extends Component {
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.state = {
      dataSource: ds.cloneWithRows(props.chats),
      refreshing: false,
    };
    this.onRefresh = this.onRefresh.bind(this);
  }

  onRefresh() {
    this.setState({ refreshing: true });
    this.props.refresh()
      .then(() => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(this.props.chats),
          refreshing: false,
        });
      });
  }

  render() {
    const refreshController =
      <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />;

    if (this.props.chats.length === 0) {
      return (
        <ScrollView refreshControl={refreshController}>
          <View style={styles.paddedCenterContainer}>
            <Text style={styles.friendlyTextLeft}>{this.props.emptyMessage}</Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <ListView
        refreshControl={refreshController}
        enableEmptySections
        style={styles.container}
        removeClippedSubviews={false}
        dataSource={this.state.dataSource}
        renderRow={(data) => (
          <ChatListItem
            chatTitle={data.listingData.title}
            thumbnailUrl={data.listingData.images.image1.url}
            otherPersonDisplayName={data.otherPersonPublicData.displayName}
            chatType={data.type}
            openChatScene={() => {
              reportButtonPress(`open_chat_${data.type}`);
              this.props.openChatScene(data);
            }}
          />)}
      />
    );
  }
}

ChatListComponent.propTypes = {
  refresh: React.PropTypes.func.isRequired,
  openChatScene: React.PropTypes.func.isRequired,
  emptyMessage: React.PropTypes.string,
  chats: React.PropTypes.arrayOf((propValue, key) => {
    const chatData = propValue[key];
    if (!chatData.buyerUid
      || !chatData.listingKey
      || !chatData.listingData
      || !chatData.type) {
      return Error(`ChatData is missing a property ${JSON.stringify(chatData, undefined, 4)}`);
    }
    return undefined;
  }),
};
