import React from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';

import RoutableScene from '../../nav/RoutableScene';
import SpinnerOverlay from '../../components/SpinnerOverlay';

import ChatListComponent from '../../components/ChatListComponent';

import { loadAllUserChats } from '../../firebase/FirebaseConnector';
import { setBuyerAndListingDetails } from '../../reducers/ListingDetailReducer';

import styles from '../../../styles';
import colors from '../../../colors';

class ChatListScene extends RoutableScene {
  constructor(props) {
    super(props);

    this.state = {
      allChats: [],
      buyingChats: [],
      sellingChats: [],
      loading: true,
    };

    this.loadChatData = this.loadChatData.bind(this);
  }

  componentDidMount() {
    this.loadChatData();
  }

  loadChatData() {
    return loadAllUserChats()
      .then((allUserChats) => {
        const loadedBuyingChats = allUserChats.filter(
          (chatDetails) => chatDetails.type === 'buying');
        const loadedSellingChats = allUserChats.filter(
          (chatDetails) => chatDetails.type === 'selling');
        this.setState({
          loading: false,
          allChats: allUserChats,
          buyingChats: loadedBuyingChats,
          sellingChats: loadedSellingChats,
        });
      })
      .catch(console.log);
  }

  getChatListComponentForChats(chats, emptyMessage) {
    return (
      <ChatListComponent
        refresh={this.loadChatData}
        chats={chats}
        emptyMessage={emptyMessage}
        openChatScene={(data) => {
          this.props.setListingDetails(data.buyerUid, data.listingKey, data.listingData);
          this.goNext('chat');
        }}
      />
    );
  }

  renderWithNavBar() {
    if (this.state.loading) {
      return (
        <View style={styles.container}>
          <SpinnerOverlay isVisible />
        </View>
      );
    }

    return (
      <ScrollableTabView
        tabBarBackgroundColor={colors.secondary}
        tabBarUnderlineColor={colors.primary}
        tabBarActiveTextColor={colors.primary}
        style={styles.fullScreenContainer}
      >
        <View tabLabel="Buying" style={styles.container}>
          {this.getChatListComponentForChats(this.state.buyingChats,
            'No chats about items you might buy.')}
        </View>
        <View tabLabel="Selling" style={styles.container}>
          {this.getChatListComponentForChats(this.state.sellingChats,
            'No chats about items you\'re selling.')}
        </View>
      </ScrollableTabView>
    );
  }
}


const mapStateToProps = (state) => {
  return {};
};

const mapDispatchToProps = (dispatch) => {
  return {
    setListingDetails: (buyerUid, listingKey, listingData) => dispatch(
      setBuyerAndListingDetails(
        buyerUid,
        {
          key: listingKey,
          data: listingData,
        })
    ),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatListScene);
